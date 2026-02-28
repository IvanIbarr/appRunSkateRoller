const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const staffController = require('../controllers/staffController');
const {authenticateToken} = require('../middleware/authMiddleware');

/**
 * Validaciones para crear staff (solo email requerido)
 */
const createStaffValidation = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
];

// Rutas (todas requieren autenticación)
router.post('/create', authenticateToken, createStaffValidation, staffController.createStaff);
router.post('/remove', authenticateToken, createStaffValidation, staffController.removeStaff);

module.exports = router;

