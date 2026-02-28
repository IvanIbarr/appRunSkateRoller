const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const authController = require('../controllers/authController');
const {authenticateToken} = require('../middleware/authMiddleware');

/**
 * Validaciones para login
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({min: 6})
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

/**
 * Validaciones para registro
 */
const registroValidation = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({min: 6})
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .custom((value, {req}) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  body('edad')
    .isInt({min: 13})
    .withMessage('La edad debe ser un número mayor o igual a 13'),
  body('cumpleaños')
    .isISO8601()
    .withMessage('La fecha de cumpleaños debe ser válida'),
  body('sexo')
    .isIn(['masculino', 'femenino', 'ambos'])
    .withMessage('El sexo debe ser: masculino, femenino o ambos'),
  body('nacionalidad')
    .isIn(['español', 'inglés'])
    .withMessage('La nacionalidad debe ser: español o inglés'),
  body('tipoPerfil')
    .optional()
    .isIn(['administrador', 'liderGrupo', 'roller'])
    .withMessage('El tipo de perfil debe ser: administrador, liderGrupo o roller'),
  body('avatar')
    .optional()
    .isLength({max: 10})
    .withMessage('El avatar no puede exceder 10 caracteres'),
  body('fotoPerfil')
    .optional({nullable: true, values: 'null'})
    .isString()
    .withMessage('La foto de perfil debe ser texto base64 válido'),
];

/**
 * Validaciones para actualizar avatar
 */
const updateAvatarValidation = [
  body('avatar')
    .optional({nullable: true, values: 'null'})
    .isLength({max: 10})
    .withMessage('El avatar no puede exceder 10 caracteres'),
];

const updateProfilePhotoValidation = [
  body('fotoPerfil')
    .optional({nullable: true, values: 'null'})
    .isString()
    .withMessage('La foto de perfil debe ser texto base64 válido'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
];

const verifyResetCodeValidation = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('code')
    .isLength({min: 4, max: 4})
    .withMessage('El código debe tener 4 dígitos'),
];

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('resetToken')
    .notEmpty()
    .withMessage('El token es requerido'),
  body('newPassword')
    .isLength({min: 6})
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const updatePersonalInfoValidation = [
  body('edad')
    .optional()
    .isInt({min: 13, max: 120})
    .withMessage('La edad debe ser válida'),
  body('cumpleaños')
    .optional()
    .isISO8601()
    .withMessage('La fecha de cumpleaños debe ser válida'),
  body('sexo')
    .optional()
    .isIn(['masculino', 'femenino', 'ambos'])
    .withMessage('El sexo debe ser: masculino, femenino o ambos'),
  body('nacionalidad')
    .optional()
    .isIn(['español', 'inglés'])
    .withMessage('La nacionalidad debe ser: español o inglés'),
  body('telefono')
    .optional({nullable: true, values: 'null'})
    .matches(/^[0-9+\s()-]{7,20}$/)
    .withMessage('El teléfono debe ser válido'),
];

// Rutas
router.post('/login', loginValidation, authController.login);
router.post('/registro', registroValidation, authController.registro);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/verify-reset-code', verifyResetCodeValidation, authController.verifyResetCode);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/personal-info', authenticateToken, updatePersonalInfoValidation, authController.updatePersonalInfo);
router.put('/avatar', authenticateToken, updateAvatarValidation, authController.updateAvatar);
router.put('/foto-perfil', authenticateToken, updateProfilePhotoValidation, authController.updateProfilePhoto);

module.exports = router;

