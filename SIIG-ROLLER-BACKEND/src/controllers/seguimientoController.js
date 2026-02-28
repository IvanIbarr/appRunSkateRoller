const Seguimiento = require('../models/Seguimiento');

/**
 * Crear una nueva sesión de seguimiento
 */
const createSeguimiento = async (req, res) => {
  try {
    const userId = req.user.id;
    const {origen, destino} = req.body;

    if (!origen || !destino) {
      return res.status(400).json({
        success: false,
        error: 'Origen y destino son requeridos',
      });
    }

    const seguimiento = await Seguimiento.create(userId, origen, destino);

    res.json({
      success: true,
      data: seguimiento,
    });
  } catch (error) {
    console.error('Error creando seguimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Obtener una sesión de seguimiento por ID (público para compartir)
 */
const getSeguimiento = async (req, res) => {
  try {
    const {id} = req.params;
    const seguimiento = await Seguimiento.getById(id);

    if (!seguimiento) {
      return res.status(404).json({
        success: false,
        error: 'Seguimiento no encontrado',
      });
    }

    // Obtener puntos de ubicación
    const puntos = await Seguimiento.getLocationPoints(id);
    const ultimoPunto = await Seguimiento.getLastLocationPoint(id);

    res.json({
      success: true,
      data: {
        ...seguimiento,
        puntos,
        ultimoPunto,
      },
    });
  } catch (error) {
    console.error('Error obteniendo seguimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Obtener seguimientos activos del usuario
 */
const getActiveSeguimientos = async (req, res) => {
  try {
    const userId = req.user.id;
    const seguimientos = await Seguimiento.getActiveByUserId(userId);

    res.json({
      success: true,
      data: seguimientos,
    });
  } catch (error) {
    console.error('Error obteniendo seguimientos activos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Finalizar un seguimiento
 */
const finishSeguimiento = async (req, res) => {
  try {
    const userId = req.user.id;
    const {id} = req.params;

    const seguimiento = await Seguimiento.finish(id, userId);

    if (!seguimiento) {
      return res.status(404).json({
        success: false,
        error: 'Seguimiento no encontrado o ya finalizado',
      });
    }

    res.json({
      success: true,
      data: seguimiento,
    });
  } catch (error) {
    console.error('Error finalizando seguimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Agregar un punto de ubicación a un seguimiento
 */
const addLocationPoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const {seguimientoId, latitude, longitude, accuracy, speed, timestamp} = req.body;

    if (!seguimientoId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'seguimientoId, latitude y longitude son requeridos',
      });
    }

    // Verificar que el seguimiento pertenece al usuario y está activo
    const seguimiento = await Seguimiento.getById(seguimientoId);
    if (!seguimiento) {
      return res.status(404).json({
        success: false,
        error: 'Seguimiento no encontrado',
      });
    }
    // Comparar UUIDs como strings (normalizados)
    const seguimientoUserId = String(seguimiento.usuario_id);
    const requestUserId = String(userId);
    if (seguimientoUserId !== requestUserId || !seguimiento.activo) {
      return res.status(403).json({
        success: false,
        error: 'Seguimiento no encontrado o no activo',
      });
    }

    const punto = await Seguimiento.addLocationPoint(
      seguimientoId,
      latitude,
      longitude,
      accuracy || null,
      speed || null,
      timestamp || Date.now(),
    );

    res.json({
      success: true,
      data: punto,
    });
  } catch (error) {
    console.error('Error agregando punto de ubicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Obtener historial de seguimientos finalizados del usuario
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const {period = 'all'} = req.query; // 'week', 'month', 'year', 'all'

    const seguimientos = await Seguimiento.getHistoryByUserId(userId, {period});

    // Obtener estadísticas básicas para cada seguimiento
    const seguimientosConStats = await Promise.all(
      seguimientos.map(async (seguimiento) => {
        const stats = await Seguimiento.calculateStats(seguimiento.id);
        return {
          ...seguimiento,
          stats: stats || {
            distanciaTotal: 0,
            velocidadPromedio: 0,
            velocidadMaxima: 0,
            duracion: 0,
            numPuntos: 0,
          },
        };
      }),
    );

    res.json({
      success: true,
      data: seguimientosConStats,
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Obtener estadísticas de un seguimiento específico
 */
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const {id} = req.params;

    // Verificar que el seguimiento pertenece al usuario
    const seguimiento = await Seguimiento.getById(id);
    if (!seguimiento) {
      return res.status(404).json({
        success: false,
        error: 'Seguimiento no encontrado',
      });
    }

    const seguimientoUserId = String(seguimiento.usuario_id);
    const requestUserId = String(userId);
    if (seguimientoUserId !== requestUserId) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado',
      });
    }

    const stats = await Seguimiento.calculateStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Obtener estadísticas agregadas del usuario
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const {period = 'all'} = req.query; // 'week', 'month', 'year', 'all'

    const stats = await Seguimiento.getUserStats(userId, period);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Obtener leaderboard de usuarios por kilómetros recorridos
 */
const getLeaderboard = async (req, res) => {
  try {
    const {period = 'week', limit = '10'} = req.query; // 'week', 'month', 'year'
    const parsedLimit = Number(limit) || 10;
    const safeLimit = Math.min(Math.max(parsedLimit, 1), 50);
    const safePeriod = ['week', 'month', 'year'].includes(period) ? period : 'week';

    const leaderboard = await Seguimiento.getTopUsersByKm(safePeriod, safeLimit);

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

module.exports = {
  createSeguimiento,
  getSeguimiento,
  getActiveSeguimientos,
  finishSeguimiento,
  addLocationPoint,
  getHistory,
  getStats,
  getUserStats,
  getLeaderboard,
};

