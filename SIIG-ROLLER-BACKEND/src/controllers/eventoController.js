const Evento = require('../models/Evento');
const Usuario = require('../models/Usuario');
const ParticipanteEvento = require('../models/ParticipanteEvento');
const {getIO} = require('../realtime/io');
const {prepareEventoImages} = require('../utils/eventoImagePersist');

const getEventos = async (req, res) => {
  try {
    const eventos = await Evento.getAll();
    const ids = eventos.map((row) => row.id).filter(Boolean);
    const counts = await ParticipanteEvento.countsForEventos(ids);
    const userId = req.user?.id ?? req.userId ?? null;
    const registered = userId
      ? await ParticipanteEvento.registeredEventoIdsForUser(userId, ids)
      : new Set();

    const data = eventos.map((row) => {
      const mapped = Evento.mapToCamelCase(row);
      mapped.participantCount = counts[row.id] ?? 0;
      mapped.isRegistered = registered.has(row.id);
      return mapped;
    });
    res.json({success: true, eventos: data});
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const hint =
      isDev && error.message?.includes('participantes_evento')
        ? ' (ejecuta el esquema SQL de participantes_evento)'
        : '';
    res.status(500).json({
      success: false,
      error: `Error interno del servidor${hint}`,
    });
  }
};

const registerEvento = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.user?.id ?? req.userId;
    if (!userId) {
      return res.status(401).json({success: false, error: 'Inicia sesión para registrarte'});
    }
    const evento = await Evento.findById(id);
    if (!evento) {
      return res.status(404).json({success: false, error: 'Evento no encontrado'});
    }
    await ParticipanteEvento.register(id, userId);
    const participantCount = await ParticipanteEvento.countByEvento(id);
    res.json({
      success: true,
      participantCount,
      isRegistered: true,
    });
  } catch (error) {
    console.error('Error al registrar en evento:', error);
    res.status(500).json({success: false, error: error.message || 'Error al registrarse'});
  }
};

const unregisterEvento = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.user?.id ?? req.userId;
    if (!userId) {
      return res.status(401).json({success: false, error: 'Inicia sesión'});
    }
    await ParticipanteEvento.unregister(id, userId);
    const participantCount = await ParticipanteEvento.countByEvento(id);
    res.json({
      success: true,
      participantCount,
      isRegistered: false,
    });
  } catch (error) {
    console.error('Error al cancelar registro en evento:', error);
    res.status(500).json({success: false, error: error.message || 'Error al cancelar registro'});
  }
};

const createEvento = async (req, res) => {
  try {
    let organizadorId = req.user?.id || null;
    const organizadorRaw = req.body?.organizadorId;

    if (!organizadorId && typeof organizadorRaw === 'string' && organizadorRaw.includes('@')) {
      const user = await Usuario.findByEmail(organizadorRaw);
      organizadorId = user?.id || null;
    }

    if (!organizadorId && typeof organizadorRaw === 'string') {
      // Si ya viene UUID válido desde cliente/backend intermedio, se respeta.
      organizadorId = organizadorRaw;
    }

    if (!organizadorId) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo resolver organizadorId para el evento',
      });
    }

    let payload = {
      ...(req.body || {}),
      organizadorId,
    };
    try {
      payload = await prepareEventoImages(payload);
    } catch (imgErr) {
      return res.status(400).json({
        success: false,
        error: imgErr.message || 'No se pudieron guardar las imágenes del evento',
      });
    }

    const nuevoEvento = await Evento.create(payload);
    if (!nuevoEvento) {
      return res.status(400).json({success: false, error: 'No se pudo crear el evento'});
    }
    const io = getIO();
    if (io) {
      io.to('events').emit('event_created', Evento.mapToCamelCase(nuevoEvento));
    }
    res.status(201).json({
      success: true,
      evento: Evento.mapToCamelCase(nuevoEvento),
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
};

const updateEvento = async (req, res) => {
  try {
    const {id} = req.params;
    let payload = req.body || {};
    try {
      payload = await prepareEventoImages(payload);
    } catch (imgErr) {
      return res.status(400).json({
        success: false,
        error: imgErr.message || 'No se pudieron guardar las imágenes del evento',
      });
    }
    const actualizado = await Evento.update(id, payload);
    if (!actualizado) {
      return res.status(404).json({success: false, error: 'Evento no encontrado'});
    }
    const io = getIO();
    if (io) {
      io.to('events').emit('event_updated', Evento.mapToCamelCase(actualizado));
    }
    res.json({success: true, evento: Evento.mapToCamelCase(actualizado)});
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({success: false, error: 'Error interno del servidor'});
  }
};

const deleteEvento = async (req, res) => {
  try {
    const {id} = req.params;
    const eliminado = await Evento.delete(id);
    if (!eliminado) {
      return res.status(404).json({success: false, error: 'Evento no encontrado'});
    }
    const io = getIO();
    if (io) {
      io.to('events').emit('event_deleted', {id});
    }
    res.json({success: true, message: 'Evento eliminado exitosamente'});
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({success: false, error: 'Error interno del servidor'});
  }
};

module.exports = {
  getEventos,
  createEvento,
  updateEvento,
  deleteEvento,
  registerEvento,
  unregisterEvento,
};
