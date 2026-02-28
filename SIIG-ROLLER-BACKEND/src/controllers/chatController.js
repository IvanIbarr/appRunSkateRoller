const Mensaje = require('../models/Mensaje');
const Usuario = require('../models/Usuario');

/**
 * Obtiene mensajes de un chat específico
 */
const getMessages = async (req, res) => {
  try {
    const {chatType} = req.params;

    // Validar chatType
    if (!['general', 'staff'].includes(chatType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de chat inválido. Debe ser "general" o "staff"',
      });
    }

    // Verificar permisos para chat staff
    if (chatType === 'staff') {
      const currentUser = req.user;
      if (currentUser.tipoPerfil !== 'administrador' && currentUser.tipoPerfil !== 'liderGrupo') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para acceder al chat staff',
        });
      }
    }

    const messages = await Mensaje.findByChatType(chatType);

    // Mapear a formato camelCase y agregar información del usuario
    const formattedMessages = messages.map(msg => {
      const mensaje = Mensaje.mapToCamelCase(msg);
      return {
        id: mensaje.id,
        text: mensaje.text,
        userId: mensaje.userId,
        userName: mensaje.usuarioAlias || mensaje.usuarioEmail,
        timestamp: mensaje.createdAt,
        chatType: mensaje.chatType,
      };
    });

    res.json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    // Si el error es que la tabla no existe, proporcionar un mensaje más útil
    if (error.message && error.message.includes('does not exist')) {
      return res.status(500).json({
        success: false,
        error: 'La tabla de mensajes no existe. Por favor, ejecuta el script SQL para crear la tabla: scripts/create-mensajes-table.sql',
        details: error.message,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error al obtener mensajes',
      details: error.message,
    });
  }
};

/**
 * Crea un nuevo mensaje
 */
const createMessage = async (req, res) => {
  try {
    const {chatType, text} = req.body;
    const userId = req.user.id;

    // Validaciones
    if (!chatType || !['general', 'staff'].includes(chatType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de chat inválido. Debe ser "general" o "staff"',
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El texto del mensaje es requerido',
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje no puede exceder 1000 caracteres',
      });
    }

    // Verificar permisos para chat staff
    if (chatType === 'staff') {
      const currentUser = req.user;
      if (currentUser.tipoPerfil !== 'administrador' && currentUser.tipoPerfil !== 'liderGrupo') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para enviar mensajes al chat staff',
        });
      }
    }

    // Crear mensaje
    const mensajeData = {
      chatType,
      usuarioId: userId,
      texto: text.trim(),
    };

    const newMessage = await Mensaje.create(mensajeData);
    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const formattedMessage = {
      id: newMessage.id,
      text: newMessage.texto,
      userId: newMessage.usuario_id,
      userName: usuario.alias || usuario.email,
      timestamp: newMessage.created_at,
      chatType: newMessage.chat_type,
    };

    res.status(201).json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear mensaje',
    });
  }
};

module.exports = {
  getMessages,
  createMessage,
};

