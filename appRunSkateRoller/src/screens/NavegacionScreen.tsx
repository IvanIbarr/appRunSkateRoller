import React, {useRef, useState, type ReactNode} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  Dimensions,
  Share,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import type {RouteProp} from '@react-navigation/native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AutocompleteInput} from '../components/AutocompleteInput';
import {Button} from '../components/Button';
import {MapboxMap} from '../components/MapboxMap';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {LaunchPhaseBanner} from '../components/LaunchPhaseBanner';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import apiService from '../services/apiService';
import {API_ENDPOINTS, resolveApiUrl} from '../config/api';
import {getCurrentPositionCoords, reverseGeocodeMexico} from '../services/reverseGeocodeService';
import {MAPBOX_ACCESS_TOKEN, isExampleToken} from '../config/mapbox';
import {computeMapboxCyclingRoute} from '../services/mapboxCyclingRoute';
import {buildSeguimientoShareUrl} from '../config/seguimientoLinks';
import {Usuario} from '../types';
import type {RootStackParamList} from '../navigation/types';
import {useLanguage} from '../contexts/LanguageContext';

interface RouteData {
  distance: number; // en metros
  duration: number; // en segundos
  geometry: any;
}

type NavegacionRouteProp = RouteProp<RootStackParamList, 'Navegacion'>;
type NavegacionNavProp = NativeStackNavigationProp<RootStackParamList>;

/** Debe ser estable entre renders: si se define dentro de la pantalla, React desmonta todo el árbol (mapa, fetches, etc.). */
type NavegacionShellProps = {spectatorMode: boolean; children: ReactNode};
const NavegacionScreenShell: React.FC<NavegacionShellProps> = ({spectatorMode, children}) =>
  spectatorMode ? <View style={{flex: 1}}>{children}</View> : <WithBottomTabBar>{children}</WithBottomTabBar>;

