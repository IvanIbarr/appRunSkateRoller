import {Platform, PermissionsAndroid} from 'react-native';

export type ReverseGeocodeMxResult = {
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  estado?: string;
  municipio?: string;
  localidad?: string;
  colonia?: string;
};

/**
 * Nominatim (OpenStreetMap). Uso acotado para demo; en producción usar proveedor con SLA.
 */
export async function reverseGeocodeMexico(
  lat: number,
  lon: number,
): Promise<ReverseGeocodeMxResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
      String(lat),
    )}&lon=${encodeURIComponent(String(lon))}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RunSkateRoller/1.0 (marketplace checkout)',
      },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      address?: Record<string, string>;
    };
    const a = data.address || {};
    const road = [a.road, a.pedestrian, a.path].filter(Boolean).join(' ') || '';
    const house = a.house_number || '';
    const suburb =
      a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
    const city = a.city || a.town || a.village || a.municipality || '';
    const county = a.county || '';
    const state = a.state || '';
    const postcode = (a.postcode || '').replace(/\D/g, '').slice(0, 5);

    return {
      calle: road || undefined,
      numero: house || undefined,
      codigoPostal: postcode.length === 5 ? postcode : undefined,
      estado: state || undefined,
      municipio: county || city || undefined,
      localidad: city || suburb || undefined,
      colonia: suburb || undefined,
    };
  } catch {
    return null;
  }
}

export async function getCurrentPositionCoords(): Promise<{
  lat: number;
  lon: number;
} | null> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
    const tryOnce = (opts: PositionOptions) =>
      new Promise<{lat: number; lon: number} | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({lat: pos.coords.latitude, lon: pos.coords.longitude}),
          () => resolve(null),
          opts,
        );
      });
    // Safari/iOS: alta precisión en interiores suele agotar tiempo; probamos red/Wi‑Fi primero.
    const coarse = await tryOnce({
      enableHighAccuracy: false,
      timeout: 22000,
      maximumAge: 300000,
    });
    if (coarse) {
      return coarse;
    }
    return tryOnce({
      enableHighAccuracy: true,
      timeout: 22000,
      maximumAge: 120000,
    });
  }

  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Geolocation = require('react-native-geolocation-service').default;
      const run = () => {
        Geolocation.getCurrentPosition(
          (pos: {coords: {latitude: number; longitude: number}}) => {
            resolve({lat: pos.coords.latitude, lon: pos.coords.longitude});
          },
          () => resolve(null),
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 60000},
        );
      };
      if (Platform.OS === 'ios') {
        void Geolocation.requestAuthorization('whenInUse').then((status: string) => {
          if (status === 'granted') {
            run();
          } else {
            resolve(null);
          }
        });
        return;
      }
      run();
    } catch {
      resolve(null);
    }
  });
}
