const AuthService = require('../services/authService');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido',
      });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido o expirado',
      });
    }

    // Obtener usuario completo (ya viene mapeado a camelCase desde getUserById)
    const usuario = await AuthService.getUserById(decoded.userId);
    if (!usuario) {
      return res.status(403).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    req.user = usuario;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar autenticación',
    });
  }
};

/**
 * Middleware opcional - verifica token si existe pero no falla si no existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      if (decoded) {
        const usuario = await AuthService.getUserById(decoded.userId);
        if (usuario) {
          req.user = usuario;
          req.userId = decoded.userId;
        }
      }
    }
    next();
  } catch (error) {
    // Si hay error, continuar sin autenticación
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};

