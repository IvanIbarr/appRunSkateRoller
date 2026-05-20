const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const grupoController = require('../controllers/grupoController');
const {authenticateToken} = require('../middleware/authMiddleware');

/**
 * Validaciones para actualizar nombre del grupo
 */
const updateNombreGrupoValidation = [
  body('nombreGrupo')
    .optional()
    .isLength({max: 255})
    .withMessage('El nombre del grupo no puede exceder 255 caracteres')
    .trim(),
];

/**
 * Validaciones para actualizar nombramiento
 */
const updateNombramientoValidation = [
  body('usuarioId')
    .notEmpty()
    .withMessage('El ID del usuario es requerido')
    .isUUID()
    .withMessage('El ID del usuario debe ser un UUID válido'),
  body('nombramiento')
    .optional({nullable: true, values: 'null'})
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Permitir null, undefined o string vacío
      }
      if (!['colider', 'veterano', 'nuevo'].includes(value)) {
        throw new Error('El nombramiento debe ser: colider, veterano o nuevo');
      }
      return true;
    }),
];

// Rutas (todas requieren autenticación)
router.get('/nombre', authenticateToken, grupoController.getNombreGrupo);
router.put('/nombre', authenticateToken, updateNombreGrupoValidation, grupoController.updateNombreGrupo);
router.get('/integrantes', authenticateToken, grupoController.getIntegrantesGrupo);
router.put('/nombramiento', authenticateToken, updateNombramientoValidation, grupoController.updateNombramiento);
router.post('/salir', authenticateToken, grupoController.salirDelGrupo);

module.exports = router;

