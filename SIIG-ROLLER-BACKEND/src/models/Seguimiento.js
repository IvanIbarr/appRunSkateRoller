const {pool} = require('../config/database');
const crypto = require('crypto');

class Seguimiento {
  /**
   * Crea una nueva sesión de seguimiento
   */
  static async create(userId, origen, destino) {
    const id = crypto.randomUUID();
    const query = `
      INSERT INTO seguimientos (id, usuario_id, origen, destino, activo, creado_en)
      VALUES ($1, $2::uuid, $3, $4, true, NOW())
      RETURNING *
    `;
    const values = [id, userId, origen, destino];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene una sesión de seguimiento por ID
   */
  static async getById(id) {
    const query = 'SELECT * FROM seguimientos WHERE id = $1::uuid';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Obtiene todas las sesiones activas de un usuario
   */
  static async getActiveByUserId(userId) {
    const query = 'SELECT * FROM seguimientos WHERE usuario_id = $1::uuid AND activo = true ORDER BY creado_en DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Finaliza una sesión de seguimiento
   */
  static async finish(id, userId) {
    const query = `
      UPDATE seguimientos 
      SET activo = false, finalizado_en = NOW()
      WHERE id = $1::uuid AND usuario_id = $2::uuid
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  /**
   * Agrega un punto de ubicación a una sesión
   */
  static async addLocationPoint(seguimientoId, latitude, longitude, accuracy, speed, timestamp) {
    const query = `
      INSERT INTO seguimiento_puntos (seguimiento_id, latitud, longitud, precision, velocidad, timestamp, creado_en)
      VALUES ($1::uuid, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const values = [seguimientoId, latitude, longitude, accuracy, speed, timestamp];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene todos los puntos de una sesión de seguimiento
   */
  static async getLocationPoints(seguimientoId) {
    const query = `
      SELECT latitud, longitud, precision, velocidad, timestamp, creado_en
      FROM seguimiento_puntos
      WHERE seguimiento_id = $1::uuid
      ORDER BY creado_en ASC
    `;
    const result = await pool.query(query, [seguimientoId]);
    return result.rows;
  }

  /**
   * Obtiene el último punto de una sesión
   */
  static async getLastLocationPoint(seguimientoId) {
    const query = `
      SELECT latitud, longitud, precision, velocidad, timestamp, creado_en
      FROM seguimiento_puntos
      WHERE seguimiento_id = $1::uuid
      ORDER BY creado_en DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [seguimientoId]);
    return result.rows[0];
  }

  /**
   * Obtiene el historial de seguimientos finalizados de un usuario
   * @param {string} userId - ID del usuario
   * @param {object} filters - Filtros opcionales: {period: 'week'|'month'|'year'|'all'}
   */
  static async getHistoryByUserId(userId, filters = {}) {
    let query = `
      SELECT * FROM seguimientos 
      WHERE usuario_id = $1::uuid AND activo = false
    `;
    const values = [userId];
    let paramIndex = 2;

    // Aplicar filtros de fecha
    if (filters.period) {
      const now = new Date();
      let dateFilter = '';

      switch (filters.period) {
        case 'week':
          dateFilter = `AND creado_en >= NOW() - INTERVAL '7 days'`;
          break;
        case 'month':
          dateFilter = `AND creado_en >= NOW() - INTERVAL '30 days'`;
          break;
        case 'year':
          dateFilter = `AND creado_en >= NOW() - INTERVAL '365 days'`;
          break;
        case 'all':
        default:
          // Sin filtro de fecha
          break;
      }

      if (dateFilter) {
        query += ` ${dateFilter}`;
      }
    }

    query += ` ORDER BY creado_en DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Calcula estadísticas de un seguimiento
   * @param {string} seguimientoId - ID del seguimiento
   */
  static async calculateStats(seguimientoId) {
    // Obtener seguimiento
    const seguimiento = await this.getById(seguimientoId);
    if (!seguimiento) {
      return null;
    }

    // Obtener todos los puntos
    const puntos = await this.getLocationPoints(seguimientoId);

    if (puntos.length === 0) {
      return {
        distanciaTotal: 0,
        velocidadPromedio: 0,
        velocidadMaxima: 0,
        duracion: 0,
        numPuntos: 0,
      };
    }

    // Calcular distancia total (suma de distancias entre puntos consecutivos)
    let distanciaTotal = 0;
    for (let i = 1; i < puntos.length; i++) {
      const prev = puntos[i - 1];
      const curr = puntos[i];
      const distancia = this.calculateDistance(
        prev.latitud,
        prev.longitud,
        curr.latitud,
        curr.longitud,
      );
      distanciaTotal += distancia;
    }

    // Calcular velocidades
    const velocidades = puntos
      .map(p => p.velocidad)
      .filter(v => v !== null && v !== undefined && v > 0);
    
    const velocidadPromedio = velocidades.length > 0
      ? velocidades.reduce((sum, v) => sum + v, 0) / velocidades.length
      : 0;
    
    const velocidadMaxima = velocidades.length > 0
      ? Math.max(...velocidades)
      : 0;

    // Calcular duración (en segundos)
    let duracion = 0;
    if (seguimiento.finalizado_en && seguimiento.creado_en) {
      const inicio = new Date(seguimiento.creado_en);
      const fin = new Date(seguimiento.finalizado_en);
      duracion = Math.floor((fin - inicio) / 1000);
    } else if (puntos.length > 1) {
      // Si no hay fecha de finalización, usar timestamps de los puntos
      const primerPunto = puntos[0];
      const ultimoPunto = puntos[puntos.length - 1];
      if (primerPunto.timestamp && ultimoPunto.timestamp) {
        duracion = Math.floor((ultimoPunto.timestamp - primerPunto.timestamp) / 1000);
      }
    }

    return {
      distanciaTotal, // en metros
      velocidadPromedio, // en m/s
      velocidadMaxima, // en m/s
      duracion, // en segundos
      numPuntos: puntos.length,
    };
  }

  /**
   * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Obtiene estadísticas agregadas del usuario
   * @param {string} userId - ID del usuario
   * @param {string} period - 'week'|'month'|'year'|'all'
   */
  static async getUserStats(userId, period = 'all') {
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = `AND creado_en >= NOW() - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = `AND creado_en >= NOW() - INTERVAL '30 days'`;
        break;
      case 'year':
        dateFilter = `AND creado_en >= NOW() - INTERVAL '365 days'`;
        break;
    }

    // Obtener seguimientos finalizados del período
    const seguimientos = await this.getHistoryByUserId(userId, {period});

    if (seguimientos.length === 0) {
      return {
        totalRecorridos: 0,
        totalKilometros: 0,
        velocidadPromedioGeneral: 0,
        duracionTotal: 0,
        recorridosSemana: 0,
        recorridosMes: 0,
      };
    }

    // Calcular estadísticas de cada seguimiento
    let totalKilometros = 0;
    let totalDuracion = 0;
    const velocidadesPromedio = [];

    for (const seguimiento of seguimientos) {
      const stats = await this.calculateStats(seguimiento.id);
      if (stats) {
        totalKilometros += stats.distanciaTotal / 1000; // convertir a km
        totalDuracion += stats.duracion;
        if (stats.velocidadPromedio > 0) {
          velocidadesPromedio.push(stats.velocidadPromedio);
        }
      }
    }

    const velocidadPromedioGeneral = velocidadesPromedio.length > 0
      ? velocidadesPromedio.reduce((sum, v) => sum + v, 0) / velocidadesPromedio.length
      : 0;

    // Contar recorridos por semana y mes
    const ahora = new Date();
    const semanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const mesAtras = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recorridosSemana = seguimientos.filter(s => {
      const fecha = new Date(s.creado_en);
      return fecha >= semanaAtras;
    }).length;

    const recorridosMes = seguimientos.filter(s => {
      const fecha = new Date(s.creado_en);
      return fecha >= mesAtras;
    }).length;

    return {
      totalRecorridos: seguimientos.length,
      totalKilometros: Math.round(totalKilometros * 100) / 100, // redondear a 2 decimales
      velocidadPromedioGeneral: Math.round(velocidadPromedioGeneral * 100) / 100, // en m/s
      duracionTotal: totalDuracion, // en segundos
      recorridosSemana,
      recorridosMes,
    };
  }

  /**
   * Obtiene el top de usuarios por kilómetros recorridos
   * @param {string} period - 'week'|'month'|'year'
   * @param {number} limit - cantidad de usuarios a devolver
   */
  static async getTopUsersByKm(period = 'week', limit = 10) {
    const {pool} = require('../config/database');
    const usersResult = await pool.query(
      'SELECT id, email, alias, avatar, foto_perfil FROM usuarios',
    );
    const users = usersResult.rows || [];
    const leaderboard = [];

    for (const user of users) {
      const seguimientos = await this.getHistoryByUserId(user.id, {period});
      if (seguimientos.length === 0) {
        continue;
      }

      let totalKilometros = 0;
      for (const seguimiento of seguimientos) {
        const stats = await this.calculateStats(seguimiento.id);
        if (stats) {
          totalKilometros += stats.distanciaTotal / 1000;
        }
      }

      if (totalKilometros > 0) {
        leaderboard.push({
          userId: user.id,
          email: user.email,
          alias: user.alias || null,
          avatar: user.avatar || null,
          fotoPerfil: user.foto_perfil || null,
          totalKilometros: Math.round(totalKilometros * 100) / 100,
          totalRecorridos: seguimientos.length,
        });
      }
    }

    leaderboard.sort((a, b) => b.totalKilometros - a.totalKilometros);
    return leaderboard.slice(0, limit);
  }
}

module.exports = Seguimiento;

