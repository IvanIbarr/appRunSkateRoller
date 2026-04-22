const {pool} = require('../config/database');

class Usuario {
  /**
   * Busca un usuario por email
   */
  static async findByEmail(email) {
    const emailNorm = String(email || '')
      .trim()
      .toLowerCase();
    const query = 'SELECT * FROM usuarios WHERE LOWER(TRIM(email)) = $1';
    const result = await pool.query(query, [emailNorm]);
    return result.rows[0] || null;
  }

  /**
   * Busca un usuario por ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Crea un nuevo usuario
   */
  static async create(usuarioData) {
    const {
      email,
      passwordHash,
      edad,
      cumpleaños,
      sexo,
      nacionalidad,
      tipoPerfil,
      logo,
      avatar,
      fotoPerfil,
    } = usuarioData;

    const emailStored = String(email || '')
      .trim()
      .toLowerCase();

    const query = `
      INSERT INTO usuarios (
        email, 
        password_hash, 
        edad, 
        cumpleaños, 
        sexo, 
        nacionalidad, 
        tipo_perfil,
        logo,
        avatar,
        foto_perfil
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, edad, cumpleaños, sexo, nacionalidad, tipo_perfil, foto_perfil, logo, avatar, fecha_registro, created_at, updated_at
    `;

    const values = [
      emailStored,
      passwordHash,
      edad,
      cumpleaños,
      sexo,
      nacionalidad,
      tipoPerfil || 'roller',
      logo || null,
      avatar || null,
      fotoPerfil || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Actualiza un usuario
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'edad',
      'cumpleaños',
      'sexo',
      'nacionalidad',
      'tipo_perfil',
      'foto_perfil',
      'logo',
      'grupo_id',
      'alias',
      'alias_cambios',
      'nombramiento',
      'avatar',
      'telefono',
    ];

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
      UPDATE usuarios 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Actualiza la contraseña de un usuario
   */
  static async updatePassword(id, passwordHash) {
    const query = `
      UPDATE usuarios
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email
    `;
    const result = await pool.query(query, [passwordHash, id]);
    return result.rows[0] || null;
  }

  /**
   * Mapea los campos de la base de datos a formato camelCase
   */
  static mapToCamelCase(dbUser) {
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      edad: dbUser.edad,
      cumpleaños: dbUser.cumpleaños ? new Date(dbUser.cumpleaños) : null,
      sexo: dbUser.sexo,
      nacionalidad: dbUser.nacionalidad,
      tipoPerfil: dbUser.tipo_perfil,
      fotoPerfil: dbUser.foto_perfil,
      logo: dbUser.logo,
      grupoId: dbUser.grupo_id || null, // Puede no existir si la columna aún no se ha creado
      alias: dbUser.alias || null,
      aliasCambios: dbUser.alias_cambios || 0,
      nombramiento: dbUser.nombramiento || null,
      avatar: dbUser.avatar || null,
      telefono: dbUser.telefono || null,
      fechaRegistro: dbUser.fecha_registro ? new Date(dbUser.fecha_registro) : null,
      createdAt: dbUser.created_at ? new Date(dbUser.created_at) : null,
      updatedAt: dbUser.updated_at ? new Date(dbUser.updated_at) : null,
    };
  }
}

module.exports = Usuario;

