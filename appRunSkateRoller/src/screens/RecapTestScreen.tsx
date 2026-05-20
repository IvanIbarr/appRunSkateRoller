import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import authService from '../services/authService';
import subscriptionsService from '../services/subscriptionsService';
import seguimientoService from '../services/seguimientoService';
import apiService from '../services/apiService';
import {getApiBaseUrl} from '../config/api';
import {MAPBOX_ACCESS_TOKEN, isExampleToken} from '../config/mapbox';

type LoadedPhoto = {id: string; url: string; tsLabel: string};
type GeoPoint = {lat: number; lng: number};
type MapViewState = {centerLng: number; centerLat: number; zoom: number};
type RecapStats = {km: number; durationSec: number; avgKmh: number};

/** Web pública (Recap con canvas + MediaRecorder solo en navegador). */
const RECAP_WEB_URL = 'https://siigroller.com';

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function formatTs(secondsFromStart: number): string {
  const s = Math.max(0, Math.floor(secondsFromStart));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function createDemoRoute(count: number): Array<{x: number; y: number}> {
  const pts: Array<{x: number; y: number}> = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const x = t;
    const y = 0.52 + Math.sin(t * Math.PI * 1.55) * 0.17 + Math.sin(t * Math.PI * 4.1) * 0.03;
    pts.push({x, y});
  }
  return pts;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeMapViewFromGeo(points: GeoPoint[]): MapViewState | null {
  if (points.length < 2) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const spanLat = Math.max(maxLat - minLat, 0.0005);
  const spanLng = Math.max(maxLng - minLng, 0.0005);
  const span = Math.max(spanLat, spanLng);
  const zoom = clamp(12 - Math.log2(span * 220), 9, 16);
  return {centerLat, centerLng, zoom};
}

function projectGeoPoint(
  p: GeoPoint,
  w: number,
  h: number,
  view: MapViewState,
): {sx: number; sy: number} {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const worldSize = 512 * Math.pow(2, view.zoom);
  const mercX = (lng: number) => ((lng + 180) / 360) * worldSize;
  const mercY = (lat: number) => {
    const s = Math.sin(toRad(clamp(lat, -85, 85)));
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldSize;
  };

  const cx = mercX(view.centerLng);
  const cy = mercY(view.centerLat);
  const px = mercX(p.lng);
  const py = mercY(p.lat);
  const x = (px - cx) + w / 2;
  const y = (py - cy) + h / 2;
  return {sx: x, sy: y};
}

function buildMapboxStaticUrl(view: MapViewState, width: number, height: number): string | null {
  if (!MAPBOX_ACCESS_TOKEN || isExampleToken()) {
    return null;
  }
  const w = clamp(Math.round(width), 320, 1280);
  const h = clamp(Math.round(height), 180, 720);
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${view.centerLng},${view.centerLat},${view.zoom},0/${w}x${h}?access_token=${MAPBOX_ACCESS_TOKEN}`;
}

function mapToScreen(
  p: {x: number; y: number},
  w: number,
  h: number,
  pitch: number,
  bearing: number,
): {sx: number; sy: number} {
  // Convertimos a coords centradas y aplicamos rotación (bearing) y “pitch” simulado.
  const cx = (p.x - 0.5) * 2;
  const cy = (p.y - 0.5) * 2;

  const br = (bearing * Math.PI) / 180;
  const rx = cx * Math.cos(br) - cy * Math.sin(br);
  const ry = cx * Math.sin(br) + cy * Math.cos(br);

  // Pitch “fake”: comprimimos Y y agregamos ligera perspectiva.
  const py = ry * (1 - pitch * 0.35);
  const persp = 1 + (py + 0.35) * pitch * 0.22;
  const fx = rx * persp;
  const fy = py;

  const sx = w * 0.5 + fx * (w * 0.38);
  const sy = h * 0.52 + fy * (h * 0.33);
  return {sx, sy};
}

function supportsMediaRecorder(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return typeof (window as any).MediaRecorder === 'function';
}

function pickBestMimeType(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const MR = (window as any).MediaRecorder;
  if (!MR || typeof MR.isTypeSupported !== 'function') return null;
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const c of candidates) {
    try {
      if (MR.isTypeSupported(c)) return c;
    } catch {
      // ignore
    }
  }
  return null;
}

function canDrawImage(img: HTMLImageElement | null | undefined): boolean {
  if (!img) return false;
  return Boolean(img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
}

/**
 * Patín en línea (vista lateral): bota con gradiente + chasis + 4 ruedas en fila.
 * Coordenadas locales: el eje +X apunta hacia delante del movimiento.
 */
function drawInlineSkateMarker(ctx: CanvasRenderingContext2D, sizePx: number): void {
  const sc = sizePx / 44;
  ctx.save();
  ctx.scale(sc, sc);

  const g = ctx.createLinearGradient(-28, -22, 30, 14);
  g.addColorStop(0, '#be185d');
  g.addColorStop(0.35, '#ec4899');
  g.addColorStop(0.65, '#f97316');
  g.addColorStop(1, '#fb923c');

  ctx.beginPath();
  ctx.moveTo(-23, 8);
  ctx.quadraticCurveTo(-26, -12, -10, -18);
  ctx.quadraticCurveTo(4, -21, 20, -12);
  ctx.quadraticCurveTo(28, -2, 24, 10);
  ctx.lineTo(-20, 10);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Tobillera / cuff
  ctx.beginPath();
  ctx.roundRect(-18, -24, 22, 9, 4);
  ctx.fillStyle = 'rgba(251, 113, 133, 0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Brillo en empeine
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.quadraticCurveTo(6, -14, 16, -6);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Chasis / frame
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-27, 11, 54, 5, 2);
  ctx.fill();
  ctx.stroke();

  // Cuatro ruedas en línea (inline)
  const wy = 19;
  const xs = [-17, -5.5, 6, 17.5];
  for (const x of xs) {
    ctx.beginPath();
    ctx.arc(x, wy, 5.2, 0, Math.PI * 2);
    const wg = ctx.createRadialGradient(x - 1.2, wy - 1.2, 0, x, wy, 5.5);
    wg.addColorStop(0, '#fecdd3');
    wg.addColorStop(0.55, '#f472b6');
    wg.addColorStop(1, '#db2777');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.22)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, wy, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  }

  ctx.restore();
}

const APP_BRAND = 'RunSkateRoller';

type CrearRecapNav = NativeStackNavigationProp<RootStackParamList, 'CrearRecap'>;

export const CrearRecapScreen: React.FC = () => {
  const navigation = useNavigation<CrearRecapNav>();
  const hostRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const [status, setStatus] = useState<'idle' | 'ready' | 'recording' | 'done' | 'error'>(
    'idle',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<LoadedPhoto[]>([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [activePlanId, setActivePlanId] = useState<'gratis0' | 'pase25' | 'plus59' | 'plus479'>(
    'gratis0',
  );

  const maxPhotosByPlan = (planId: typeof activePlanId): number => {
    if (planId === 'pase25') return 15;
    if (planId === 'plus59' || planId === 'plus479') return 60;
    return 5;
  };
  const priorityLabel = (planId: typeof activePlanId): string => {
    if (planId === 'plus59' || planId === 'plus479') return 'Prioridad VIP';
    if (planId === 'pase25') return 'Prioridad alta';
    return 'Prioridad estándar (cola)';
  };
  const maxPhotosRef = useRef<number>(maxPhotosByPlan('gratis0'));
  const planIdRef = useRef<typeof activePlanId>('gratis0');

  useEffect(() => {
    planIdRef.current = activePlanId;
    maxPhotosRef.current = maxPhotosByPlan(activePlanId);
  }, [activePlanId]);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const me = await authService.getCurrentUser();
        if (!me?.id || !me.email) {
          setActivePlanId('gratis0');
          return;
        }
        const sub = await subscriptionsService.get(me.id, me.email);
        const planId =
          sub?.status === 'active' && sub.planId
            ? (sub.planId as typeof activePlanId)
            : 'gratis0';
        setActivePlanId(planId);
      } catch {
        setActivePlanId('gratis0');
      }
    };
    void loadPlan();
  }, []);

  const fallbackRoute = useMemo(() => createDemoRoute(220), []);
  const [geoRoute, setGeoRoute] = useState<GeoPoint[]>([]);
  const [mapView, setMapView] = useState<MapViewState | null>(null);
  const [mapBackground, setMapBackground] = useState<HTMLImageElement | null>(null);
  const [recapStats, setRecapStats] = useState<RecapStats>({km: 0, durationSec: 15 * 60, avgKmh: 0});

  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const resolveHostEl = (ref: any): HTMLElement | null => {
      if (!ref) return null;
      if (typeof ref.appendChild === 'function') return ref as HTMLElement;
      const inner = ref._nativeNode ?? ref.__dom__ ?? ref.current;
      if (inner && typeof inner.appendChild === 'function') return inner as HTMLElement;
      return null;
    };

    let cancelled = false;
    let root: HTMLDivElement | null = null;
    let resizeHandler: (() => void) | undefined;
    let mountAttempts = 0;
    const MAX_MOUNT_FRAMES = 600;

    const mountWhenHostReady = () => {
      if (cancelled) return;
      const hostEl = resolveHostEl(hostRef.current);
      mountAttempts += 1;
      if (!hostEl) {
        if (mountAttempts >= MAX_MOUNT_FRAMES) {
          setStatus('error');
          setErrorMsg(
            'No se pudo iniciar el visor de Recap en esta vista. Recarga la página o prueba Chrome/Edge.',
          );
          return;
        }
        requestAnimationFrame(mountWhenHostReady);
        return;
      }
      if (root) {
        return;
      }

    root = document.createElement('div');
    root.style.position = 'relative';
    root.style.width = '100%';
    root.style.maxWidth = '960px';
    root.style.margin = '0 auto';

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.aspectRatio = '16 / 9';
    canvas.style.display = 'block';
    canvas.style.borderRadius = '16px';
    canvas.style.background = 'linear-gradient(180deg, rgba(2,6,23,0.95), rgba(15,23,42,0.95))';
    canvas.style.border = '1px solid rgba(255,255,255,0.10)';
    canvas.style.boxShadow = '0 18px 55px rgba(0,0,0,0.35)';
    canvas.style.overflow = 'hidden';

    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.style.marginTop = '14px';
    video.style.width = '100%';
    video.style.borderRadius = '14px';
    video.style.border = '1px solid rgba(255,255,255,0.10)';
    video.style.background = 'rgba(2,6,23,0.92)';

    const pickerWrap = document.createElement('div');
    pickerWrap.style.marginTop = '12px';
    pickerWrap.style.display = 'flex';
    pickerWrap.style.alignItems = 'center';
    pickerWrap.style.justifyContent = 'space-between';
    pickerWrap.style.gap = '10px';
    pickerWrap.style.flexWrap = 'wrap';

    const pickerLabel = document.createElement('div');
    pickerLabel.textContent = `Fotos (máx ${maxPhotosRef.current}) para tu recap`;
    pickerLabel.style.color = 'rgba(226,232,240,0.92)';
    pickerLabel.style.fontSize = '12px';
    pickerLabel.style.fontWeight = '700';

    const input = document.createElement('input');
    input.id = 'recap-photo-input';
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = () => {
      const all = Array.from(input.files || []);
      const limit = maxPhotosRef.current;
      if (all.length > limit) {
        const isFree = planIdRef.current === 'gratis0';
        const msg = isFree
          ? `¡Llegaste al límite gratis! Puedes subir hasta ${limit} fotos.\n\nDesbloquea hasta 15 fotos con el Pase Único ($25) o hasta 60 con Plus.`
          : `Límite del plan: puedes subir hasta ${limit} fotos.`;
        window.alert(msg);
        // Ofrecer planes si es gratis
        if (isFree && typeof window !== 'undefined' && typeof window.confirm === 'function') {
          const go = window.confirm('¿Quieres ver los planes Plus ahora?');
          if (go) {
            // Navegar desde RN a planes
            try {
              (navigation as any).navigate('RecapCheckoutPlan');
            } catch {
              // ignore
            }
          }
        }
      }
      const files = all.slice(0, limit);
      const next: LoadedPhoto[] = files.map((f, idx) => ({
        id: `${Date.now()}-${idx}`,
        url: URL.createObjectURL(f),
        tsLabel: formatTs(2 + idx * 3),
      }));
      setPhotos((prev) => {
        prev.forEach((p) => {
          try {
            URL.revokeObjectURL(p.url);
          } catch {
            // ignore
          }
        });
        return next;
      });
      // Actualizar label por si cambió plan
      pickerLabel.textContent = `Fotos (máx ${maxPhotosRef.current}) para tu recap`;
    };

    pickerWrap.appendChild(pickerLabel);
    pickerWrap.appendChild(input);

    root.appendChild(canvas);
    root.appendChild(pickerWrap);
    root.appendChild(video);
    hostEl.appendChild(root);

    canvasRef.current = canvas;

    resizeHandler = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round((rect.width * 9) / 16 * dpr);
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    setStatus('ready');
    };

    requestAnimationFrame(mountWhenHostReady);

    return () => {
      cancelled = true;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      try {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } catch {
        // ignore
      }
      try {
        if (canvasRef.current && canvasRef.current.parentNode) {
          canvasRef.current.parentNode.removeChild(canvasRef.current);
        }
      } catch {
        // ignore
      }
      try {
        if (root && root.parentNode) root.parentNode.removeChild(root);
      } catch {
        // ignore
      }
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup blob URLs
      if (videoUrl) {
        try {
          URL.revokeObjectURL(videoUrl);
        } catch {
          // ignore
        }
      }
      photos.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {
          // ignore
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let cancelled = false;
    const loadLatestSeguimiento = async () => {
      try {
        const history = await seguimientoService.getHistory('all');
        const items = (history?.success && Array.isArray(history.data)) ? history.data : [];
        if (items.length === 0) return;

        const sorted = [...items].sort(
          (a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime(),
        );
        const latest = sorted[0];
        const stats = latest.stats;
        if (stats) {
          const km = Math.max(0, (Number(stats.distanciaTotal) || 0) / 1000);
          const durationSec = Math.max(1, Number(stats.duracion) || 15 * 60);
          const avgKmh =
            Number(stats.velocidadPromedio) > 0
              ? Number(stats.velocidadPromedio) * 3.6
              : km > 0
                ? (km / (durationSec / 3600))
                : 0;
          setRecapStats({
            km: Number(km.toFixed(2)),
            durationSec,
            avgKmh: Number(avgKmh.toFixed(1)),
          });
        }

        const detail = await apiService.get<{success?: boolean; data?: {puntos?: Array<{latitud: number; longitud: number}>}}>(
          `${getApiBaseUrl()}/seguimiento/${latest.id}`,
        );
        const rawPts = detail?.success && detail?.data?.puntos ? detail.data.puntos : [];
        const pts: GeoPoint[] = rawPts
          .map((p) => ({lat: Number(p.latitud), lng: Number(p.longitud)}))
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

        if (cancelled || pts.length < 2) return;
        const view = computeMapViewFromGeo(pts);
        setGeoRoute(pts);
        setMapView(view);

        if (!view) return;
        const staticUrl = buildMapboxStaticUrl(view, 1280, 720);
        if (!staticUrl) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!cancelled) setMapBackground(img);
        };
        img.onerror = () => {
          if (!cancelled) setMapBackground(null);
        };
        img.src = staticUrl;
      } catch {
        // fallback silencioso al modo demo
      }
    };

    void loadLatestSeguimiento();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderFrame = async (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    photoImgs: HTMLImageElement[],
  ) => {
    // Safari/algunos WebView: roundRect puede no existir.
    if (typeof (ctx as any).roundRect !== 'function') {
      (ctx as any).roundRect = function (
        this: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
      ) {
        const r = Math.min(Math.max(0, radius), width / 2, height / 2);
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + width, y, x + width, y + height, r);
        this.arcTo(x + width, y + height, x, y + height, r);
        this.arcTo(x, y + height, x, y, r);
        this.arcTo(x, y, x + width, y, r);
        this.closePath();
      };
    }
    // Background “map minimalista”: grid + “calles” curvas muy suaves.
    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(1, '#0B1224');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Glow suave
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.75);
    glow.addColorStop(0, 'rgba(56,189,248,0.10)');
    glow.addColorStop(1, 'rgba(56,189,248,0.00)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Grid “ciudad”
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = 'rgba(148,163,184,0.55)';
    ctx.lineWidth = Math.max(1, w * 0.0012);
    const step = Math.max(18, Math.round(w * 0.035));
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    // Fondo de mapa real (si hay) o fallback visual.
    if (mapBackground) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(mapBackground, 0, 0, w, h);
      ctx.restore();
    }

    // “Pitch/bearing” simulados solo para fallback demo.
    const pitch = 0.78;
    const bearing = -18;
    const useGeoRoute = geoRoute.length >= 2 && !!mapView;
    const screenRoute = useGeoRoute
      ? geoRoute.map((p) => projectGeoPoint(p, w, h, mapView!))
      : fallbackRoute.map((p) => mapToScreen(p, w, h, pitch, bearing));

    const n = screenRoute.length;
    const prog = clamp01(tNorm);
    const upto = Math.max(2, Math.floor(prog * (n - 1)));

    // Cámara cinematográfica: paneo suave siguiendo al patín + zoom sutil.
    const focus = screenRoute[upto];
    const desiredX = w * 0.56;
    const desiredY = h * 0.56;
    const camDx = (desiredX - focus.sx) * (useGeoRoute ? 0.42 : 0.15);
    const camDy = (desiredY - focus.sy) * (useGeoRoute ? 0.34 : 0.12);
    const zoom = useGeoRoute ? 1.05 + 0.045 * Math.sin(prog * Math.PI) : 1;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2 + camDx, -h / 2 + camDy);

    // Sombra de ruta
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(10, w * 0.010);
    ctx.beginPath();
    ctx.moveTo(screenRoute[0].sx, screenRoute[0].sy + h * 0.012);
    for (let i = 1; i <= upto; i += 1) {
      ctx.lineTo(screenRoute[i].sx, screenRoute[i].sy + h * 0.012);
    }
    ctx.stroke();
    ctx.restore();

    // Trazo principal (glow más limpio)
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(5.5, w * 0.006);
    const lineGrad = ctx.createLinearGradient(
      screenRoute[0].sx,
      screenRoute[0].sy,
      screenRoute[Math.max(1, upto)].sx,
      screenRoute[Math.max(1, upto)].sy,
    );
    lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
    lineGrad.addColorStop(0.55, 'rgba(34, 211, 238, 0.95)');
    lineGrad.addColorStop(1, 'rgba(244, 114, 182, 0.92)');
    ctx.strokeStyle = lineGrad;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.45)';
    ctx.shadowBlur = Math.max(10, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(screenRoute[0].sx, screenRoute[0].sy);
    for (let i = 1; i <= upto; i += 1) {
      ctx.lineTo(screenRoute[i].sx, screenRoute[i].sy);
    }
    ctx.stroke();
    ctx.restore();

    // Partículas (estela)
    ctx.save();
    const tail = Math.max(12, Math.round(n * 0.06));
    for (let k = 0; k < tail; k += 1) {
      const idx = Math.max(0, upto - k);
      const p = screenRoute[idx];
      const a = (1 - k / tail) * 0.35;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(251, 146, 60, 0.95)';
      const r = Math.max(1.5, w * 0.0022) * (1 - k / tail);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Patín en línea (marcador estilo app)
    const skate = screenRoute[upto];
    ctx.save();
    ctx.translate(skate.sx, skate.sy);
    const prev = screenRoute[Math.max(0, upto - 2)];
    const ang = Math.atan2(skate.sy - prev.sy, skate.sx - prev.sx);
    ctx.rotate(ang);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.max(12, w * 0.014);
    ctx.shadowOffsetY = 2;
    drawInlineSkateMarker(ctx, Math.max(26, w * 0.058));
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();
    ctx.restore();

    // HUD (marca Roller + tiempo)
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(2,6,23,0.62)';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w * 0.03, h * 0.04, w * 0.44, h * 0.12, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(248,250,252,0.96)';
    ctx.font = `700 ${Math.max(16, Math.round(w * 0.022))}px system-ui, -apple-system, Segoe UI, Arial`;
    ctx.fillText('ROLLER RECAP', w * 0.05, h * 0.095);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.95)';
    ctx.font = `700 ${Math.max(12, Math.round(w * 0.016))}px system-ui, -apple-system, Segoe UI, Arial`;
    ctx.fillText(`Tiempo: ${formatTs(tNorm * 15)}`, w * 0.05, h * 0.135);

    // Tarjeta de métricas para demo de negocio (datos reales cuando existen).
    ctx.fillStyle = 'rgba(2,6,23,0.62)';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w * 0.68, h * 0.04, w * 0.29, h * 0.16, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(226,232,240,0.95)';
    ctx.font = `800 ${Math.max(10, Math.round(w * 0.012))}px system-ui, -apple-system, Segoe UI, Arial`;
    ctx.fillText(`KM ${recapStats.km.toFixed(2)}`, w * 0.705, h * 0.085);
    ctx.fillText(`Ritmo ${recapStats.avgKmh.toFixed(1)} km/h`, w * 0.705, h * 0.118);
    ctx.fillText(`Duración ${formatTs(recapStats.durationSec)}`, w * 0.705, h * 0.151);
    ctx.restore();

    // Fotos en esquinas (máx 4) + timestamp con transición premium.
    const cards = [
      {x: w * 0.03, y: h * 0.20},
      {x: w * 0.72, y: h * 0.20},
      {x: w * 0.03, y: h * 0.72},
      {x: w * 0.72, y: h * 0.72},
    ];
    const cardW = w * 0.25;
    const cardH = h * 0.18;
    for (let i = 0; i < Math.min(4, photoImgs.length); i += 1) {
      const img = photoImgs[i];
      const {x, y} = cards[i];
      const appearStart = 0.08 + i * 0.13;
      const appearEnd = appearStart + 0.22;
      const progress = clamp((prog - appearStart) / (appearEnd - appearStart), 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      const cardAlpha = 0.18 + 0.82 * eased;
      const slideY = (1 - eased) * 16;

      ctx.save();
      ctx.globalAlpha = cardAlpha;
      ctx.translate(0, slideY);
      ctx.fillStyle = 'rgba(15,23,42,0.72)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 14);
      ctx.fill();
      ctx.stroke();
      // foto
      const pad = 8;
      const iw = cardW - pad * 2;
      const ih = cardH - pad * 2 - 20;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, iw, ih, 10);
      ctx.clip();
      if (canDrawImage(img)) {
        try {
          ctx.drawImage(img, x + pad, y + pad, iw, ih);
        } catch {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
          ctx.fillRect(x + pad, y + pad, iw, ih);
          ctx.fillStyle = 'rgba(148,163,184,0.95)';
          ctx.font = `700 ${Math.max(11, Math.round(w * 0.013))}px system-ui, -apple-system, Segoe UI, Arial`;
          ctx.fillText('Foto no disponible', x + pad + 10, y + pad + 24);
        }
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
        ctx.fillRect(x + pad, y + pad, iw, ih);
        ctx.fillStyle = 'rgba(148,163,184,0.95)';
        ctx.font = `700 ${Math.max(11, Math.round(w * 0.013))}px system-ui, -apple-system, Segoe UI, Arial`;
        ctx.fillText('Foto no disponible', x + pad + 10, y + pad + 24);
      }
      ctx.restore();
      // timestamp
      ctx.fillStyle = 'rgba(226,232,240,0.92)';
      ctx.font = `800 ${Math.max(11, Math.round(w * 0.014))}px system-ui, -apple-system, Segoe UI, Arial`;
      ctx.fillText(`📸 ${formatTs(2 + i * 3)}`, x + pad, y + cardH - 10);
      ctx.restore();
    }
  };

  const createRecap15s = async () => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('El visor aún no está listo. Espera un segundo o recarga la página.');
      }
      return;
    }
    if (status === 'idle') {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Preparando el visor… Si tarda, recarga o prueba en Chrome/Edge.');
      }
      return;
    }
    if (!supportsMediaRecorder()) {
      setStatus('error');
      setErrorMsg('Este navegador no soporta MediaRecorder para grabar el canvas.');
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setStatus('error');
      setErrorMsg('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    setErrorMsg(null);
    setStatus('recording');
    if (videoUrl) {
      try {
        URL.revokeObjectURL(videoUrl);
      } catch {
        // ignore
      }
      setVideoUrl(null);
    }

    // Precargar imágenes (si no hay, usamos placeholders simples generados).
    const loadImage = (url: string) =>
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = url;
      });

    const demoPlaceholders = [
      'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#38BDF8"/><stop offset="1" stop-color="#22C55E"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="52%" fill="rgba(2,6,23,0.92)" font-family="system-ui,Segoe UI,Arial" font-size="44" font-weight="900" text-anchor="middle">FOTO 1</text></svg>`),
      'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="100%" height="100%" fill="#0EA5E9"/><text x="50%" y="52%" fill="rgba(2,6,23,0.92)" font-family="system-ui,Segoe UI,Arial" font-size="44" font-weight="900" text-anchor="middle">FOTO 2</text></svg>`),
      'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="100%" height="100%" fill="#22C55E"/><text x="50%" y="52%" fill="rgba(2,6,23,0.92)" font-family="system-ui,Segoe UI,Arial" font-size="44" font-weight="900" text-anchor="middle">FOTO 3</text></svg>`),
      'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="100%" height="100%" fill="#F59E0B"/><text x="50%" y="52%" fill="rgba(2,6,23,0.92)" font-family="system-ui,Segoe UI,Arial" font-size="44" font-weight="900" text-anchor="middle">FOTO 4</text></svg>`),
    ];

    const photoUrls = (photos.length > 0 ? photos.map((p) => p.url) : demoPlaceholders).slice(
      0,
      4,
    );
    const imgs = await Promise.all(photoUrls.map(loadImage));

    const stream = canvas.captureStream(30);
    const mimeType = pickBestMimeType();
    try {
      recordedChunksRef.current = [];
      const rec = new MediaRecorder(stream, mimeType ? {mimeType} : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      rec.onerror = () => {
        setStatus('error');
        setErrorMsg('Falló la grabación del recap.');
      };
      rec.onstop = () => {
        try {
          const blob = new Blob(recordedChunksRef.current, {type: rec.mimeType || 'video/webm'});
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setStatus('done');
          // Setear el <video> (creado en DOM) si existe
          const host = hostRef.current?._nativeNode ?? hostRef.current?.__dom__ ?? hostRef.current;
          const vid = host?.querySelector?.('video') as HTMLVideoElement | null;
          if (vid) {
            vid.src = url;
            vid.load();
          }
        } catch {
          setStatus('error');
          setErrorMsg('No se pudo construir el archivo de video.');
        }
      };

      // Animación 15s — un solo frame async a la vez (evita colgar el navegador).
      const start = performance.now();
      const durationMs = 15000;
      rec.start(250);

      const tick = (now: number) => {
        const w = canvas.width;
        const h = canvas.height;
        if (w < 2 || h < 2) {
          setStatus('error');
          setErrorMsg(
            'El canvas no tiene tamaño (0×0). Ensancha la ventana o recarga e inténtalo de nuevo.',
          );
          try {
            recorderRef.current?.stop();
          } catch {
            // ignore
          }
          return;
        }
        const tNorm = clamp01((now - start) / durationMs);
        void Promise.resolve(renderFrame(ctx, w, h, tNorm, imgs)).then(
          () => {
            if (tNorm < 1 && recorderRef.current?.state === 'recording') {
              rafRef.current = requestAnimationFrame(tick);
            } else {
              try {
                recorderRef.current?.stop();
              } catch {
                // ignore
              }
            }
          },
          (err: unknown) => {
            console.error('Recap renderFrame', err);
            setStatus('error');
            setErrorMsg(
              'Error al generar un fotograma. Prueba con menos fotos u otro navegador (Chrome/Edge).',
            );
            try {
              recorderRef.current?.stop();
            } catch {
              // ignore
            }
          },
        );
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setStatus('error');
      setErrorMsg('Tu navegador bloqueó el encoder. Prueba Chrome/Edge.');
    }
  };

  const download = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!videoUrl) return;
    if (planIdRef.current === 'gratis0' && typeof window !== 'undefined') {
      const ok = typeof window.confirm === 'function'
        ? window.confirm(
            'Descarga en HD y sin marca de agua con Pase Único o Plus.\n\n¿Quieres descargar ahora (modo demo) o ver planes?',
          )
        : true;
      // Si el usuario cancela, lo mandamos a planes
      if (!ok) {
        try {
          (navigation as any).navigate('RecapCheckoutPlan');
        } catch {
          // ignore
        }
        return;
      }
    }
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `roller-recap-15s.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const content = (
    <View style={styles.root}>
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Volver a la pantalla anterior">
        <Text style={styles.backText}>← Volver a navegación</Text>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Crear Recap</Text>
          <Text style={styles.titleHint}>Video corto de tu ruta · 15 s · Web</Text>
        </View>
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.plansPill}
            onPress={() => navigation.navigate('RecapCheckoutPlan')}
            accessibilityRole="button"
            accessibilityLabel="Ver planes Plus">
            <Text style={styles.plansPillText}>Ver planes Plus</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setShowPlansModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Información de planes y reglas">
            <Text style={styles.infoBtnText}>i</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Genera un video ligero con estilo <Text style={styles.bold}>mapa minimal</Text>,{' '}
        <Text style={styles.bold}>ruta animada</Text> y patín en movimiento. Puedes añadir hasta{' '}
        <Text style={styles.bold}>{maxPhotosByPlan(activePlanId)} fotos</Text> según tu plan.
      </Text>

      <Modal
        visible={showPlansModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlansModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPlansModal(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Planes y reglas (previsto)</Text>
            <Text style={styles.modalLead}>
              Resumen de la estrategia de costos y beneficios. Los precios y tiempos finales se definirán
              al conectar pagos y servidor de render.
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator>
              <Text style={styles.modalSection}>Plan Gratis — «Crea y Comparte»</Text>
              <Text style={styles.modalBody}>
                ⏳ Prioridad estándar: tu video se procesa después de usuarios Plus (el tiempo varía).{'\n'}
                📣 Comunidad: incluye un breve anuncio o marca de agua para mantener el servicio gratuito.{'\n'}
                🏷️ Sello {APP_BRAND}: tu video incluye nuestra marca de agua oficial.{'\n'}
                ⏱️ Recuerdos rápidos: descarga tu video durante 15 días.{'\n'}
                🖼️ Esencial: hasta 5 fotos por ruta.
              </Text>
              <Text style={styles.modalSection}>Pase Único — «Edición Especial» ($25 MXN)</Text>
              <Text style={styles.modalBody}>
                ✅ Calidad profesional sin compromisos: todo Premium en 1 solo video.{'\n'}
                🔒 Sin marcas de agua: video HD.{'\n'}
                ⚡ Prioridad alta: saltas la fila de espera.{'\n'}
                🖼️ Más recuerdos: hasta 15 fotos en este video.
              </Text>
              <Text style={styles.modalSection}>Plus Mensual — «Experiencia Pro» ($59 MXN)</Text>
              <Text style={styles.modalBody}>
                ✅ Prioridad VIP: sin anuncios y con la mejor prioridad.{'\n'}
                ☁️ Videoteca en la nube: mientras tu plan esté activo.{'\n'}
                🖼️ Sin límites de marca de agua y hasta 60 fotos por video.{'\n'}
                📈 Estadísticas avanzadas: elevación y velocidad máxima (próximamente).
              </Text>
              <Text style={styles.modalSection}>Plus Anual — «Pasión Total» ($479 MXN)</Text>
              <Text style={styles.modalBody}>
                ✅ Todo lo Pro por ~ $40/mes.{'\n'}
                🧭 Ideal para temporada: olvídate de pagos mensuales.{'\n'}
                ⭐ Soporte premium: acceso anticipado a nuevas funciones y mapas 3D (próximamente).
              </Text>
              <Text style={styles.modalBody}>
                Nota: las suscripciones se renuevan automáticamente. Puedes cancelar en cualquier momento desde el menú → Mis suscripciones.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPlansModal(false)}>
              <Text style={styles.modalCloseBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {Platform.OS !== 'web' ? (
        <ScrollView
          style={styles.nativeRecapScroll}
          contentContainerStyle={styles.nativeRecapContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recap en video</Text>
            <Text style={styles.cardText}>
              Generar y descargar el Recap (canvas + grabación) solo está disponible en el{' '}
              <Text style={styles.cardEmph}>navegador</Text> (Chrome, Edge, Safari en el móvil). En la
              app nativa aún no hay cámara galería integrada para este flujo; puedes abrir el mismo
              entorno en el navegador del teléfono.
            </Text>
          </View>
          <View style={styles.nativeStepsCard}>
            <Text style={styles.nativeStepsTitle}>Cómo hacerlo desde el móvil</Text>
            <Text style={styles.nativeStep}>1) Pulsa &quot;Abrir sitio web&quot; o copia la URL en Chrome/Safari.</Text>
            <Text style={styles.nativeStep}>2) Inicia sesión con la misma cuenta.</Text>
            <Text style={styles.nativeStep}>3) Ve a Crear Recap, sube fotos y genera el video (15 s).</Text>
            <Text style={styles.nativeStep}>4) Descarga el .webm o compártelo desde el navegador.</Text>
          </View>
          <TouchableOpacity
            style={styles.nativeWebBtn}
            onPress={() => {
              void Linking.openURL(RECAP_WEB_URL).catch(() => {});
            }}
            accessibilityRole="link"
            accessibilityLabel="Abrir el sitio web de Run Skate Roller">
            <Text style={styles.nativeWebBtnText}>Abrir sitio web</Text>
          </TouchableOpacity>
          <Text style={styles.nativeUrlHint}>{RECAP_WEB_URL}</Text>
        </ScrollView>
      ) : (
        <>
          {!supportsMediaRecorder() ? (
            <Text style={styles.warn}>
              Tu navegador no soporta grabación. Prueba Chrome/Edge.
            </Text>
          ) : null}

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <View style={styles.canvasFrame}>
            <View style={styles.canvasHost} ref={hostRef} />
          </View>

          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => {
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                  const el = document.getElementById('recap-photo-input') as HTMLInputElement | null;
                  el?.click();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Añadir fotos">
              <Text style={styles.toolBtnText}>+ Añadir fotos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtnPrimary, status === 'recording' && styles.btnDisabled]}
              onPress={() => void createRecap15s()}
              disabled={status === 'recording'}
              accessibilityRole="button"
              accessibilityLabel="Generar recap">
              <Text style={styles.toolBtnPrimaryText}>
                {status === 'recording'
                  ? '⚡ Generando…'
                  : status === 'idle'
                    ? '⚡ Generar (espera visor…)'
                    : '⚡ Generar 15 s'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, !videoUrl && styles.btnDisabled]}
              onPress={download}
              disabled={!videoUrl}
              accessibilityRole="button"
              accessibilityLabel="Descargar video">
              <Text style={styles.toolBtnText}>📥 Descargar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.queueHint}>
            {priorityLabel(activePlanId)}
            {activePlanId === 'gratis0'
              ? ' · Procesando en cola. ¿Quieres saltar la fila? Hazte Plus.'
              : activePlanId === 'pase25'
                ? ' · Saltas la fila para este recap.'
                : ' · Tus recaps se procesan primero.'}
          </Text>
        </>
      )}
    </View>
  );

  return <WithBottomTabBar>{content}</WithBottomTabBar>;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 18,
    backgroundColor: '#020617',
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 6,
    paddingRight: 10,
  },
  backText: {
    color: 'rgba(56, 189, 248, 0.95)',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(226,232,240,0.84)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  bold: {fontWeight: '900', color: 'rgba(226,232,240,0.96)'},
  btnDisabled: {
    opacity: 0.55,
  },
  warn: {
    color: 'rgba(245, 158, 11, 0.95)',
    fontWeight: '700',
    marginBottom: 10,
  },
  error: {
    color: 'rgba(248, 113, 113, 0.95)',
    fontWeight: '700',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  plansPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
  },
  plansPillText: {
    color: '#E0F2FE',
    fontWeight: '900',
    fontSize: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleHint: {
    color: 'rgba(148, 163, 184, 0.95)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.55)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoBtnText: {
    color: '#E0F2FE',
    fontWeight: '900',
    fontSize: 16,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
  },
  modalCard: {
    maxHeight: 560,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#0b1224',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalLead: {
    color: 'rgba(203, 213, 225, 0.92)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  modalScroll: {
    maxHeight: 360,
    marginBottom: 10,
  },
  modalSection: {
    color: 'rgba(56, 189, 248, 0.98)',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  modalBody: {
    color: 'rgba(226, 232, 240, 0.92)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  modalCloseBtn: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#E0F2FE',
    fontWeight: '800',
    fontSize: 14,
  },
  canvasHost: {
    width: '100%',
    flex: 1,
    minHeight: 520,
  },
  canvasFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 14,
  },
  queueHint: {
    marginTop: 10,
    color: 'rgba(148, 163, 184, 0.88)',
    fontSize: 12,
    lineHeight: 16,
  },
  toolBtn: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    alignItems: 'center',
  },
  toolBtnText: {
    color: 'rgba(226,232,240,0.92)',
    fontWeight: '900',
    fontSize: 13,
  },
  toolBtnPrimary: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.26)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.55)',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
  },
  toolBtnPrimaryText: {
    color: '#E0F2FE',
    fontWeight: '900',
    fontSize: 13,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardText: {
    color: 'rgba(226,232,240,0.90)',
    lineHeight: 18,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardEmph: {
    fontWeight: '800',
    color: 'rgba(56, 189, 248, 0.98)',
  },
  nativeRecapScroll: {
    alignSelf: 'stretch',
    maxHeight: 520,
  },
  nativeRecapContent: {
    paddingBottom: 20,
    gap: 12,
  },
  nativeStepsCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  nativeStepsTitle: {
    color: '#E0F2FE',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 8,
  },
  nativeStep: {
    color: 'rgba(203, 213, 225, 0.95)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  nativeWebBtn: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    alignItems: 'center',
  },
  nativeWebBtnText: {
    color: '#E0F2FE',
    fontWeight: '800',
    fontSize: 15,
  },
  nativeUrlHint: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
});

