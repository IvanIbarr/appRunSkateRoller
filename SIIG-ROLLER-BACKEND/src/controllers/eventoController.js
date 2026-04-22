const Evento = require('../models/Evento');
const {getIO} = require('../realtime/io');

const getEventos = async (req, res) => {
  try {
    const eventos = await Evento.getAll();
    const data = eventos.map(Evento.mapToCamelCase);
    res.json({success: true, eventos: data});
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({success: false, error: 'Error interno del servidor'});
  }
};

const createEvento = async (req, res) => {
  try {
    const nuevoEvento = await Evento.create(req.body || {});
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
    res.status(500).json({success: false, error: 'Error interno del servidor'});
  }
};

const updateEvento = async (req, res) => {
  try {
    const {id} = req.params;
    const actualizado = await Evento.update(id, req.body || {});
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
