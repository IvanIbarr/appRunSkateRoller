const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const chatController = require('../controllers/chatController');
const {authenticateToken} = require('../middleware/authMiddleware');

/**
 * Validaciones para crear mensaje
 */
const createMessageValidation = [
  body('chatType')
    .isIn(['general', 'staff'])
    .withMessage('El tipo de chat debe ser "general" o "staff"'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('El texto del mensaje es requerido')
    .isLength({max: 1000})
    .withMessage('El mensaje no puede exceder 1000 caracteres'),
];

// Rutas
router.get('/:chatType', authenticateToken, chatController.getMessages);
router.post('/', authenticateToken, createMessageValidation, chatController.createMessage);

module.exports = router;

