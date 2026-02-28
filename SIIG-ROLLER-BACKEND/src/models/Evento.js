const {pool} = require('../config/database');

class Evento {
  static async findById(id) {
    await this.ensureTable();
    const query = 'SELECT * FROM eventos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async ensureTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS eventos (
        id TEXT PRIMARY KEY,
        titulo TEXT,
        fecha DATE,
        hora TEXT,
        punto_encuentro_lat DOUBLE PRECISION,
        punto_encuentro_lng DOUBLE PRECISION,
        punto_encuentro_direccion TEXT,
        organizador_id TEXT,
        titulo_ruta TEXT,
        punto_salida TEXT,
        fecha_inicio TEXT,
        cita TEXT,
        salida TEXT,
        nivel TEXT,
        logo_grupo TEXT,
        lugar_destino TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await pool.query(query);
  }

  static parseFecha(fechaInput) {
    if (!fechaInput) return null;
    if (fechaInput instanceof Date) return fechaInput;
    if (typeof fechaInput === 'string') {
      if (fechaInput.includes('/')) {
        const [day, month, year] = fechaInput.split('/').map(Number);
        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
          return new Date(year, month - 1, day);
        }
      }
      const parsed = new Date(fechaInput);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  static async create(data) {
    await this.ensureTable();
    const {
      id,
      titulo,
      fecha,
      hora,
      puntoEncuentroLat,
      puntoEncuentroLng,
      puntoEncuentroDireccion,
      organizadorId,
      tituloRuta,
      puntoSalida,
      fechaInicio,
      cita,
      salida,
      nivel,
      logoGrupo,
      lugarDestino,
    } = data;

    const fechaParsed = this.parseFecha(fecha || fechaInicio);
    const eventoId = id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const query = `
      INSERT INTO eventos (
        id,
        titulo,
        fecha,
        hora,
        punto_encuentro_lat,
        punto_encuentro_lng,
        punto_encuentro_direccion,
        organizador_id,
        titulo_ruta,
        punto_salida,
        fecha_inicio,
        cita,
        salida,
        nivel,
        logo_grupo,
        lugar_destino
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        fecha = EXCLUDED.fecha,
        hora = EXCLUDED.hora,
        punto_encuentro_lat = EXCLUDED.punto_encuentro_lat,
        punto_encuentro_lng = EXCLUDED.punto_encuentro_lng,
        punto_encuentro_direccion = EXCLUDED.punto_encuentro_direccion,
        organizador_id = EXCLUDED.organizador_id,
        titulo_ruta = EXCLUDED.titulo_ruta,
        punto_salida = EXCLUDED.punto_salida,
        fecha_inicio = EXCLUDED.fecha_inicio,
        cita = EXCLUDED.cita,
        salida = EXCLUDED.salida,
        nivel = EXCLUDED.nivel,
        logo_grupo = EXCLUDED.logo_grupo,
        lugar_destino = EXCLUDED.lugar_destino,
        updated_at = NOW()
      RETURNING *
    `;
    const values = [
      eventoId,
      titulo || tituloRuta || null,
      fechaParsed,
      hora || null,
      puntoEncuentroLat || 0,
      puntoEncuentroLng || 0,
      puntoEncuentroDireccion || puntoSalida || null,
      organizadorId || null,
      tituloRuta || null,
      puntoSalida || null,
      fechaInicio || null,
      cita || null,
      salida || null,
      nivel || null,
      logoGrupo || null,
      lugarDestino || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async getAll() {
    await this.ensureTable();
    const query = `
      SELECT *
      FROM eventos
      ORDER BY fecha ASC NULLS LAST, created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows || [];
  }

  static async update(id, data) {
    await this.ensureTable();
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const mapping = {
      titulo: 'titulo',
      fecha: 'fecha',
      hora: 'hora',
      puntoEncuentroLat: 'punto_encuentro_lat',
      puntoEncuentroLng: 'punto_encuentro_lng',
      puntoEncuentroDireccion: 'punto_encuentro_direccion',
      organizadorId: 'organizador_id',
      tituloRuta: 'titulo_ruta',
      puntoSalida: 'punto_salida',
      fechaInicio: 'fecha_inicio',
      cita: 'cita',
      salida: 'salida',
      nivel: 'nivel',
      logoGrupo: 'logo_grupo',
      lugarDestino: 'lugar_destino',
    };

    for (const [key, value] of Object.entries(data)) {
      if (!(key in mapping)) continue;
      if (value === undefined) continue;
      let finalValue = value;
      if (key === 'fecha') {
        finalValue = this.parseFecha(value);
      }
      fields.push(`${mapping[key]} = $${paramIndex}`);
      values.push(finalValue);
      paramIndex++;
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    const query = `
      UPDATE eventos
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    await this.ensureTable();
    const query = 'DELETE FROM eventos WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static mapToCamelCase(dbEvento) {
    if (!dbEvento) return null;
    return {
      id: dbEvento.id,
      titulo: dbEvento.titulo,
      fecha: dbEvento.fecha,
      hora: dbEvento.hora,
      puntoEncuentroLat: dbEvento.punto_encuentro_lat,
      puntoEncuentroLng: dbEvento.punto_encuentro_lng,
      puntoEncuentroDireccion: dbEvento.punto_encuentro_direccion,
      organizadorId: dbEvento.organizador_id,
      tituloRuta: dbEvento.titulo_ruta,
      puntoSalida: dbEvento.punto_salida,
      fechaInicio: dbEvento.fecha_inicio,
      cita: dbEvento.cita,
      salida: dbEvento.salida,
      nivel: dbEvento.nivel,
      logoGrupo: dbEvento.logo_grupo,
      lugarDestino: dbEvento.lugar_destino,
      createdAt: dbEvento.created_at,
      updatedAt: dbEvento.updated_at,
    };
  }
}

module.exports = Evento;
