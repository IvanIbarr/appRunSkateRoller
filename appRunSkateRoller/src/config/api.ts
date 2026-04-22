// Configuración de la API
// En desarrollo, usar localhost
// En producción, cambiar a la URL del servidor
import {Platform} from 'react-native';
import {NATIVE_DEV_API_BASE_OVERRIDE} from './devNativeApiOverride';

/** Puerto del backend en desarrollo (debe coincidir con SIIG-ROLLER-BACKEND). */
const DEV_API_PORT = 3001;

export const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return 'https://api.siigroller.com/api';
  }

  // Móvil: opcionalmente sobrescribir (túnel al API, otra red). Ver devNativeApiOverride.ts
  if (
    (Platform.OS === 'android' || Platform.OS === 'ios') &&
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    NATIVE_DEV_API_BASE_OVERRIDE &&
    NATIVE_DEV_API_BASE_OVERRIDE.length > 0
  ) {
    return NATIVE_DEV_API_BASE_OVERRIDE.replace(/\/$/, '');
  }

  // IMPORTANTE: Debe coincidir con la IP LAN de tu PC (ipconfig → IPv4).
  // Si no coincide, Android no llegará al API (eventos solo locales, etc.).
  const LOCAL_IP = '192.168.1.77';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/api`;
    }
    return `http://localhost:${DEV_API_PORT}/api`;
  }

  if (Platform.OS === 'android' && typeof __DEV__ !== 'undefined' && __DEV__) {
    return `http://${LOCAL_IP}:${DEV_API_PORT}/api`;
  }

  return `http://localhost:${DEV_API_PORT}/api`;
};

/**
 * En web, unifica el host con la página (mismo origen → proxy webpack en dev).
 * Usa pathname (no buscar "/api/" como substring: fallaba en algunas rutas).
 */
export const resolveApiUrl = (url: string): string => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return url;
  }
  try {
    const parsed = new URL(url, window.location.href);
    const path = `${parsed.pathname}${parsed.search}`;
    const proxied =
      path.startsWith('/api') ||
      path.startsWith('/uploads') ||
      path.startsWith('/health');
    if (!proxied) {
      return url;
    }
    return `${window.location.origin}${path}`;
  } catch {
    return url;
  }
};

/**
 * URL absoluta para archivos bajo `/uploads/...` o rutas de perfil.
 * - Web: mismo origen (proxy webpack) cuando aplica.
 * - Nativo: origen del API sin el sufijo `/api` (mismo host que sirve subidas).
 */
export function resolveMediaUrl(relativeOrAbsolute: string): string {
  if (!relativeOrAbsolute) {
    return '';
  }
  if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
    return relativeOrAbsolute;
  }
  const p = relativeOrAbsolute.startsWith('/') ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return resolveApiUrl(`http://local.invalid${p}`);
  }
  const base = getApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}${p}`;
}

/** Endpoints con getters: la base se calcula al usar (evita URL vieja al importar el módulo). */
export const API_ENDPOINTS = {
  AUTH: {
    get LOGIN() {
      return `${getApiBaseUrl()}/auth/login`;
    },
    get REGISTRO() {
      return `${getApiBaseUrl()}/auth/registro`;
    },
    get ME() {
      return `${getApiBaseUrl()}/auth/me`;
    },
    get FORGOT_PASSWORD() {
      return `${getApiBaseUrl()}/auth/forgot-password`;
    },
    get VERIFY_RESET_CODE() {
      return `${getApiBaseUrl()}/auth/verify-reset-code`;
    },
    get RESET_PASSWORD() {
      return `${getApiBaseUrl()}/auth/reset-password`;
    },
  },
  CHAT: {
    GET_MESSAGES: (chatType: string) => `${getApiBaseUrl()}/chat/${chatType}`,
    get CREATE_MESSAGE() {
      return `${getApiBaseUrl()}/chat`;
    },
    get UPLOAD() {
      return `${getApiBaseUrl()}/chat/upload`;
    },
  },
  STAFF: {
    get CREATE() {
      return `${getApiBaseUrl()}/staff/create`;
    },
    get REMOVE() {
      return `${getApiBaseUrl()}/staff/remove`;
    },
  },
  GRUPO: {
    get GET_NOMBRE() {
      return `${getApiBaseUrl()}/grupo/nombre`;
    },
    get UPDATE_NOMBRE() {
      return `${getApiBaseUrl()}/grupo/nombre`;
    },
    get GET_INTEGRANTES() {
      return `${getApiBaseUrl()}/grupo/integrantes`;
    },
    get UPDATE_NOMBRAMIENTO() {
      return `${getApiBaseUrl()}/grupo/nombramiento`;
    },
  },
  ALIAS: {
    get GET() {
      return `${getApiBaseUrl()}/alias`;
    },
    get AGREGAR() {
      return `${getApiBaseUrl()}/alias/agregar`;
    },
    get CAMBIAR() {
      return `${getApiBaseUrl()}/alias/cambiar`;
    },
  },
  ROLLERTIPS: {
    get CREATE() {
      return `${getApiBaseUrl()}/rollertips`;
    },
    get LIST() {
      return `${getApiBaseUrl()}/rollertips`;
    },
    REACTIONS: (id: string) => `${getApiBaseUrl()}/rollertips/${id}/reactions`,
    DELETE: (id: string) => `${getApiBaseUrl()}/rollertips/${id}`,
    USER: (userId: string) => `${getApiBaseUrl()}/rollertips/user/${userId}`,
    CREATOR: (userId: string) =>
      `${getApiBaseUrl()}/rollertips/creators/${encodeURIComponent(userId)}`,
    COMMENTS: (id: string) => `${getApiBaseUrl()}/rollertips/${id}/comments`,
    COMMENT_REACTIONS: (id: string, commentId: string) =>
      `${getApiBaseUrl()}/rollertips/${id}/comments/${commentId}/reactions`,
    COMMENT_DELETE: (id: string, commentId: string) =>
      `${getApiBaseUrl()}/rollertips/${id}/comments/${commentId}`,
  },
  MARKETING: {
    get SALES() {
      return `${getApiBaseUrl()}/marketing/sales`;
    },
    SALE_BY_ID: (id: string) =>
      `${getApiBaseUrl()}/marketing/sales/${encodeURIComponent(id)}`,
  },
  EVENTO: {
    get LIST() {
      return `${getApiBaseUrl()}/evento`;
    },
    BY_ID: (id: string) =>
      `${getApiBaseUrl()}/evento/${encodeURIComponent(id)}`,
  },
  SEGUIMIENTO: {
    get CREATE() {
      return `${getApiBaseUrl()}/seguimiento/create`;
    },
    PUBLIC: (id: string) =>
      `${getApiBaseUrl()}/seguimiento/${encodeURIComponent(id)}`,
    FINISH: (id: string) =>
      `${getApiBaseUrl()}/seguimiento/${encodeURIComponent(id)}/finish`,
    get LOCATION_POINT() {
      return `${getApiBaseUrl()}/seguimiento/location-point`;
    },
  },
};

export const AVATAR = {
  get UPDATE() {
    return `${getApiBaseUrl()}/auth/avatar`;
  },
  get UPDATE_FOTO_PERFIL() {
    return `${getApiBaseUrl()}/auth/foto-perfil`;
  },
};

export default getApiBaseUrl;

export const REALTIME_BASE_URL = getApiBaseUrl().replace(/\/api\/?$/, '');
