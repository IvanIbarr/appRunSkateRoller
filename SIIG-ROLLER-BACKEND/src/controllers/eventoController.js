const Evento = require('../models/Evento');
const Usuario = require('../models/Usuario');
const {getIO} = require('../realtime/io');
const {prepareEventoImages} = require('../utils/eventoImagePersist');

const getEventos = async (req, res) => {
  try {
    const eventos = await Evento.getAll();
    const data = eventos.map((row) => Evento.mapToCamelCase(row));
    res.json({success: true, eventos: data});
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({success: false, error: 'Error interno del servidor'});
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
};
