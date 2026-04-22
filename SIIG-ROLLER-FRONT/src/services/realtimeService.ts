import {Platform} from 'react-native';

type AnySocket = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  disconnect: () => void;
};

let socket: AnySocket | null = null;

function getBaseUrlFromApiUrl(apiUrl: string): string {
  // apiUrl ejemplo: http://localhost:3001/api  -> http://localhost:3001
  return apiUrl.replace(/\/api\/?$/, '');
}

export function getRealtimeSocket(apiBaseUrl: string): AnySocket {
  if (socket) {
    return socket;
  }
  const baseUrl = getBaseUrlFromApiUrl(apiBaseUrl);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {io} = require('socket.io-client');
  socket = io(baseUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    // En RN, a veces conviene forzar websocket primero; dejamos ambos por compatibilidad.
  });

  // Evitar warnings de listeners duplicados en hot reload web
  if (Platform.OS === 'web') {
    socket.on('connect_error', () => {});
  }
  return socket;
}

export function resetRealtimeSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

