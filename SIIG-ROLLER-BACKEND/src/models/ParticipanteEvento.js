const {pool} = require('../config/database');

class ParticipanteEvento {
  static async register(eventoId, usuarioId) {
    await pool.query(
      `INSERT INTO participantes_evento (evento_id, usuario_id)
       VALUES ($1, $2)
       ON CONFLICT (evento_id, usuario_id) DO NOTHING`,
      [eventoId, usuarioId],
    );
  }

  static async unregister(eventoId, usuarioId) {
    await pool.query(
      `DELETE FROM participantes_evento WHERE evento_id = $1 AND usuario_id = $2`,
      [eventoId, usuarioId],
    );
  }

  static async countByEvento(eventoId) {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM participantes_evento WHERE evento_id = $1`,
      [eventoId],
    );
    return r.rows[0]?.c ?? 0;
  }

  static async countsForEventos(eventoIds) {
    if (!eventoIds?.length) return {};
    const r = await pool.query(
      `SELECT evento_id, COUNT(*)::int AS c
       FROM participantes_evento
       WHERE evento_id = ANY($1::uuid[])
       GROUP BY evento_id`,
      [eventoIds],
    );
    const map = {};
    for (const row of r.rows) {
      map[row.evento_id] = row.c;
    }
    return map;
  }

  static async registeredEventoIdsForUser(usuarioId, eventoIds) {
    if (!usuarioId || !eventoIds?.length) return new Set();
    const r = await pool.query(
      `SELECT evento_id FROM participantes_evento
       WHERE usuario_id = $1 AND evento_id = ANY($2::uuid[])`,
      [usuarioId, eventoIds],
    );
    return new Set(r.rows.map((row) => row.evento_id));
  }
}

module.exports = ParticipanteEvento;
