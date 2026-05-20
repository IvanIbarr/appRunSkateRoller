const Evento = require('../models/Evento');
const {getIO} = require('../realtime/io');

const sentKeys = new Set();
const CHECK_MS = 30_000;
const MINUTES_BEFORE = 10;
const WINDOW_MS = 90_000; // ventana ~1.5 min para no duplicar ni perder el disparo

function buildReminderMessage(titulo) {
  const nombre = (titulo || 'la rodada').trim();
  return `🛼 ¡Prepárate, patinador! Alístate: «${nombre}» sale en ${MINUTES_BEFORE} minutos. ¡Nos vemos en el punto de encuentro! 🔥`;
}

function parseHoraMinutos(horaRaw) {
  const normalized = Evento.normalizeHoraText(horaRaw);
  if (!normalized) return null;
  const [h, m] = normalized.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return {h, m};
}

function eventoSalidaDate(evento) {
  const ymd =
    Evento.parseFechaToYmd(evento.fecha_inicio) ||
    Evento.parseFechaToYmd(evento.fecha);
  if (!ymd) return null;
  const horaRaw = evento.salida || evento.cita || evento.hora;
  const hm = parseHoraMinutos(horaRaw);
  if (!hm) return null;
  const [y, mo, d] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, d, hm.h, hm.m, 0, 0);
}

async function tickReminders() {
  const io = getIO();
  if (!io) return;

  let rows = [];
  try {
    rows = await Evento.getAll();
  } catch (err) {
    console.error('Recordatorios evento: error listando', err.message);
    return;
  }

  const now = Date.now();
  const targetMs = MINUTES_BEFORE * 60 * 1000;

  for (const row of rows) {
    const salidaAt = eventoSalidaDate(row);
    if (!salidaAt) continue;
    const remindAt = salidaAt.getTime() - targetMs;
    const diff = now - remindAt;
    if (diff < 0 || diff > WINDOW_MS) continue;

    const key = `${row.id}|${salidaAt.toISOString()}`;
    if (sentKeys.has(key)) continue;
    sentKeys.add(key);

    const titulo = row.titulo_ruta || row.titulo || 'Rodada';
    const payload = {
      eventoId: row.id,
      titulo,
      tituloRuta: row.titulo_ruta,
      fechaInicio: row.fecha_inicio,
      salida: row.salida,
      cita: row.cita,
      puntoSalida: row.punto_salida,
      minutesBefore: MINUTES_BEFORE,
      message: buildReminderMessage(titulo),
    };
    io.to('events').emit('event_reminder', payload);
    console.log(`[recordatorio] ${titulo} (${MINUTES_BEFORE} min antes)`);
  }
}

function startEventoReminderScheduler() {
  setInterval(() => {
    tickReminders().catch(() => {});
  }, CHECK_MS);
  tickReminders().catch(() => {});
  console.log(`✅ Recordatorios de eventos activos (${MINUTES_BEFORE} min antes, cada ${CHECK_MS / 1000}s)`);
}

module.exports = {startEventoReminderScheduler, buildReminderMessage};