export const NavegacionScreen: React.FC = () => {
  const route = useRoute<NavegacionRouteProp>();
  const navigation = useNavigation<NavegacionNavProp>();
  const {language, t} = useLanguage();
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const confirmYesNo = async (title: string, message: string): Promise<boolean> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(`${title}\n\n${message}`);
    }
    return await new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        {text: 'No', style: 'cancel', onPress: () => resolve(false)},
        {text: 'Sí', onPress: () => resolve(true)},
      ]);
    });
  };

  const canUseWebGeolocation = (): boolean => {
    if (Platform.OS !== 'web') {
      return true;
    }
    // En navegadores móviles, geolocation requiere "secure context" (HTTPS o localhost).
    // En LAN (http://192.168.x.x) iOS suele bloquearlo.
    const w = window as any;
    if (typeof w?.isSecureContext === 'boolean') {
      return w.isSecureContext;
    }
    // Fallback conservador: si no sabemos, intentamos.
    return true;
  };
  const watchIdRef = useRef<number | null>(null);
  const lastPushRef = useRef<{t: number; lat: number; lng: number} | null>(null);
  const spectatorPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeDataRef = useRef<RouteData | null>(null);
  const {height: winH} = useWindowDimensions();
  const [mapFocus, setMapFocus] = useState(false);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null); // [lng, lat]
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null); // [lng, lat]
  const [userCoords, setUserCoords] = useState<{lng: number; lat: number} | null>(null);
  const [geoContext, setGeoContext] = useState<{estado?: string; municipio?: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [originPrefillLoading, setOriginPrefillLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  React.useEffect(() => {
    routeDataRef.current = routeData;
  }, [routeData]);
  /** Refleja inmediatamente el último route recibido (evita carrera con el timeout web vs useEffect). */
  const assignRouteFromMap = React.useCallback((route: RouteData) => {
    routeDataRef.current = route;
    setRouteData(route);
    setLoading(false);
  }, []);
  const [routeRequested, setRouteRequested] = useState(false);
  const routeRequestedRef = useRef(false);
  React.useEffect(() => {
    routeRequestedRef.current = routeRequested;
  }, [routeRequested]);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingPoints, setTrackingPoints] = useState<
    Array<{lat: number; lng: number; timestamp: string}>
  >([]);
  const [trackingStart, setTrackingStart] = useState<string | null>(null);
  const [activeSeguimientoId, setActiveSeguimientoId] = useState<string | null>(null);
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [spectatorSeguimientoId, setSpectatorSeguimientoId] = useState<string | null>(null);
  const [spectatorAlias, setSpectatorAlias] = useState<string | null>(null);
  /** Evita que capas del Origen (dropdown z-index alto) bloqueen toques en Destino en Safari iOS. */
  const [routeFieldFocus, setRouteFieldFocus] = useState<'origen' | 'destino' | null>(null);

  const [confirmPick, setConfirmPick] = useState<{
    field: 'origen' | 'destino';
    label: string;
    coords: [number, number];
  } | null>(null);
  const [confirmedOriginText, setConfirmedOriginText] = useState<string>('');
  const [confirmedDestText, setConfirmedDestText] = useState<string>('');

  // En web, cambiar props del mapa en cada tecla puede provocar "parpadeo"/reflow.
  // Solo pasamos origin/destination al mapa cuando el usuario ya solicitó calcular ruta.
  const mapOrigin = routeRequested && !spectatorMode ? origen : '';
  const mapDestination = routeRequested && !spectatorMode ? destino : '';

  const haversineMeters = (a: {lat: number; lng: number}, b: {lat: number; lng: number}): number => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  const pushRemoteLocationPoint = async (seguimientoId: string, lat: number, lng: number) => {
    try {
      await apiService.post(API_ENDPOINTS.SEGUIMIENTO.LOCATION_POINT, {
        seguimientoId,
        latitude: lat,
        longitude: lng,
        accuracy: null,
        speed: null,
        timestamp: Date.now(),
      });
    } catch {
      // No bloquear el recorrido local si el backend falla.
    }
  };

  const fetchAndSetOriginFromGPS = React.useCallback(async () => {
    setOriginPrefillLoading(true);
    try {
      if (!canUseWebGeolocation()) {
        const currentOrigin =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? String(window.location.origin)
            : '';
        showAlert(
          'Ubicación',
          `Tu navegador bloquea el GPS en HTTP. Para usar "Mi ubicación actual" abre la app en HTTPS (recomendado) o pruébalo desde localhost.${currentOrigin ? `\n\nEstás en: ${currentOrigin}` : ''}`,
        );
        return;
      }
      const coords = await getCurrentPositionCoords();
      if (!coords) {
        const secureWeb =
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          (window as {isSecureContext?: boolean}).isSecureContext === true;
        showAlert(
          'Ubicación',
          secureWeb
            ? 'Safari no devolvió la ubicación (aunque la página sea HTTPS).\n\n• Si apareció un aviso, pulsa «Permitir» para compartir ubicación.\n• Ajustes → Privacidad y seguridad → Localización → Safari → «Preguntar» o «Al usar las apps».\n• Toca «aA» a la izquierda de la barra de direcciones → Ubicación → «Permitir».\n• Activa servicios de ubicación y, si estás en interior, espera unos segundos o prueba cerca de una ventana.'
            : 'No se pudo obtener tu ubicación. Verifica permisos de GPS y vuelve a intentar.\n\nTip: en iPhone, el GPS en web normalmente requiere HTTPS (por ejemplo con cloudflared/ngrok) o localhost.',
        );
        return;
      }
      setUserCoords({lng: coords.lon, lat: coords.lat});
      setOriginCoords([coords.lon, coords.lat]);
      setOrigen('Mi ubicación actual');
      setConfirmedOriginText('Mi ubicación actual');
      try {
        const mx = await reverseGeocodeMexico(coords.lat, coords.lon);
        if (mx?.estado || mx?.municipio) {
          setGeoContext({estado: mx.estado, municipio: mx.municipio});
        } else {
          setGeoContext(null);
        }
      } catch {
        setGeoContext(null);
      }
    } finally {
      setOriginPrefillLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const run = async () => {
      if (!userCoords) {
        setGeoContext(null);
        return;
      }
      try {
        const mx = await reverseGeocodeMexico(userCoords.lat, userCoords.lng);
        if (mx?.estado || mx?.municipio) {
          setGeoContext({estado: mx.estado, municipio: mx.municipio});
        } else {
          setGeoContext(null);
        }
      } catch {
        setGeoContext(null);
      }
    };
    void run();
  }, [userCoords?.lat, userCoords?.lng]);

  const suggestedSearchRadiusKm = React.useMemo(() => {
    if (!userCoords) {
      return 75;
    }
    const a = {lat: userCoords.lat, lng: userCoords.lng};
    const bCoords =
      destinationCoords && destinationCoords.length >= 2
        ? {lat: destinationCoords[1], lng: destinationCoords[0]}
        : originCoords && originCoords.length >= 2
          ? {lat: originCoords[1], lng: originCoords[0]}
          : null;
    if (!bCoords) {
      return 75;
    }
    const dKm = haversineMeters(a, bCoords) / 1000;
    if (dKm >= 140) {
      return 160;
    }
    if (dKm >= 90) {
      return 120;
    }
    if (dKm >= 45) {
      return 90;
    }
    if (dKm >= 25) {
      return 75;
    }
    return 60;
  }, [userCoords, originCoords, destinationCoords]);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };
    loadUser();
  }, []);

  // Prefill de origen con GPS (mejor UX: destino es lo único que el usuario debería teclear siempre).
  React.useEffect(() => {
    const prefillOrigin = async () => {
      if (origen.trim().length > 0) {
        return;
      }
      // Evitar popup/alert automático en web LAN (HTTP), porque el navegador lo bloqueará.
      if (Platform.OS === 'web' && !canUseWebGeolocation()) {
        return;
      }
      await fetchAndSetOriginFromGPS();
    };
    void prefillOrigin();
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    return () => {
      const geo = (navigator as any)?.geolocation;
      if (watchIdRef.current !== null && geo?.clearWatch) {
        geo.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Solo limpiar ruta si falta origen o destino. NO resetear cuando ambos tienen texto:
  // cualquier cambio de `destino`/`origen` (autocomplete, normalización, un carácter)
  // dejaba `routeRequested` en false mientras MapboxMap calculaba → timeout sin callback.
  React.useEffect(() => {
    if (!origen.trim() || !destino.trim()) {
      routeRequestedRef.current = false;
      setRouteRequested(false);
      setRouteData(null);
      setLoading(false);
    }
  }, [origen, destino]);

  const stopSpectatorPolling = () => {
    if (spectatorPollRef.current) {
      clearInterval(spectatorPollRef.current);
      spectatorPollRef.current = null;
    }
  };

  /**
   * Al salir de «Sígueme» (No, recorrido terminó, error o botón Salir): limpiar estado,
   * quitar ?seguimiento= de la URL y volver a la pantalla de ruta si hay sesión, o a Login.
   */
  const exitSeguimientoYRedirigir = React.useCallback(async () => {
    stopSpectatorPolling();
    setSpectatorMode(false);
    setSpectatorSeguimientoId(null);
    setSpectatorAlias(null);
    setTrackingActive(false);
    setTrackingStart(null);
    setTrackingPoints([]);
    setActiveSeguimientoId(null);
    setOrigen('');
    setDestino('');
    setOriginCoords(null);
    setDestinationCoords(null);
    setConfirmedOriginText('');
    setConfirmedDestText('');
    setConfirmPick(null);
    routeRequestedRef.current = false;
    setRouteRequested(false);
    setRouteData(null);
    setLoading(false);
    setRouteFieldFocus(null);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const path = window.location.pathname || '/';
      window.history.replaceState({}, '', path);
    }

    const user = await authService.getCurrentUser();
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{name: 'Navegacion'}],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    }
  }, [navigation]);

  /** Tras quitar ?seguimiento=, re-precargar origen con GPS (el efecto de montaje no se repite al reset). */
  const hadSeguimientoIdRef = useRef(false);
  React.useEffect(() => {
    const id = route.params?.seguimientoId;
    if (id) {
      hadSeguimientoIdRef.current = true;
    } else if (hadSeguimientoIdRef.current) {
      hadSeguimientoIdRef.current = false;
      void fetchAndSetOriginFromGPS();
    }
  }, [route.params?.seguimientoId, fetchAndSetOriginFromGPS]);

  const applySpectatorSession = (payload: any) => {
    const data = payload?.data;
    if (!data) {
      return;
    }
    if (typeof data.origen === 'string') {
      setOrigen(data.origen);
    }
    if (typeof data.destino === 'string') {
      setDestino(data.destino);
    }
    const pts = Array.isArray(data.puntos) ? data.puntos : [];
    const mapped = pts
      .map((p: any) => ({
        lat: Number(p.latitud),
        lng: Number(p.longitud),
        timestamp: typeof p.creado_en === 'string' ? p.creado_en : new Date().toISOString(),
      }))
      .filter((p: any) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    setTrackingPoints(mapped);
  };

  const fetchSpectatorSession = async (id: string) => {
    const res = await fetch(resolveApiUrl(API_ENDPOINTS.SEGUIMIENTO.PUBLIC(id)));
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.error || `HTTP ${res.status}`);
    }
    return json;
  };

  // Deep link: /?seguimiento=<uuid>
  React.useEffect(() => {
    const id = route.params?.seguimientoId;
    if (!id || spectatorSeguimientoId) {
      return;
    }

    void (async () => {
      try {
        const json = await fetchSpectatorSession(id);
        const alias =
          json?.data?.alias ||
          json?.data?.usuario_alias ||
          json?.data?.usuario?.alias ||
          null;
        setSpectatorAlias(typeof alias === 'string' ? alias : null);

        const label = typeof alias === 'string' && alias.trim().length > 0 ? alias.trim() : 'este usuario';
        const ok = await confirmYesNo(
          'Sígueme',
          `¿Quieres seguir en tiempo real a ${label} en su recorrido?`,
        );
        if (!ok) {
          void exitSeguimientoYRedirigir();
          return;
        }

        setSpectatorMode(true);
        setSpectatorSeguimientoId(id);
        applySpectatorSession(json);

        stopSpectatorPolling();
        spectatorPollRef.current = setInterval(async () => {
          try {
            const fresh = await fetchSpectatorSession(id);
            applySpectatorSession(fresh);
            if (fresh?.data?.activo === false) {
              stopSpectatorPolling();
              showAlert('Recorrido', 'El recorrido terminó.');
              void exitSeguimientoYRedirigir();
            }
          } catch {
            // no-op
          }
        }, 2000);
      } catch {
        showAlert('Sígueme', 'No se pudo cargar el recorrido compartido.');
        void exitSeguimientoYRedirigir();
      }
    })();

    return () => {
      stopSpectatorPolling();
    };
    // no incluir spectatorSeguimientoId: el cleanup detendría el polling al aceptar «Sí».
  }, [route.params?.seguimientoId, exitSeguimientoYRedirigir]);

  // Mapbox ya se carga desde index.html, no necesita carga adicional

  const handleCalcularRuta = () => {
    if (confirmPick) {
      showAlert('Confirmación', 'Primero confirma el punto seleccionado.');
      setLoading(false);
      return;
    }
    if ((!origen.trim() && !originCoords) || !destino.trim()) {
      showAlert('Error', 'Por favor ingresa origen y destino');
      setLoading(false);
      return;
    }

    setLoading(true);
    routeRequestedRef.current = true;
    setRouteRequested(true);
    setRouteData(null);

    void (async () => {
      try {
        if (!MAPBOX_ACCESS_TOKEN || isExampleToken()) {
          showAlert(
            'Mapbox',
            'Token de Mapbox no configurado o es de ejemplo. Configura uno propio para calcular rutas.',
          );
          return;
        }
        const route = await computeMapboxCyclingRoute({
          origenText: origen.trim(),
          destinoText: destino.trim(),
          originCoords,
          destinationCoords,
          language: language || 'es',
        });
        assignRouteFromMap(route);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'No se pudo calcular la ruta';
        showAlert('Ruta', msg);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleStartTracking = () => {
    if (trackingActive) {
      showAlert('Recorrido activo', 'El seguimiento ya está en curso.');
      return;
    }

    if (Platform.OS === 'web') {
      // iOS/Safari bloquea geolocalización en HTTP (LAN); mejor avisar explícitamente.
      const w = window as any;
      if (typeof w?.isSecureContext === 'boolean' && !w.isSecureContext) {
        showAlert(
          'Ubicación',
          'Tu navegador bloquea el GPS en HTTP. Para iniciar el recorrido en web, abre la app en HTTPS o pruébalo desde localhost.',
        );
        return;
      }
    }

    const geo = (navigator as any)?.geolocation;
    if (!geo?.watchPosition) {
      showAlert('Error', 'La geolocalización no está disponible en este dispositivo.');
      return;
    }

    const startWatch = (seguimientoId: string | null) => {
      setTrackingActive(true);
      setTrackingStart(new Date().toISOString());
      // Semilla inicial para que el mapa centre el patín inmediatamente (estilo Uber/Google).
      setTrackingPoints(() => {
        const seed =
          originCoords && originCoords.length >= 2
            ? {lat: originCoords[1], lng: originCoords[0], timestamp: new Date().toISOString()}
            : userCoords
              ? {lat: userCoords.lat, lng: userCoords.lng, timestamp: new Date().toISOString()}
              : null;
        return seed ? [seed] : [];
      });
      lastPushRef.current = null;

      const watchId = geo.watchPosition(
        (position: any) => {
          const coords = position?.coords;
          if (!coords) {
            return;
          }
          const lat = coords.latitude;
          const lng = coords.longitude;
          const ts = Date.now();
          const next = {lat, lng, timestamp: new Date(ts).toISOString()};

          setTrackingPoints((prev) => {
            const last = prev.length > 0 ? prev[prev.length - 1] : null;
            if (last) {
              const moved = haversineMeters(last, {lat, lng});
              if (moved < 2) {
                return prev;
              }
            }
            return [...prev, next];
          });

          if (!seguimientoId) {
            return;
          }
          const lastPush = lastPushRef.current;
          const shouldPush =
            !lastPush ||
            ts - lastPush.t > 4000 ||
            haversineMeters(lastPush, {lat, lng}) > 25;
          if (!shouldPush) {
            return;
          }
          lastPushRef.current = {t: ts, lat, lng};
          void pushRemoteLocationPoint(seguimientoId, lat, lng);
        },
        () => {
          showAlert('Error', 'No se pudo obtener la ubicación.');
          setTrackingActive(false);
        },
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 10000},
      );

      watchIdRef.current = watchId;
    };

    const origenText = origen.trim() || 'Mi ubicación actual';
    const destinoText = destino.trim();

    void (async () => {
      try {
        const created = await apiService.post<{success: boolean; data?: {id?: string}; error?: string}>(
          API_ENDPOINTS.SEGUIMIENTO.CREATE,
          {origen: origenText, destino: destinoText},
        );
        const id = created?.success && created.data?.id ? String(created.data.id) : null;
        setActiveSeguimientoId(id);
        startWatch(id);
        showAlert(
          'Recorrido iniciado',
          id
            ? 'Tu recorrido está activo. Ya puedes compartir el enlace “Sígueme” desde el botón Compartir.'
            : 'Tu recorrido está activo (modo local). No se pudo crear sesión remota para compartir; revisa que estés autenticado con backend.',
        );
      } catch {
        setActiveSeguimientoId(null);
        startWatch(null);
        showAlert(
          'Recorrido iniciado',
          'Tu recorrido está activo (modo local). No se pudo crear sesión remota para compartir.',
        );
      }
    })();
  };

  const handleStopTracking = () => {
    const geo = (navigator as any)?.geolocation;
    if (watchIdRef.current !== null && geo?.clearWatch) {
      geo.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingActive(false);
    const segId = activeSeguimientoId;
    if (segId) {
      void apiService.post(API_ENDPOINTS.SEGUIMIENTO.FINISH(segId), {}).catch(() => {});
    }
    setActiveSeguimientoId(null);
    lastPushRef.current = null;
    const totalPoints = trackingPoints.length;
    const durationMs = trackingStart
      ? Date.now() - new Date(trackingStart).getTime()
      : 0;
    const minutes = Math.max(1, Math.round(durationMs / 60000));
    showAlert(
      'Recorrido finalizado',
      `Duración: ${minutes} min\nPuntos registrados: ${totalPoints}`,
    );
  };

  const handleShareRoute = async () => {
    try {
      const distance = routeData ? formatDistance(routeData.distance) : 'N/A';
      const duration = routeData ? formatDuration(routeData.duration) : 'N/A';
      const followUrl = activeSeguimientoId ? buildSeguimientoShareUrl(activeSeguimientoId) : null;
      const message = `Ruta Roller:\nOrigen: ${origen}\nDestino: ${destino}\nDistancia: ${distance}\nTiempo estimado: ${duration}${
        followUrl
          ? `\n\nSígueme en tiempo real desde la app RunSkateRoller:\n${followUrl}`
          : ''
      }`;
      if (Platform.OS === 'web' && (navigator as any)?.share) {
        await (navigator as any).share({text: message});
        return;
      }
      await Share.share({message});
    } catch (error) {
      showAlert('Compartir ruta', 'No se pudo compartir la ruta.');
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const inFollowUI = trackingActive || spectatorMode;

  const mapUserCoords = React.useMemo((): [number, number] | null => {
    if (!userCoords) {
      return null;
    }
    return [userCoords.lng, userCoords.lat];
  }, [userCoords?.lng, userCoords?.lat]);

  const previewCoordsForMap = React.useMemo((): [number, number] | null => {
    if (!confirmPick?.coords || confirmPick.coords.length < 2) {
      return null;
    }
    return [confirmPick.coords[0], confirmPick.coords[1]];
  }, [confirmPick?.coords?.[0], confirmPick?.coords?.[1]]);

  return (
    <NavegacionScreenShell spectatorMode={spectatorMode}>
      <View style={styles.container}>
        {/* Imagen de fondo a pantalla completa */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/patines-fondo-nuevo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.backgroundOverlay,
              mapFocus ? styles.backgroundOverlayMapFocus : null,
            ]}
          />
        </View>

        {/* Contenido sobre el fondo */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.contentContainer,
            Platform.OS === 'web' && routeFieldFocus ? styles.contentContainerWebKeyboard : null,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
        <View style={[styles.header, inFollowUI && styles.headerCompact]}>
          <View style={styles.headerTop}>
            {!spectatorMode && (
              <AvatarCircle
                avatar={currentUser?.avatar}
                fotoPerfil={currentUser?.fotoPerfil}
                size={50}
              />
            )}
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, inFollowUI && styles.titleCompact]}>
                {spectatorMode ? 'Siguiendo recorrido' : 'Inicio de Recorrido'}
              </Text>
              <Text style={[styles.subtitle, inFollowUI && styles.subtitleCompact]}>
                {spectatorMode
                  ? spectatorAlias
                    ? `En vivo: ${spectatorAlias}`
                    : 'Espectador en vivo'
                  : 'Navegación y Tracking'}
              </Text>
            </View>
          </View>
        </View>
        <LaunchPhaseBanner screenRouteName="Navegacion" />

        <View style={styles.formContainer}>
        {!trackingActive && !spectatorMode && (
          <>
            <View style={styles.routeCard}>
            <Text style={styles.addressHint}>
              Escribe o ten a la mano la calle y codigo postal para ubicar mejor origen y destino en el mapa.
            </Text>
            <View style={[styles.inputRow, styles.inputRowTop]}>
              <AutocompleteInput
                label={t('navigation.origin')}
                placeholder={
                  originPrefillLoading
                    ? 'Obteniendo tu ubicación...'
                    : 'Ej: Lic. Primo Verdad, Col. Jardines, CDMX'
                }
                value={origen}
                proximity={
                  userCoords ? `${userCoords.lng},${userCoords.lat}` : undefined
                }
                categorySearchRadiusKm={suggestedSearchRadiusKm}
                geoContext={geoContext}
                language={language}
                onChangeText={(text) => {
                  setOrigen(text);
                  // Si el usuario edita manualmente, dejamos de usar el GPS como origen.
                  if (originCoords) {
                    setOriginCoords(null);
                  }
                }}
                style={styles.input}
                labelStyle={styles.labelWhite}
                suppressSuggestions={routeFieldFocus === 'destino'}
                onFocusInput={() => setRouteFieldFocus('origen')}
                onBlurInput={() =>
                  setRouteFieldFocus((f) => (f === 'origen' ? null : f))
                }
                onSelectSuggestion={(suggestion) => {
                  // Paso A (tipo Uber): al seleccionar, previsualizamos y pedimos confirmar.
                  setOrigen(suggestion.place_name);
                  setConfirmPick({field: 'origen', label: suggestion.place_name, coords: suggestion.center});
                }}
              />
            </View>

            <View style={styles.useMyLocationRow}>
              <Button
                title="Usar mi ubicación"
                onPress={fetchAndSetOriginFromGPS}
                loading={originPrefillLoading}
                variant="outline"
                style={styles.useMyLocationButton}
                textStyle={styles.useMyLocationButtonText}
              />
              <Text style={styles.originStatusText}>
                {originPrefillLoading
                  ? 'Obteniendo GPS...'
                  : originCoords
                    ? 'Origen listo: GPS'
                    : origen.trim().length > 0
                      ? 'Origen listo: escrito'
                      : 'Origen: pendiente'}
              </Text>
            </View>

            <View style={[styles.inputRow, styles.inputRowBottom]}>
              <AutocompleteInput
                label={t('navigation.destination')}
                placeholder="Ej: Xitla, Col. Arenal 4ta Sección, CDMX"
                value={destino}
                proximity={
                  userCoords ? `${userCoords.lng},${userCoords.lat}` : undefined
                }
                categorySearchRadiusKm={suggestedSearchRadiusKm}
                geoContext={geoContext}
                language={language}
                onChangeText={setDestino}
                style={styles.input}
                labelStyle={styles.labelWhite}
                suppressSuggestions={routeFieldFocus === 'origen'}
                onFocusInput={() => setRouteFieldFocus('destino')}
                onBlurInput={() =>
                  setRouteFieldFocus((f) => (f === 'destino' ? null : f))
                }
                onSelectSuggestion={(suggestion) => {
                  // Paso A (tipo Uber): al seleccionar, previsualizamos y pedimos confirmar.
                  setDestino(suggestion.place_name);
                  setConfirmPick({field: 'destino', label: suggestion.place_name, coords: suggestion.center});
                }}
              />
            </View>

            <Button
              title={t('navigation.calculate')}
              onPress={handleCalcularRuta}
              loading={loading}
              style={styles.calculateButton}
              textStyle={styles.calculateButtonText}
            />

            {confirmPick && (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>
                  {confirmPick.field === 'origen'
                    ? `${t('navigation.origin')}: confirmar punto`
                    : `${t('navigation.destination')}: confirmar punto`}
                </Text>
                <Text style={styles.confirmSubtitle} numberOfLines={2}>
                  {confirmPick.label}
                </Text>
                <View style={styles.confirmActions}>
                  <Button
                    title="Cambiar"
                    variant="outline"
                    style={styles.confirmBtn}
                    onPress={() => {
                      if (confirmPick.field === 'origen') {
                        setOrigen(confirmedOriginText || '');
                      } else {
                        setDestino(confirmedDestText || '');
                      }
                      setConfirmPick(null);
                    }}
                  />
                  <Button
                    title="Confirmar"
                    style={styles.confirmBtn}
                    onPress={() => {
                      if (confirmPick.field === 'origen') {
                        setOriginCoords(confirmPick.coords);
                        setConfirmedOriginText(confirmPick.label);
                      } else {
                        setDestinationCoords(confirmPick.coords);
                        setConfirmedDestText(confirmPick.label);
                      }
                      // Al confirmar cambiamos el estado de ruta (como Uber: confirma → luego calcular).
                      routeRequestedRef.current = false;
                      setRouteRequested(false);
                      setRouteData(null);
                      setLoading(false);
                      setConfirmPick(null);
                    }}
                  />
                </View>
              </View>
            )}
            </View>
          </>
        )}

        {routeRequested && routeData && !spectatorMode && (
          <View>
            <View style={styles.statsPillsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Distancia</Text>
                <Text style={styles.statValue}>{formatDistance(routeData.distance)}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Tiempo</Text>
                <Text style={styles.statValue}>{formatDuration(routeData.duration)}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Calorías</Text>
                <Text style={styles.statValue}>
                  {Math.round((routeData.distance / 1000) * 50)}
                </Text>
              </View>
            </View>
            <Button
              title="Crear Recap"
              onPress={() => {
                if (Platform.OS !== 'web') {
                  showAlert(
                    'Crear Recap',
                    'La generación de recap con video está disponible en web por ahora; la app nativa vendrá después.',
                  );
                  return;
                }
                navigation.navigate('CrearRecap');
              }}
              variant="outline"
              style={styles.recapButton}
              textStyle={styles.recapButtonText}
            />
            <Button
              title="¡VAMOS! · Iniciar"
              onPress={handleStartTracking}
              style={styles.startRouteButton}
              textStyle={styles.startRouteButtonText}
            />
            {trackingActive && (
              <View style={styles.routeActionsRow}>
                <Button
                  title="Compartir Ruta"
                  onPress={handleShareRoute}
                  style={styles.shareRouteButton}
                  textStyle={styles.shareRouteButtonText}
                />
                <Button
                  title="Terminar Ruta"
                  onPress={handleStopTracking}
                  style={styles.endRouteButton}
                  textStyle={styles.endRouteButtonText}
                />
              </View>
            )}
          </View>
        )}

        {spectatorMode && (
          <View style={styles.spectatorActions}>
            <Button
              title="Salir"
              onPress={() => {
                void exitSeguimientoYRedirigir();
              }}
              variant="outline"
              style={styles.spectatorExitButton}
              textStyle={styles.spectatorExitText}
            />
          </View>
        )}

        {/* En web, flex:1 dentro de ScrollView a menudo deja altura 0: altura mínima explícita para Mapbox */}
        <Pressable
          onPressIn={() => setMapFocus(true)}
          onPressOut={() => setMapFocus(false)}
          style={[
            styles.mapWrapper,
            styles.mapCard,
            trackingActive && styles.mapWrapperNav,
            spectatorMode && styles.mapWrapperSpectator,
            Platform.OS === 'web'
              ? {
                  // En Safari móvil el viewport "baila" (barra inferior). Un alto relativo reduce el bloque gris al final.
                  height: Math.max(440, Math.round(winH * (spectatorMode ? 0.86 : inFollowUI ? 0.82 : 0.60))),
                  minHeight: Math.max(440, Math.round(winH * (spectatorMode ? 0.86 : inFollowUI ? 0.82 : 0.60))),
                }
              : null,
          ]}>
          <MapboxMap
            origin={mapOrigin}
            destination={mapDestination}
            originCoords={originCoords}
            destinationCoords={destinationCoords}
            language={language}
            userCoords={mapUserCoords}
            previewCoords={previewCoordsForMap}
            routeGeometry={routeData?.geometry}
            calculateRoute={routeRequested && !spectatorMode}
            trackingActive={trackingActive || spectatorMode}
            followMode={inFollowUI}
            followZoom={17.6}
            followPitch={60}
            trackingPoints={trackingPoints}
            styleVariant="night"
          />
        </Pressable>
        </View>
        </ScrollView>
      </View>
    </NavegacionScreenShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 12, 24, 0.52)',
  },
  backgroundOverlayMapFocus: {
    backgroundColor: 'rgba(10, 12, 24, 0.68)',
  },
  contentScroll: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  /** Espacio extra al final en web móvil para poder hacer scroll y que origen/destino no queden tapados por el teclado. */
  contentContainerWebKeyboard: {
    paddingBottom: 140,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    alignItems: 'flex-start', // Cambiar para alinear el avatar a la izquierda
    // Sin fondo para que resalte la imagen de atrás
  },
  headerCompact: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'web' ? 10 : 34,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 31, // 30% más grande (24 * 1.30 = 31.2, redondeado a 31)
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center', // Centrar el texto
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  titleCompact: {
    fontSize: 22,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 21, // 30% más grande (16 * 1.30 = 20.8, redondeado a 21)
    color: '#FFF',
    textAlign: 'center', // Centrar el texto
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  subtitleCompact: {
    fontSize: 14,
  },
  formContainer: {
    padding: 20,
    // Sin fondo para que resalte la imagen de atrás
    zIndex: 1,
  },
  routeCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.14)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 12},
    elevation: 10,
  },
  addressHint: {
    color: 'rgba(226, 232, 240, 0.78)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  inputRow: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 50,
    elevation: 20,
  },
  /** Origen por debajo del botón GPS y del Destino (Safari iOS respeta el orden de capas). */
  inputRowTop: {
    zIndex: 48,
    elevation: 22,
  },
  /** Destino arriba de Origen y «Usar mi ubicación» para que reciba toques. */
  inputRowBottom: {
    zIndex: 100,
    elevation: 30,
  },
  input: {
    width: '100%',
  },
  useMyLocationRow: {
    marginTop: -6,
    marginBottom: 16,
    zIndex: 55,
    elevation: 24,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  useMyLocationButton: {
    width: '100%',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(15, 23, 42, 0.30)',
  },
  useMyLocationButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  originStatusText: {
    marginTop: 8,
    textAlign: 'center',
    color: 'rgba(248, 250, 252, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  calculateButton: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 56,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    zIndex: 1,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  confirmCard: {
    marginTop: 12,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 18,
  },
  confirmTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  confirmSubtitle: {
    color: 'rgba(248, 250, 252, 0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  confirmActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmBtn: {
    flex: 1,
    marginHorizontal: 6,
  },
  statsPillsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  statPill: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 110,
    backgroundColor: 'rgba(226, 232, 240, 0.08)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.20)',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 0},
    elevation: 6,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(226, 232, 240, 0.72)',
    marginBottom: 6,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 18,
    color: 'rgba(248, 250, 252, 0.96)',
    fontWeight: '900',
  },
  startRouteButton: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    backgroundColor: '#0891B2',
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 14,
    minHeight: 56,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    zIndex: 1,
  },
  startRouteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#FFF',
  },
  recapButton: {
    marginTop: 12,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(15, 23, 42, 0.30)',
  },
  recapButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  routeActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  shareRouteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  shareRouteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  endRouteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  endRouteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  mapWrapper: {
    margin: 20,
    marginBottom: 12,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.14)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 14},
    elevation: 16,
    ...Platform.select({
      web: {
        flex: 0,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
        minHeight: 420,
      },
      default: {
        flex: 1,
      },
    }),
  },
  mapCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.70)',
  },
  mapWrapperNav: {
    marginTop: 10,
    marginBottom: 12,
  },
  mapWrapperSpectator: {
    marginHorizontal: 0,
    borderRadius: 0,
    maxWidth: '100%',
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  spectatorActions: {
    marginTop: 6,
    marginBottom: 10,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  spectatorExitButton: {
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(15, 23, 42, 0.30)',
  },
  spectatorExitText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  labelWhite: {
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  mapLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

