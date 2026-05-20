const Grupo = require('../models/Grupo');
const Usuario = require('../models/Usuario');
const {pool} = require('../config/database');
const {validationResult} = require('express-validator');

const GRUPOS_SETUP_HINT =
  'La tabla grupos no existe. Ejecuta: npm run db:grupos:setup (ver EJECUTAR-SQL-GRUPOS.md)';

function isGruposTableMissingError(error) {
  if (!error) return false;
  if (error.code === '42P01') return true;
  const msg = String(error.message || '');
  return /does not exist|no existe la relaci[oó]n/i.test(msg);
}

function respondGruposTableMissing(res) {
  return res.status(500).json({
    success: false,
    error: GRUPOS_SETUP_HINT,
  });
}

/**
 * Obtener el nombre del grupo (disponible para todos los usuarios del grupo)
 */
const getNombreGrupo = async (req, res) => {
  try {
    const userId = req.userId;
    const userTipoPerfil = req.user?.tipoPerfil;

    console.log(`[getNombreGrupo] Usuario ID: ${userId}, Tipo: ${userTipoPerfil}`);

    let grupo = null;
    let grupoId = null;

    // Intentar obtener grupoId de req.user primero (viene en camelCase)
    if (req.user && req.user.grupoId) {
      grupoId = req.user.grupoId;
      console.log(`[getNombreGrupo] grupoId obtenido de req.user: ${grupoId}`);
    } else {
      // Si no está en req.user, buscar el usuario directamente de la BD
      const usuario = await Usuario.findById(userId);
      if (usuario) {
        // El usuario de BD viene en snake_case
        grupoId = usuario.grupo_id;
        console.log(`[getNombreGrupo] grupoId obtenido de BD (findById): ${grupoId}`);
      }
    }

    // Si tenemos grupoId, buscar el grupo
    if (grupoId) {
      console.log(`[getNombreGrupo] Buscando grupo con ID: ${grupoId}`);
      grupo = await Grupo.findById(grupoId);
      if (grupo) {
        console.log(`[getNombreGrupo] ✅ Grupo encontrado: ${grupo.nombre_grupo}`);
      } else {
        console.log(`[getNombreGrupo] ❌ Grupo con ID ${grupoId} no encontrado en BD`);
      }
    } else {
      console.log(`[getNombreGrupo] ⚠️ Usuario no tiene grupoId asignado`);
    }
    
    // Si no se encontró por grupo_id, intentar buscar como líder (para compatibilidad)
    if (!grupo && (userTipoPerfil === 'liderGrupo' || userTipoPerfil === 'administrador')) {
      console.log(`[getNombreGrupo] Intentando buscar como líder...`);
      grupo = await Grupo.findByLiderId(userId);
      if (grupo) {
        console.log(`[getNombreGrupo] ✅ Grupo encontrado como líder: ${grupo.nombre_grupo}`);
      } else {
        console.log(`[getNombreGrupo] ❌ No se encontró grupo como líder`);
      }
    }
    
    if (!grupo) {
      console.log(`[getNombreGrupo] No se encontró grupo para el usuario`);
      return res.json({
        success: true,
        nombreGrupo: null,
      });
    }

    const grupoMapeado = Grupo.mapToCamelCase(grupo);
    console.log(`[getNombreGrupo] Nombre del grupo encontrado: ${grupoMapeado.nombreGrupo}`);

    res.json({
      success: true,
      nombreGrupo: grupoMapeado.nombreGrupo || null,
    });
  } catch (error) {
    console.error('Error en getNombreGrupo:', error);
    
    // Verificar si el error es porque la tabla no existe
    if (isGruposTableMissingError(error)) {
      return respondGruposTableMissing(res);
    }

    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

/**
 * Crear o actualizar el nombre del grupo (solo para líderes)
 */
const updateNombreGrupo = async (req, res) => {
  try {
    const userId = req.userId;
    const userTipoPerfil = req.user.tipoPerfil;

    // Verificar que el usuario sea líder o administrador
    if (userTipoPerfil !== 'liderGrupo' && userTipoPerfil !== 'administrador') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar el nombre del grupo',
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

    const {nombreGrupo} = req.body;

    if (!nombreGrupo || !nombreGrupo.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del grupo es requerido',
      });
    }

    const nombreNorm = nombreGrupo.trim();
    const grupoPrevio = await Grupo.findByLiderId(userId);

    const dup = await pool.query(
      `SELECT id FROM grupos
       WHERE LOWER(TRIM(nombre_grupo)) = LOWER($1)
         AND lider_id <> $2
       LIMIT 1`,
      [nombreNorm, userId],
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un grupo con ese nombre. Elige otro.',
      });
    }

    // Crear o actualizar el grupo
    const grupo = await Grupo.createOrUpdate(userId, nombreNorm);

    if (!grupo) {
      return res.status(500).json({
        success: false,
        error: 'Error al crear o actualizar el grupo',
      });
    }

    const grupoMapeado = Grupo.mapToCamelCase(grupo);

    // Asegurar que el líder pertenezca a su propio grupo
    await Usuario.update(userId, {grupoId: grupoMapeado.id});

    const created = !grupoPrevio;
    res.json({
      success: true,
      nombreGrupo: grupoMapeado.nombreGrupo,
      created,
      message: created
        ? 'Grupo creado con exito'
        : 'Nombre del grupo actualizado',
    });
  } catch (error) {
    console.error('Error en updateNombreGrupo:', error);
    
    // Verificar si el error es porque la tabla no existe
    if (isGruposTableMissingError(error)) {
      return respondGruposTableMissing(res);
    }

    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

/**
 * Obtener los integrantes del grupo (solo para líderes y staff)
 */
const getIntegrantesGrupo = async (req, res) => {
  try {
    const userId = req.userId;
    const userTipoPerfil = req.user.tipoPerfil;

    // Verificar que el usuario sea líder, staff o administrador
    if (userTipoPerfil !== 'liderGrupo' && userTipoPerfil !== 'administrador') {
      // Si es roller, verificar que pertenezca a un grupo
      if (userTipoPerfil !== 'roller') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para acceder a esta información',
        });
      }
      
      // Para rollers, verificar que pertenezcan a un grupo
      const usuario = await Usuario.findById(userId);
      if (!usuario || !usuario.grupo_id) {
        return res.status(403).json({
          success: false,
          error: 'No perteneces a ningún grupo',
        });
      }
    }

    let grupoId;
    let liderId = null;

    // Obtener información del usuario
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Si es líder o administrador, intentar buscar su grupo
    if (userTipoPerfil === 'liderGrupo' || userTipoPerfil === 'administrador') {
      // Primero intentar buscar si es el líder principal
      const grupo = await Grupo.findByLiderId(userId);
      if (grupo) {
        // Es el líder principal del grupo
        grupoId = grupo.id;
        liderId = grupo.lider_id;
      } else if (usuario.grupo_id) {
        // No es el líder principal, pero pertenece a un grupo (tiene nombramiento)
        grupoId = usuario.grupo_id;
        // Obtener el líder principal del grupo
        const grupoDelUsuario = await Grupo.findById(usuario.grupo_id);
        if (grupoDelUsuario) {
          liderId = grupoDelUsuario.lider_id;
        }
      } else {
        // No tiene grupo
        return res.json({
          success: true,
          integrantes: [],
          mensaje: 'No perteneces a ningún grupo',
        });
      }
    } else {
      // Para rollers, usar su grupo_id
      if (!usuario.grupo_id) {
        return res.status(403).json({
          success: false,
          error: 'No perteneces a ningún grupo',
        });
      }
      grupoId = usuario.grupo_id;
      // Obtener el líder principal del grupo
      const grupoDelUsuario = await Grupo.findById(usuario.grupo_id);
      if (grupoDelUsuario) {
        liderId = grupoDelUsuario.lider_id;
      }
    }

    // Obtener todos los usuarios del grupo
    const usuarios = await Grupo.getUsuariosByGrupoId(grupoId);
    
    // Si aún no tenemos el liderId, obtenerlo del grupo
    if (!liderId) {
      const grupo = await Grupo.findById(grupoId);
      liderId = grupo ? grupo.lider_id : null;
    }
    
    // Mapear usuarios a formato camelCase
    const integrantes = usuarios.map(dbUser => Usuario.mapToCamelCase(dbUser));

    res.json({
      success: true,
      integrantes,
      liderId: liderId || null,
    });
  } catch (error) {
    console.error('Error en getIntegrantesGrupo:', error);

    if (isGruposTableMissingError(error)) {
      return respondGruposTableMissing(res);
    }

    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

/**
 * Actualizar nombramiento de un integrante del grupo (solo para líderes)
 */
const updateNombramiento = async (req, res) => {
  try {
    const userId = req.userId;
    const userTipoPerfil = req.user.tipoPerfil;

    // Verificar que el usuario sea líder o administrador
    if (userTipoPerfil !== 'liderGrupo' && userTipoPerfil !== 'administrador') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar nombramientos',
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

    const {usuarioId, nombramiento} = req.body;

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        error: 'El ID del usuario es requerido',
      });
    }

    // Validar que nombramiento sea válido (si se proporciona)
    if (nombramiento !== null && nombramiento !== undefined && nombramiento !== '') {
      const nombramientosValidos = ['colider', 'veterano', 'nuevo'];
      if (!nombramientosValidos.includes(nombramiento)) {
        return res.status(400).json({
          success: false,
          error: 'Nombramiento inválido. Debe ser: colider, veterano o nuevo',
        });
      }
    }

    // Verificar que el usuario existe
    const usuarioTarget = await Usuario.findById(usuarioId);
    if (!usuarioTarget) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Si es líder (no admin), verificar que el usuario pertenezca a su grupo
    if (userTipoPerfil === 'liderGrupo') {
      const grupoLider = await Grupo.findByLiderId(userId);
      if (!grupoLider) {
        return res.status(400).json({
          success: false,
          error: 'No tienes un grupo creado',
        });
      }

      // Verificar que el usuario a actualizar pertenezca al mismo grupo
      if (usuarioTarget.grupo_id !== grupoLider.id) {
        return res.status(403).json({
          success: false,
          error: 'El usuario no pertenece a tu grupo',
        });
      }
    }

    // No permitir que un líder se asigne nombramiento a sí mismo
    if (usuarioId === userId && nombramiento === 'colider') {
      return res.status(400).json({
        success: false,
        error: 'No puedes asignarte el nombramiento de colider a ti mismo',
      });
    }

    // Actualizar nombramiento (puede ser null para quitar el nombramiento)
    const updateData = {
      nombramiento: nombramiento === '' ? null : nombramiento,
    };

    const usuarioActualizado = await Usuario.update(usuarioId, updateData);

    if (!usuarioActualizado) {
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar el nombramiento',
      });
    }

    const usuarioMapeado = Usuario.mapToCamelCase(usuarioActualizado);

    res.json({
      success: true,
      usuario: usuarioMapeado,
      message: nombramiento 
        ? `Nombramiento "${nombramiento}" asignado exitosamente`
        : 'Nombramiento eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en updateNombramiento:', error);
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

/**
 * Salir del grupo actual (cualquier integrante; si es líder, disuelve el grupo)
 */
const salirDelGrupo = async (req, res) => {
  try {
    const userId = req.userId;
    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    let grupoId = usuario.grupo_id;
    let grupo = grupoId ? await Grupo.findById(grupoId) : null;

    if (!grupo) {
      const userTipoPerfil = req.user?.tipoPerfil;
      if (userTipoPerfil === 'liderGrupo' || userTipoPerfil === 'administrador') {
        grupo = await Grupo.findByLiderId(userId);
        if (grupo) {
          grupoId = grupo.id;
        }
      }
    }

    if (!grupoId || !grupo) {
      return res.status(400).json({
        success: false,
        error: 'No perteneces a ningún grupo',
      });
    }

    const isLeader = grupo.lider_id === userId;

    if (isLeader) {
      await Grupo.unlinkAllMembers(grupoId);
      await Grupo.deleteById(grupoId);
    } else {
      await Usuario.update(userId, {grupoId: null, nombramiento: null});
    }

    const usuarioActualizado = await Usuario.findById(userId);
    const usuarioMapeado = Usuario.mapToCamelCase(usuarioActualizado);

    res.json({
      success: true,
      usuario: usuarioMapeado,
      message: isLeader
        ? 'Has salido del grupo y se ha disuelto para todos los integrantes'
        : 'Has salido del grupo exitosamente',
    });
  } catch (error) {
    console.error('Error en salirDelGrupo:', error);
    res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${error.message || 'Error desconocido'}`,
    });
  }
};

module.exports = {
  getNombreGrupo,
  updateNombreGrupo,
  getIntegrantesGrupo,
  updateNombramiento,
  salirDelGrupo,
};

