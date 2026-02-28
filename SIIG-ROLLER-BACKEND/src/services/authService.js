const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_default';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  /**
   * Genera hash de contraseña
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara contraseña con hash
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Genera token JWT
   */
  static generateToken(userId) {
    return jwt.sign({userId}, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * Verifica token JWT
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Login de usuario
   */
  static async login(email, password) {
    try {
      // Buscar usuario por email (incluye password_hash)
      const query = 'SELECT * FROM usuarios WHERE email = $1';
      const {pool} = require('../config/database');
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Credenciales incorrectas',
        };
      }

      const dbUser = result.rows[0];

      // Verificar contraseña
      const isPasswordValid = await this.comparePassword(
        password,
        dbUser.password_hash,
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Credenciales incorrectas',
        };
      }

      // Generar token
      const token = this.generateToken(dbUser.id);

      // Mapear usuario (sin password)
      const usuario = Usuario.mapToCamelCase(dbUser);

      return {
        success: true,
        usuario,
        token,
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: 'Error al iniciar sesión',
      };
    }
  }

  /**
   * Registro de nuevo usuario
   */
  static async registro(registroData) {
    try {
      const {
        email,
        password,
        edad,
        cumpleaños,
        sexo,
        nacionalidad,
        tipoPerfil,
        avatar,
      fotoPerfil,
      } = registroData;

      // Verificar si el email ya existe
      const usuarioExistente = await Usuario.findByEmail(email);
      if (usuarioExistente) {
        return {
          success: false,
          error: 'El email ya está registrado',
        };
      }

      // Hash de contraseña
      const passwordHash = await this.hashPassword(password);

      // Crear usuario
      const nuevoUsuario = await Usuario.create({
        email,
        passwordHash,
        edad,
        cumpleaños: new Date(cumpleaños),
        sexo,
        nacionalidad,
        tipoPerfil: tipoPerfil || 'roller',
        logo: null, // Logo por defecto
        avatar: avatar || null,
        fotoPerfil: fotoPerfil || null,
      });

      // Generar token
      const token = this.generateToken(nuevoUsuario.id);

      // Mapear usuario
      const usuario = Usuario.mapToCamelCase(nuevoUsuario);

      return {
        success: true,
        usuario,
        token,
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: 'Error al registrar usuario',
      };
    }
  }

  /**
   * Obtiene usuario por ID (para verificar token)
   */
  static async getUserById(userId) {
    try {
      const dbUser = await Usuario.findById(userId);
      if (!dbUser) {
        return null;
      }
      return Usuario.mapToCamelCase(dbUser);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }
}

module.exports = AuthService;

