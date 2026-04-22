import {Platform} from 'react-native';
import {getApiBaseUrl} from '../config/api';
import {LAUNCH_PHASE} from '../config/launchPhase';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const remoteEnabled = (): boolean => {
  try {
    return process.env.REACT_APP_CLIENT_LOGS === 'true';
  } catch {
    return false;
  }
};

const logSecret = (): string | undefined => {
  try {
    const s = process.env.REACT_APP_CLIENT_LOG_SECRET;
    return s && String(s).length > 0 ? String(s) : undefined;
  } catch {
    return undefined;
  }
};

let queue: Array<{level: LogLevel; message: string; screen?: string; context?: object}> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushRemote() {
  if (!remoteEnabled() || queue.length === 0) {
    return;
  }
  const batch = queue.splice(0, queue.length);
  const url = `${getApiBaseUrl()}/logs/client`;
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  const sec = logSecret();
  if (sec) {
    headers['X-Client-Log-Secret'] = sec;
  }
  for (const item of batch) {
    void fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        level: item.level,
        message: item.message,
        screen: item.screen,
        context: {
          ...item.context,
          platform: Platform.OS,
          launchPhase: LAUNCH_PHASE,
        },
        source: Platform.OS === 'web' ? 'web' : 'native',
      }),
    }).catch(() => {});
  }
}

function scheduleFlush() {
  if (flushTimer) {
    return;
  }
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushRemote();
  }, 400);
}

/**
 * Bitácora en consola + envío opcional al backend (archivo combined-*.log).
 * Activa con REACT_APP_CLIENT_LOGS=true (en dev suele ir en webpack).
 */
export function clientLog(
  level: LogLevel,
  message: string,
  options?: {screen?: string; context?: Record<string, unknown>},
): void {
  const {screen, context} = options || {};
  const prefix = screen ? `[${screen}] ` : '';
  const line = `${prefix}${message}`;

  switch (level) {
    case 'debug':
      console.debug('[App]', line, context ?? '');
      break;
    case 'info':
      console.info('[App]', line, context ?? '');
      break;
    case 'warn':
      console.warn('[App]', line, context ?? '');
      break;
    case 'error':
      console.error('[App]', line, context ?? '');
      break;
    default:
      console.log('[App]', line, context ?? '');
  }

  if (!remoteEnabled()) {
    return;
  }
  queue.push({
    level,
    message,
    screen,
    context: context as object | undefined,
  });
  scheduleFlush();
}

export const appLog = {
  debug: (m: string, o?: {screen?: string; context?: Record<string, unknown>}) =>
    clientLog('debug', m, o),
  info: (m: string, o?: {screen?: string; context?: Record<string, unknown>}) =>
    clientLog('info', m, o),
  warn: (m: string, o?: {screen?: string; context?: Record<string, unknown>}) =>
    clientLog('warn', m, o),
  error: (m: string, o?: {screen?: string; context?: Record<string, unknown>}) =>
    clientLog('error', m, o),
};
