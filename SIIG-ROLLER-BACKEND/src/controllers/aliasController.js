const Usuario = require('../models/Usuario');
const {validationResult} = require('express-validator');

/**
 * Agregar alias al usuario (primera vez)
 */
const agregarAlias = async (req, res) => {
  try {
    const userId = req.userId;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {alias} = req.body;

    if (!alias || !alias.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El alias es requerido',
      });
    }

    const aliasTrimmed = alias.trim();

    // Verificar si el alias ya existe en otro usuario
    const pool = require('../config/database').pool;
    const aliasExistsResult = await pool.query(
      'SELECT id FROM usuarios WHERE alias = $1 AND id != $2',
      [aliasTrimmed, userId]
    );

    if (aliasExistsResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este alias ya está en uso por otro usuario',
      });
    }

    // Obtener usuario actual
    const usuario = await Usuario.findById(userId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Si ya tiene alias, no puede agregar otro
    if (usuario.alias) {
      return res.status(400).json({
        success: false,
        error: 'Ya tienes un alias. Usa la opción "Cambiar Alias" para modificarlo',
      });
    }

    // Agregar alias (alias_cambios permanece en 0)
    const usuarioActualizado = await Usuario.update(userId, {
      alias: aliasTrimmed,
    });

    if (!usuarioActualizado) {
      return res.status(500).json({
        success: false,
        error: 'Error al agregar alias',
      });
    }

    const usuarioMapeado = Usuario.mapToCamelCase(usuarioActualizado);

    res.json({
      success: true,
      usuario: usuarioMapeado,
      message: 'Alias agregado exitosamente',
    });
  } catch (error) {
    console.error('Error en agregarAlias:', error);
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

/**
 * Cambiar alias del usuario (máximo 3 cambios)
 */
const cambiarAlias = async (req, res) => {
  try {
    const userId = req.userId;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {alias} = req.body;

    if (!alias || !alias.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El alias es requerido',
      });
    }

    const aliasTrimmed = alias.trim();

    // Verificar si el alias ya existe en otro usuario
    const pool = require('../config/database').pool;
    const aliasExistsResult = await pool.query(
      'SELECT id FROM usuarios WHERE alias = $1 AND id != $2',
      [aliasTrimmed, userId]
    );

    if (aliasExistsResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este alias ya está en uso por otro usuario',
      });
    }

    // Obtener usuario actual
    const usuario = await Usuario.findById(userId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Si no tiene alias, debe usar "Agregar Alias"
    if (!usuario.alias) {
      return res.status(400).json({
        success: false,
        error: 'No tienes un alias. Usa la opción "Agregar Alias" primero',
      });
    }

    const aliasCambiosActuales = usuario.alias_cambios || 0;

    // Verificar que no haya excedido el límite de 3 cambios
    if (aliasCambiosActuales >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Has alcanzado el límite de cambios de alias (3 cambios máximos)',
      });
    }

    // Actualizar alias e incrementar contador
    const usuarioActualizado = await Usuario.update(userId, {
      alias: aliasTrimmed,
      alias_cambios: aliasCambiosActuales + 1,
    });

    if (!usuarioActualizado) {
      return res.status(500).json({
        success: false,
        error: 'Error al cambiar alias',
      });
    }

    const usuarioMapeado = Usuario.mapToCamelCase(usuarioActualizado);
    const cambiosRestantes = 3 - usuarioMapeado.aliasCambios;

    res.json({
      success: true,
      usuario: usuarioMapeado,
      cambiosRestantes,
      message: `Alias cambiado exitosamente. Te quedan ${cambiosRestantes} cambio${cambiosRestantes !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error en cambiarAlias:', error);
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

/**
 * Obtener información del alias del usuario
 */
const getAlias = async (req, res) => {
  try {
    const userId = req.userId;
    const usuario = await Usuario.findById(userId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const usuarioMapeado = Usuario.mapToCamelCase(usuario);
    const cambiosRestantes = usuarioMapeado.alias ? (3 - (usuarioMapeado.aliasCambios || 0)) : null;

    res.json({
      success: true,
      alias: usuarioMapeado.alias || null,
      aliasCambios: usuarioMapeado.aliasCambios || 0,
      cambiosRestantes,
    });
  } catch (error) {
    console.error('Error en getAlias:', error);
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

module.exports = {
  agregarAlias,
  cambiarAlias,
  getAlias,
};
