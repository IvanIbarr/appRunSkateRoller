import {MAPBOX_ACCESS_TOKEN} from '../config/mapbox';

export interface CyclingRouteResult {
  distance: number;
  duration: number;
  geometry: any;
}

export interface CyclingRouteParams {
  origenText: string;
  destinoText: string;
  originCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  language: string;
}

const GEOCODE_TIMEOUT_MS = 12000;
const DIRECTIONS_TIMEOUT_MS = 18000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {signal: ctrl.signal});
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Geocoding + Mapbox Directions (perfil cycling). Misma lógica en web y nativo
 * para que el loading no dependa del ciclo de vida del mapa GL.
 */
export async function computeMapboxCyclingRoute(
  params: CyclingRouteParams,
): Promise<CyclingRouteResult> {
  const {origenText, destinoText, originCoords, destinationCoords, language} = params;
  const token = MAPBOX_ACCESS_TOKEN;

  const geocode = async (address: string, proximity?: [number, number]): Promise<number[] | null> => {
    const q = address?.trim();
    if (!q) {
      return null;
    }
    const sp = new URLSearchParams({
      access_token: token,
      limit: '1',
      language: language || 'es',
      country: 'mx',
    });
    if (proximity && proximity.length >= 2) {
      sp.append('proximity', `${proximity[0]},${proximity[1]}`);
    }
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${sp.toString()}`;
    const response = await fetchWithTimeout(url, GEOCODE_TIMEOUT_MS);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.message || errorData.error || response.statusText;
      if (response.status === 403) {
        throw new Error(
          'Token de Mapbox inválido. Configura REACT_APP_MAPBOX_ACCESS_TOKEN o src/config/mapbox.ts.',
        );
      }
      throw new Error(`Geocodificación (${response.status}): ${msg || response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error || 'Error en geocodificación');
    }
    const coordinates = data?.features?.[0]?.center;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }
    return coordinates;
  };

  const hasOrigin = Boolean(originCoords && originCoords.length >= 2);
  const hasDest = Boolean(destinationCoords && destinationCoords.length >= 2);

  let resolvedOrigin: number[] | null;
  let resolvedDest: number[] | null;

  if (hasOrigin && hasDest) {
    resolvedOrigin = [...originCoords!];
    resolvedDest = [...destinationCoords!];
  } else if (!hasOrigin && !hasDest) {
    const [a, b] = await Promise.all([geocode(origenText), geocode(destinoText)]);
    resolvedOrigin = a;
    resolvedDest = b;
  } else if (!hasOrigin) {
    resolvedOrigin = await geocode(origenText);
    resolvedDest = hasDest
      ? [...destinationCoords!]
      : await geocode(destinoText, resolvedOrigin ?? undefined);
  } else {
    resolvedOrigin = [...originCoords!];
    resolvedDest = await geocode(destinoText, resolvedOrigin);
  }

  if (
    !resolvedOrigin ||
    !resolvedDest ||
    resolvedOrigin.length < 2 ||
    resolvedDest.length < 2
  ) {
    throw new Error(
      'No se pudieron encontrar las direcciones. Elige una sugerencia de la lista o escribe una dirección más completa.',
    );
  }

  const dirUrl = `https://api.mapbox.com/directions/v5/mapbox/cycling/${resolvedOrigin[0]},${resolvedOrigin[1]};${resolvedDest[0]},${resolvedDest[1]}?geometries=geojson&access_token=${token}`;
  const dirRes = await fetchWithTimeout(dirUrl, DIRECTIONS_TIMEOUT_MS);
  if (!dirRes.ok) {
    const errorData = await dirRes.json().catch(() => ({}));
    const msg = errorData.message || errorData.error || dirRes.statusText;
    if (dirRes.status === 403) {
      throw new Error('Token de Mapbox inválido para Directions.');
    }
    if (dirRes.status === 422) {
      throw new Error(
        msg || 'No hay ruta en bici entre esos puntos (muy lejos o sin calles). Prueba otros puntos.',
      );
    }
    throw new Error(`Directions (${dirRes.status}): ${msg || dirRes.statusText}`);
  }
  const dirJson = await dirRes.json();
  if (dirJson.error) {
    throw new Error(dirJson.error || 'Error calculando ruta');
  }
  const route = dirJson?.routes?.[0];
  if (!route?.geometry) {
    throw new Error('No se encontró una ruta válida entre origen y destino.');
  }

  return {
    distance: Number(route.distance) || 0,
    duration: Number(route.duration) || 0,
    geometry: route.geometry,
  };
}
