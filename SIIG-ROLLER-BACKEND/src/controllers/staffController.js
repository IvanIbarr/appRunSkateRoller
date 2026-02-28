const Usuario = require('../models/Usuario');
const Grupo = require('../models/Grupo');
const {validationResult} = require('express-validator');

/**
 * Promover usuario roller a staff (liderGrupo) - solo para líderes y administradores
 */
const createStaff = async (req, res) => {
  try {
    // Verificar que el usuario que hace la petición sea líder o administrador
    const userTipoPerfil = req.user.tipoPerfil;
    const userId = req.userId;
    
    if (userTipoPerfil !== 'liderGrupo' && userTipoPerfil !== 'administrador') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para agregar miembros del staff',
      });
    }

    // Validar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {email} = req.body;

    // Buscar usuario por email
    const dbUser = await Usuario.findByEmail(email);
    
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: 'El usuario no está registrado en la aplicación',
      });
    }

    // Verificar que el usuario tenga perfil "roller"
    if (dbUser.tipo_perfil !== 'roller') {
      if (dbUser.tipo_perfil === 'liderGrupo') {
        return res.status(400).json({
          success: false,
          error: 'Este usuario ya está dado de alta en el staff',
        });
      }
      return res.status(400).json({
        success: false,
        error: `El usuario ya tiene perfil "${dbUser.tipo_perfil}". Solo se pueden agregar usuarios con perfil "roller" al staff.`,
      });
    }

    // Obtener el grupo del líder (si existe)
    const grupoLider = await Grupo.findByLiderId(userId);
    let grupoId = null;
    
    if (grupoLider) {
      grupoId = grupoLider.id;
    }

    // Actualizar el perfil del usuario de "roller" a "liderGrupo" y asignarlo al grupo
    const updateData = {
      tipoPerfil: 'liderGrupo',
    };
    
    if (grupoId) {
      updateData.grupoId = grupoId;
    }

    const updatedUser = await Usuario.update(dbUser.id, updateData);

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar el perfil del usuario',
      });
    }

    // Mapear usuario a formato camelCase
    const usuario = Usuario.mapToCamelCase(updatedUser);

    // Devolver el usuario actualizado
    res.status(200).json({
      success: true,
      usuario,
      message: 'Usuario agregado al staff exitosamente',
    });
  } catch (error) {
    console.error('Error en createStaff controller:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Eliminar staff (revertir de liderGrupo a roller) - solo para líderes y administradores
 */
const removeStaff = async (req, res) => {
  try {
    // Verificar que el usuario que hace la petición sea líder o administrador
    const userTipoPerfil = req.user.tipoPerfil;
    const userId = req.userId;
    
    if (userTipoPerfil !== 'liderGrupo' && userTipoPerfil !== 'administrador') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar miembros del staff',
      });
    }

    // Validar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {email} = req.body;

    // Buscar usuario por email
    const dbUser = await Usuario.findByEmail(email);
    
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Verificar que el usuario tenga perfil "liderGrupo" (staff)
    if (dbUser.tipo_perfil !== 'liderGrupo') {
      return res.status(400).json({
        success: false,
        error: `El usuario tiene perfil "${dbUser.tipo_perfil}". Solo se pueden eliminar usuarios con perfil "liderGrupo" del staff.`,
      });
    }

    // Verificar que el usuario pertenezca al grupo del líder
    if (userTipoPerfil === 'liderGrupo') {
      const grupoLider = await Grupo.findByLiderId(userId);
      if (!grupoLider) {
        return res.status(400).json({
          success: false,
          error: 'No tienes un grupo creado',
        });
      }

      // Verificar que el usuario a eliminar pertenezca al mismo grupo
      if (dbUser.grupo_id !== grupoLider.id) {
        return res.status(403).json({
          success: false,
          error: 'El usuario no pertenece a tu grupo',
        });
      }
    }

    // No permitir que un líder se elimine a sí mismo
    if (dbUser.id === userId) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propio perfil de líder',
      });
    }

    // Actualizar el perfil del usuario de "liderGrupo" a "roller" y quitar grupo_id
    const updateData = {
      tipoPerfil: 'roller',
      grupoId: null, // Quitar del grupo
    };

    const updatedUser = await Usuario.update(dbUser.id, updateData);

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar el perfil del usuario',
      });
    }

    // Mapear usuario a formato camelCase
    const usuario = Usuario.mapToCamelCase(updatedUser);

    // Devolver el usuario actualizado
    res.status(200).json({
      success: true,
      usuario,
      message: 'Usuario eliminado del staff exitosamente. Ahora solo tiene acceso al chat general.',
    });
  } catch (error) {
    console.error('Error en removeStaff controller:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

module.exports = {
  createStaff,
  removeStaff,
};

