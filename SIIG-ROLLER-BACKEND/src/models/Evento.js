const {pool} = require('../config/database');
const crypto = require('crypto');

class Evento {
  static isUuid(value) {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
  }

  static async findById(id) {
    if (!this.isUuid(id)) return null;
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
    try {
      await pool.query(`
        ALTER TABLE eventos
          ALTER COLUMN logo_grupo TYPE TEXT,
          ALTER COLUMN lugar_destino TYPE TEXT
      `);
    } catch (_) {
      // columnas ya TEXT o tabla legacy distinta
    }
    // Legacy: hora/cita/salida como TIME fallan con "8:00 p. m." (PostgreSQL lee «p.» como huso horario)
    for (const col of ['hora', 'cita', 'salida', 'fecha_inicio']) {
      try {
        await pool.query(
          `ALTER TABLE eventos ALTER COLUMN ${col} TYPE TEXT USING ${col}::text`,
        );
      } catch (_) {}
    }
  }

  /** Convierte "8:00 p. m." / "20:30" a "HH:mm" para BD o muestra legible en TEXT. */
  static normalizeHoraText(value) {
    if (value == null || value === '') return null;
    const s = String(value).trim();
    if (!s) return null;
    const lower = s.toLowerCase().replace(/\s+/g, ' ');
    const pm = /\b(p\.?\s*m\.?|pm)\s*$/i.test(lower);
    const am = /\b(a\.?\s*m\.?|am)\s*$/i.test(lower);
    const core = lower.replace(/\b(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)\s*$/i, '').trim();
    const parts = core.split(':');
    if (parts.length < 2) return s;
    let h = parseInt(parts[0], 10);
    let m = parseInt(String(parts[1]).replace(/\D/g, ''), 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return s;
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  static parseFechaToYmd(fechaInput) {
    if (!fechaInput) return null;
    if (fechaInput instanceof Date) {
      const y = fechaInput.getFullYear();
      const m = String(fechaInput.getMonth() + 1).padStart(2, '0');
      const d = String(fechaInput.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof fechaInput === 'string') {
      const trimmed = fechaInput.trim();
      const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
      if (slash) {
        const dd = slash[1].padStart(2, '0');
        const mm = slash[2].padStart(2, '0');
        const yyyy = slash[3];
        return `${yyyy}-${mm}-${dd}`;
      }
      const iso = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
      if (iso) return iso[1];
    }
    return null;
  }

  static parseFecha(fechaInput) {
    const ymd = this.parseFechaToYmd(fechaInput);
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  static formatFechaForClient(dbEvento) {
    const fromInicio = this.parseFechaToYmd(dbEvento.fecha_inicio);
    if (fromInicio) return fromInicio;
    return this.parseFechaToYmd(dbEvento.fecha);
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

    const fechaParsed = this.parseFechaToYmd(fecha || fechaInicio);
    const horaRaw = (hora || cita || salida || '00:00').toString().trim();
    const horaValue = this.normalizeHoraText(horaRaw) || horaRaw;
    const citaValue = cita != null ? this.normalizeHoraText(cita) || String(cita).trim() : null;
    const salidaValue = salida != null ? this.normalizeHoraText(salida) || String(salida).trim() : null;
    const eventoId = this.isUuid(id) ? id : crypto.randomUUID();

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
      horaValue,
      puntoEncuentroLat || 0,
      puntoEncuentroLng || 0,
      puntoEncuentroDireccion || puntoSalida || null,
      organizadorId || null,
      tituloRuta || null,
      puntoSalida || null,
      fechaInicio || null,
      citaValue,
      salidaValue,
      nivel || null,
      logoGrupo || null,
      lugarDestino || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async getAll() {
    await this.ensureTable();
    await this.purgeExpired(2);
    const query = `
      SELECT *
      FROM eventos
      ORDER BY fecha ASC NULLS LAST, created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows || [];
  }

  static async purgeExpired(days = 2) {
    await this.ensureTable();
    const safeDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 2;
    const query = `
      DELETE FROM eventos
      WHERE COALESCE(
        CASE WHEN fecha IS NOT NULL THEN fecha::date END,
        CASE
          WHEN fecha_inicio ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$'
          THEN to_date(fecha_inicio, 'DD/MM/YYYY')
        END,
        created_at::date
      ) < (CURRENT_DATE - ($1::int * INTERVAL '1 day'))
    `;
    await pool.query(query, [safeDays]);
  }

  static async update(id, data) {
    if (!this.isUuid(id)) return null;
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
        finalValue = this.parseFechaToYmd(value);
      } else if (key === 'hora' || key === 'cita' || key === 'salida') {
        finalValue = this.normalizeHoraText(value) || String(value).trim();
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
    if (!this.isUuid(id)) return null;
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
      fecha: this.formatFechaForClient(dbEvento) || dbEvento.fecha_inicio,
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
