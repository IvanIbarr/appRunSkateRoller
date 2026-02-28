// Configuración de Mapbox
// Obtener tu API key gratis en: https://account.mapbox.com/
// Plan freemium: 50,000 map loads/mes gratis

// Token por defecto
// Si tienes un archivo .env con REACT_APP_MAPBOX_ACCESS_TOKEN, se usará ese token
// Si no, se usará este token por defecto
const DEFAULT_TOKEN = 'pk.eyJ1Ijoic2lpZ21hcCIsImEiOiJjbWpxcXRtN2kybXo4M2VvcGdmY2IxanZuIn0.ubWaiTudKvARocuzJWheVg';

// Token de ejemplo - solo para mostrar mapas, NO para APIs
const EXAMPLE_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// Obtener token de variables de entorno (si está disponible) o usar el por defecto
const getToken = (): string => {
  // En web, process.env se inyecta mediante webpack.DefinePlugin
  // En Node, está disponible directamente
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) {
    return process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  }
  return DEFAULT_TOKEN;
};

export const MAPBOX_ACCESS_TOKEN = getToken();

// Función para verificar si el token es el de ejemplo (no válido para APIs)
export const isExampleToken = (): boolean => {
  return MAPBOX_ACCESS_TOKEN === EXAMPLE_TOKEN;
};

// Estilo de mapa por defecto
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

// Configuración de Mapbox Directions API
export const MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox/driving';

