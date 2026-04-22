const {pool} = require('../config/database');

/**
 * ¿existen columnas de adjuntos?
 *
 * Nota: NO cacheamos en false, porque la migración puede ejecutarse mientras el backend está corriendo.
 */
let adjuntoColumnsCacheTrue = false;

async function hasAdjuntoColumns() {
  if (adjuntoColumnsCacheTrue) {
    return true;
  }
  try {
    const r = await pool.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'mensajes'
        AND column_name = 'adjunto_url'
      LIMIT 1
    `,
    );
    const ok = r.rows.length > 0;
    if (ok) {
      adjuntoColumnsCacheTrue = true;
    }
    return ok;
  } catch {
    return false;
  }
}

class Mensaje {
  /**
   * Crea un nuevo mensaje (con adjuntos si existen columnas en BD).
   */
  static async create(mensajeData) {
    const {chatType, usuarioId, texto, adjuntoUrl, adjuntoTipo} = mensajeData;
    const hasAdj = await hasAdjuntoColumns();

    if (hasAdj) {
      const query = `
      INSERT INTO mensajes (chat_type, usuario_id, texto, adjunto_url, adjunto_tipo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, chat_type, usuario_id, texto, adjunto_url, adjunto_tipo, created_at
    `;
      const values = [
        chatType,
        usuarioId,
        texto ?? '',
        adjuntoUrl || null,
        adjuntoTipo || null,
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    }

    if (adjuntoUrl || adjuntoTipo) {
      const err = new Error(
        'La base de datos no tiene columnas de adjuntos. Ejecuta: scripts/alter-mensajes-adjuntos.sql',
      );
      err.code = 'ADJUNTO_MIGRATION_REQUIRED';
      throw err;
    }

    const query = `
      INSERT INTO mensajes (chat_type, usuario_id, texto)
      VALUES ($1, $2, $3)
      RETURNING id, chat_type, usuario_id, texto, created_at
    `;
    const values = [chatType, usuarioId, texto ?? ''];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene mensajes de un chat específico de los últimos 7 días
   */
  static async findByChatType(chatType) {
    const hasAdj = await hasAdjuntoColumns();

    const selectAdjunto = hasAdj
      ? `m.adjunto_url,
        m.adjunto_tipo,`
      : `NULL::text AS adjunto_url,
        NULL::varchar(16) AS adjunto_tipo,`;

    const query = `
      SELECT 
        m.id,
        m.chat_type,
        m.usuario_id,
        m.texto,
        ${selectAdjunto}
        m.created_at,
        u.email as usuario_email,
        u.alias as usuario_alias,
        u.tipo_perfil as usuario_tipo_perfil
      FROM mensajes m
      INNER JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.chat_type = $1
        AND m.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY m.created_at ASC
    `;

    const result = await pool.query(query, [chatType]);
    return result.rows;
  }

  /**
   * Obtiene mensajes más recientes después de una fecha específica
   */
  static async findRecentByChatType(chatType, afterDate) {
    const hasAdj = await hasAdjuntoColumns();

    const selectAdjunto = hasAdj
      ? `m.adjunto_url,
        m.adjunto_tipo,`
      : `NULL::text AS adjunto_url,
        NULL::varchar(16) AS adjunto_tipo,`;

    const query = `
      SELECT 
        m.id,
        m.chat_type,
        m.usuario_id,
        m.texto,
        ${selectAdjunto}
        m.created_at,
        u.email as usuario_email,
        u.alias as usuario_alias,
        u.tipo_perfil as usuario_tipo_perfil
      FROM mensajes m
      INNER JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.chat_type = $1
        AND m.created_at >= $2
        AND m.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY m.created_at ASC
    `;

    const result = await pool.query(query, [chatType, afterDate]);
    return result.rows;
  }

  /**
   * Elimina mensajes antiguos (más de 7 días)
   */
  static async deleteOldMessages() {
    const query = `
      DELETE FROM mensajes
      WHERE created_at < NOW() - INTERVAL '7 days'
    `;
    const result = await pool.query(query);
    return result.rowCount;
  }

  /**
   * Mapea los campos de la base de datos a formato camelCase
   */
  static mapToCamelCase(dbMensaje) {
    if (!dbMensaje) return null;

    return {
      id: dbMensaje.id,
      chatType: dbMensaje.chat_type,
      userId: dbMensaje.usuario_id,
      text: dbMensaje.texto,
      attachmentUrl: dbMensaje.adjunto_url,
      attachmentType: dbMensaje.adjunto_tipo,
      createdAt: dbMensaje.created_at ? new Date(dbMensaje.created_at) : null,
      usuarioEmail: dbMensaje.usuario_email,
      usuarioAlias: dbMensaje.usuario_alias,
      usuarioTipoPerfil: dbMensaje.usuario_tipo_perfil,
    };
  }
}

module.exports = Mensaje;
