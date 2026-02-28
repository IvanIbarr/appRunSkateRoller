const {pool} = require('../config/database');

class Grupo {
  /**
   * Busca un grupo por ID
   */
  static async findById(id) {
    const query = `
      SELECT id, nombre_grupo, lider_id, created_at, updated_at 
      FROM grupos 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca un grupo por líder ID
   */
  static async findByLiderId(liderId) {
    try {
      const query = `
        SELECT id, nombre_grupo, lider_id, created_at, updated_at 
        FROM grupos 
        WHERE lider_id = $1
      `;
      const result = await pool.query(query, [liderId]);
      return result.rows[0] || null;
    } catch (error) {
      // Si la tabla no existe, retornar null (no hay grupo)
      if (error.message && error.message.includes('does not exist')) {
        console.warn('Tabla grupos no existe todavía. Ejecuta el script SQL primero.');
        return null;
      }
      throw error;
    }
  }

  /**
   * Crea un nuevo grupo
   */
  static async create(grupoData) {
    const {nombreGrupo, liderId} = grupoData;

    const query = `
      INSERT INTO grupos (nombre_grupo, lider_id)
      VALUES ($1, $2)
      RETURNING id, nombre_grupo, lider_id, created_at, updated_at
    `;

    const values = [nombreGrupo, liderId];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Actualiza un grupo
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['nombre_grupo'];

    for (const [key, value] of Object.entries(updateData)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey) && value !== undefined) {
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE grupos 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, nombre_grupo, lider_id, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Crea o actualiza el grupo de un líder (upsert)
   */
  static async createOrUpdate(liderId, nombreGrupo) {
    try {
      // Intentar encontrar grupo existente
      const grupoExistente = await this.findByLiderId(liderId);

      if (grupoExistente) {
        // Actualizar grupo existente
        return await this.update(grupoExistente.id, {nombreGrupo});
      } else {
        // Crear nuevo grupo
        return await this.create({nombreGrupo, liderId});
      }
    } catch (error) {
      console.error('Error en createOrUpdate grupo:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios de un grupo
   */
  static async getUsuariosByGrupoId(grupoId) {
    const query = `
      SELECT *
      FROM usuarios
      WHERE grupo_id = $1
      ORDER BY fecha_registro ASC
    `;
    const result = await pool.query(query, [grupoId]);
    return result.rows;
  }

  /**
   * Mapea los campos de la base de datos a formato camelCase
   */
  static mapToCamelCase(dbGrupo) {
    if (!dbGrupo) return null;

    return {
      id: dbGrupo.id,
      nombreGrupo: dbGrupo.nombre_grupo,
      liderId: dbGrupo.lider_id,
      createdAt: dbGrupo.created_at ? new Date(dbGrupo.created_at) : null,
      updatedAt: dbGrupo.updated_at ? new Date(dbGrupo.updated_at) : null,
    };
  }
}

module.exports = Grupo;

