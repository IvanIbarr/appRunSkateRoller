import {Platform} from 'react-native';
import notifee, {AndroidImportance, AuthorizationStatus, TriggerType} from '@notifee/react-native';
import type {Evento} from '../types';
import {eventoFechaToYmd, ymdToLocalDate} from '../utils/dateOnly';

const CHANNEL_ID = 'roller-eventos';

function parseHhMm(s: string | undefined | null): {h: number; m: number} | null {
  if (s == null || !String(s).trim()) {
    return null;
  }
  const t = String(s).trim();
  const m = /^(\d{1,2})[:\.](\d{2})/.exec(t);
  if (!m) {
    return null;
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) {
    return null;
  }
  return {h, m: min};
}

/**
 * Hora límite a la que "apunta" el recordatorio (cita: reunión, luego se sale a rodar).
 */
export function buildEventoCitaDate(evento: Evento): Date | null {
  const ymd = eventoFechaToYmd(evento.fecha);
  const day = ymd ? ymdToLocalDate(ymd) : null;
  if (!day) {
    return null;
  }
  const timeStr = evento.cita || evento.hora || evento.salida;
  const hm = parseHhMm(timeStr);
  if (!hm) {
    return null;
  }
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hm.h, hm.m, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

const triggerId = (eventoId: string) => `evento-15m-${eventoId}`;

/**
 * Notificación local 15 minutos antes de la hora de cita (solo móvil nativo).
 */
export async function scheduleEventoQuinceMinAntes(
  evento: Evento,
): Promise<{ok: true} | {ok: false; error: string}> {
  if (Platform.OS === 'web') {
    return {ok: false, error: 'web'};
  }
  if (!evento.id) {
    return {ok: false, error: 'Evento sin id.'};
  }
  const start = buildEventoCitaDate(evento);
  if (!start) {
    return {
      ok: false,
      error: 'No se pudo leer la fecha u hora del evento. Revisa fecha y hora de cita.',
    };
  }
  const fireAt = new Date(start.getTime() - 15 * 60 * 1000);
  const now = new Date();
  if (fireAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      error:
        'Falta poco o el evento ya pasó. Programa un recordatorio con al menos 20 minutos de antelación.',
    };
  }

  try {
    const settings = await notifee.requestPermission();
    const okAuth =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
    if (!okAuth) {
      return {ok: false, error: 'Permisos de notificación denegados. Actívalos en ajustes del teléfono.'};
    }

    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Recorridos y eventos',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    }

    const nombre = (evento.tituloRuta || evento.titulo || 'recorrido').trim();
    const body = `Tu recorrido "${nombre}" programado para hoy inicia en 15 minutos. Es momento de ajustar tus patines y revisar tu equipo.\n¡Nos vemos en la ruta!`;

    await notifee.createTriggerNotification(
      {
        id: triggerId(evento.id),
        title: '¡Prepárate para rodar! 🛼',
        body,
        android: {
          channelId: CHANNEL_ID,
          pressAction: {id: 'default'},
        },
        ios: {
          sound: 'default',
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: fireAt.getTime(),
      },
    );

    return {ok: true};
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudo programar la notificación';
    return {ok: false, error: msg};
  }
}

export async function cancelEventoQuinceMinAntes(eventoId: string): Promise<void> {
  if (Platform.OS === 'web' || !eventoId) {
    return;
  }
  try {
    await notifee.cancelTriggerNotification(triggerId(eventoId));
  } catch {
    // sin trigger previo: ok
  }
}
