const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const aliasController = require('../controllers/aliasController');
const {authenticateToken} = require('../middleware/authMiddleware');

/**
 * Validaciones para alias
 */
const aliasValidation = [
  body('alias')
    .trim()
    .isLength({min: 1, max: 100})
    .withMessage('El alias debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$/)
    .withMessage('El alias solo puede contener letras, números, espacios, guiones y guiones bajos'),
];

// Rutas (todas requieren autenticación)
router.get('/', authenticateToken, aliasController.getAlias);
router.post('/agregar', authenticateToken, aliasValidation, aliasController.agregarAlias);
router.put('/cambiar', authenticateToken, aliasValidation, aliasController.cambiarAlias);

module.exports = router;
