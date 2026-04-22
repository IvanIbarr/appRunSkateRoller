const Mensaje = require('../models/Mensaje');
const Usuario = require('../models/Usuario');

const UPLOADS_CHAT_PREFIX = '/uploads/chat/';

/**
 * Sube un archivo de chat (imagen o video) y devuelve la URL relativa.
 */
const uploadChatMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió archivo',
      });
    }

    const relative = `${UPLOADS_CHAT_PREFIX}${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

    return res.json({
      success: true,
      url: relative,
      mediaType,
    });
  } catch (error) {
    console.error('Error en upload chat:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al subir el archivo',
    });
  }
};

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
        attachmentUrl: mensaje.attachmentUrl || null,
        attachmentType: mensaje.attachmentType || null,
      };
    });

    res.json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
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
 * Valida que la URL de adjunto sea local (evita abusos).
 */
function isSafeChatMediaUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return url.startsWith(UPLOADS_CHAT_PREFIX) && !url.includes('..');
}

/**
 * Crea un nuevo mensaje
 */
const createMessage = async (req, res) => {
  try {
    const {chatType, text, mediaUrl, mediaType} = req.body;
    const userId = req.user.id;

    const trimmedText = typeof text === 'string' ? text.trim() : '';

    if (!chatType || !['general', 'staff'].includes(chatType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de chat inválido. Debe ser "general" o "staff"',
      });
    }

    if (trimmedText.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje no puede exceder 1000 caracteres',
      });
    }

    const hasMedia = mediaUrl && mediaType;
    if (hasMedia) {
      if (!['image', 'video'].includes(mediaType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de adjunto inválido',
        });
      }
      if (!isSafeChatMediaUrl(mediaUrl)) {
        return res.status(400).json({
          success: false,
          error: 'URL de adjunto no válida',
        });
      }
    }

    if (!trimmedText && !hasMedia) {
      return res.status(400).json({
        success: false,
        error: 'Escribe un mensaje o adjunta una imagen o video',
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

    const mensajeData = {
      chatType,
      usuarioId: userId,
      texto: trimmedText,
      adjuntoUrl: hasMedia ? mediaUrl : null,
      adjuntoTipo: hasMedia ? mediaType : null,
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
      attachmentUrl: newMessage.adjunto_url || null,
      attachmentType: newMessage.adjunto_tipo || null,
    };

    res.status(201).json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    if (error.code === 'ADJUNTO_MIGRATION_REQUIRED') {
      return res.status(503).json({
        success: false,
        error: error.message || 'Migración de chat pendiente',
      });
    }
    const isDev = process.env.NODE_ENV !== 'production';
    const hint = isDev && error.message ? ` (${error.message})` : '';
    res.status(500).json({
      success: false,
      error: `Error al crear mensaje${hint}`,
    });
  }
};

module.exports = {
  getMessages,
  createMessage,
  uploadChatMedia,
};
