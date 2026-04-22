// Configuración de la API
// En desarrollo, usar localhost
// En producción, cambiar a la URL del servidor
import {Platform} from 'react-native';

const getApiBaseUrl = (): string => {
  // En web, process.env se inyecta mediante webpack.DefinePlugin
  // En Node, está disponible directamente
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return 'https://api.siigroller.com/api'; // Producción
  }

  // Para Android físico, necesitamos usar la IP de la red local en lugar de localhost
  // IMPORTANTE: Cambia esta IP por la IP de tu PC en tu red local
  // Para obtener tu IP: ejecuta 'ipconfig' en PowerShell y busca "Dirección IPv4"
  // IMPORTANTE: Debe coincidir con la IP LAN de tu PC (ipconfig → IPv4).
  const LOCAL_IP = '192.168.1.76'; // IP de tu PC (obtenida con ipconfig)

  // En web, Platform.OS será 'web'
  if (Platform.OS === 'web') {
    // Si abres la app por LAN (p.ej. http://192.168.1.77:3000), localhost apuntaría al dispositivo cliente, no al PC servidor.
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const h = window.location.hostname;
      if (h && h !== 'localhost' && h !== '127.0.0.1') {
        return `http://${h}:3001/api`;
      }
    }
    return 'http://localhost:3001/api'; // Desarrollo web en la misma máquina
  }

  if (Platform.OS === 'android' && typeof __DEV__ !== 'undefined' && __DEV__) {
    // En Android físico, usar IP de red local
    return `http://${LOCAL_IP}:3001/api`;
  }

  return 'http://localhost:3001/api'; // Desarrollo web/emulador por defecto
};

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTRO: `${API_BASE_URL}/auth/registro`,
    ME: `${API_BASE_URL}/auth/me`,
    FOTO_PERFIL: `${API_BASE_URL}/auth/foto-perfil`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    VERIFY_RESET_CODE: `${API_BASE_URL}/auth/verify-reset-code`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    PERSONAL_INFO: `${API_BASE_URL}/auth/personal-info`,
  },
  CHAT: {
    GET_MESSAGES: (chatType: string) => `${API_BASE_URL}/chat/${chatType}`,
    CREATE_MESSAGE: `${API_BASE_URL}/chat`,
  },
  EVENTO: {
    GET_ALL: `${API_BASE_URL}/evento`,
    CREATE: `${API_BASE_URL}/evento`,
    UPDATE: (id: string) => `${API_BASE_URL}/evento/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/evento/${id}`,
  },
  STAFF: {
    CREATE: `${API_BASE_URL}/staff/create`,
    REMOVE: `${API_BASE_URL}/staff/remove`,
  },
  GRUPO: {
    GET_NOMBRE: `${API_BASE_URL}/grupo/nombre`,
    UPDATE_NOMBRE: `${API_BASE_URL}/grupo/nombre`,
    GET_INTEGRANTES: `${API_BASE_URL}/grupo/integrantes`,
    UPDATE_NOMBRAMIENTO: `${API_BASE_URL}/grupo/nombramiento`,
  },
  ALIAS: {
    GET: `${API_BASE_URL}/alias`,
    AGREGAR: `${API_BASE_URL}/alias/agregar`,
    CAMBIAR: `${API_BASE_URL}/alias/cambiar`,
  },
  SEGUIMIENTO: {
    CREATE: `${API_BASE_URL}/seguimiento/create`,
    GET: (id: string) => `${API_BASE_URL}/seguimiento/${id}`,
    ACTIVE: `${API_BASE_URL}/seguimiento/active`,
    HISTORY: `${API_BASE_URL}/seguimiento/history`,
    STATS: (id: string) => `${API_BASE_URL}/seguimiento/stats/${id}`,
    USER_STATS: `${API_BASE_URL}/seguimiento/user-stats`,
    LEADERBOARD: `${API_BASE_URL}/seguimiento/leaderboard`,
    FINISH: (id: string) => `${API_BASE_URL}/seguimiento/${id}/finish`,
    ADD_LOCATION_POINT: `${API_BASE_URL}/seguimiento/location-point`,
  },
};

// Avatar endpoints
export const AVATAR = {
  UPDATE: `${API_BASE_URL}/auth/avatar`,
};

export default API_BASE_URL;

export const REALTIME_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
