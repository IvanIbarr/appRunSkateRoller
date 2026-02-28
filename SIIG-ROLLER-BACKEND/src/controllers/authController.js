const {validationResult} = require('express-validator');
const AuthService = require('../services/authService');
const PasswordResetService = require('../services/passwordResetService');
const Usuario = require('../models/Usuario');
const nodemailer = require('nodemailer');

/**
 * Login de usuario
 */
const login = async (req, res) => {
  try {
    // Validar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {email, password} = req.body;

    const result = await AuthService.login(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en login controller:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Registro de nuevo usuario
 */
const registro = async (req, res) => {
  try {
    // Validar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {
      email,
      password,
      confirmPassword,
      edad,
      cumpleaños,
      sexo,
      nacionalidad,
      tipoPerfil,
      avatar,
      fotoPerfil,
    } = req.body;

    // Validar que las contraseñas coincidan (ya debería estar en validaciones, pero por seguridad)
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden',
      });
    }

    const result = await AuthService.registro({
      email,
      password,
      edad,
      cumpleaños,
      sexo,
      nacionalidad,
      tipoPerfil,
      avatar,
      fotoPerfil,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en registro controller:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Obtener usuario actual
 */
const getCurrentUser = async (req, res) => {
  try {
    const usuario = await AuthService.getUserById(req.userId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      usuario,
    });
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Actualizar avatar del usuario
 */
const updateAvatar = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {avatar} = req.body;
    const userId = req.userId;

    // Actualizar avatar en la base de datos
    const usuario = await AuthService.getUserById(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const Usuario = require('../models/Usuario');
    await Usuario.update(userId, {avatar: avatar || null});

    // Obtener usuario actualizado
    const usuarioActualizado = await AuthService.getUserById(userId);

    res.json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error en updateAvatar:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Actualizar foto de perfil del usuario
 */
const updateProfilePhoto = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {fotoPerfil} = req.body;
    const userId = req.userId;

    const usuario = await AuthService.getUserById(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const Usuario = require('../models/Usuario');
    await Usuario.update(userId, {fotoPerfil: fotoPerfil || null});

    const usuarioActualizado = await AuthService.getUserById(userId);

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error en updateProfilePhoto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Actualizar información personal del usuario
 */
const updatePersonalInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {edad, cumpleaños, sexo, nacionalidad, telefono} = req.body;
    const userId = req.userId;

    const usuario = await AuthService.getUserById(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const updateData = {
      edad,
      cumpleaños,
      sexo,
      nacionalidad,
      telefono,
    };

    await Usuario.update(userId, updateData);
    const usuarioActualizado = await AuthService.getUserById(userId);

    res.json({
      success: true,
      message: 'Información personal actualizada',
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error en updatePersonalInfo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

const buildMailer = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Solicita código de recuperación
 */
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {email} = req.body;
    const user = await Usuario.findByEmail(email);
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un código de recuperación.',
      });
    }

    const {code, expiresAt} = PasswordResetService.createReset(email);
    const transporter = buildMailer();
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    if (transporter && fromEmail) {
      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject: 'Código de recuperación - RunSkateRoller',
        text: `Tu código de recuperación es: ${code}. Expira en 10 minutos.`,
      });
    } else {
      console.warn('SMTP no configurado, código de recuperación:', code);
    }

    const response = {
      success: true,
      message: 'Si el email existe, recibirás un código de recuperación.',
    };

    if (process.env.NODE_ENV !== 'production') {
      response.devCode = code;
      response.expiresAt = expiresAt;
    }

    res.json(response);
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Verifica código de recuperación
 */
const verifyResetCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {email, code} = req.body;
    const verification = PasswordResetService.verifyCode(email, code);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: verification.error,
      });
    }

    res.json({
      success: true,
      resetToken: verification.token,
    });
  } catch (error) {
    console.error('Error en verifyResetCode:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

/**
 * Restablecer contraseña
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array(),
      });
    }

    const {email, resetToken, newPassword} = req.body;
    const user = await Usuario.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const tokenResult = PasswordResetService.consumeToken(email, resetToken);
    if (!tokenResult.success) {
      return res.status(400).json({
        success: false,
        error: tokenResult.error,
      });
    }

    const passwordHash = await AuthService.hashPassword(newPassword);
    await Usuario.updatePassword(user.id, passwordHash);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

module.exports = {
  login,
  registro,
  getCurrentUser,
  updateAvatar,
  updateProfilePhoto,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  updatePersonalInfo,
};

