import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, Platform, ActivityIndicator, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import {MAPBOX_ACCESS_TOKEN} from '../config/mapbox';

interface MapboxMapProps {
  origin: string;
  destination: string;
  originCoords?: [number, number] | null; // [lng, lat]
  destinationCoords?: [number, number] | null; // [lng, lat]
  /** Idioma para geocoding (default: 'es'). */
  language?: string;
  /** Coordenadas del usuario (punto azul). */
  userCoords?: [number, number] | null; // [lng, lat]
  /** Coordenadas a previsualizar (pin para confirmar). */
  previewCoords?: [number, number] | null; // [lng, lat]
  /** GeoJSON LineString de la ruta (la pantalla calcula; aquí solo se pinta en web). */
  routeGeometry?: any;
  /** Si true, el usuario ya pidió ruta (evita recentrar GPS encima del preview). */
  calculateRoute?: boolean;
  trackingActive?: boolean;
  trackingPoints?: Array<{lat: number; lng: number}>;
  followMode?: boolean;
  followZoom?: number;
  followPitch?: number;
  /** Estilo del mapa (default: day). */
  styleVariant?: 'day' | 'night';
}

export const MapboxMap: React.FC<MapboxMapProps> = ({
  origin,
  destination,
  originCoords,
  destinationCoords,
  language = 'es',
  userCoords,
  previewCoords,
  calculateRoute = false,
  trackingActive = false,
  trackingPoints = [],
  followMode = false,
  followZoom = 17.4,
  followPitch = 58,
  routeGeometry,
  styleVariant = 'day',
}) => {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRecenter, setShowRecenter] = useState(false);
  const userMarkerRef = useRef<any>(null);
  const userMarkerElRef = useRef<HTMLElement | null>(null);
  const userInteractingRef = useRef(false);
  const hasCenteredOnUserGpsRef = useRef(false);
  const userDotMarkerRef = useRef<any>(null);
  const userDotElRef = useRef<HTMLElement | null>(null);
  const previewMarkerRef = useRef<any>(null);
  const previewElRef = useRef<HTMLElement | null>(null);
  const hasCenteredOnPreviewRef = useRef(false);

  const skateSvgDataUrl = useMemo(() => {
    // Vista lateral inline, punta a la derecha; dibujo ampliado (~80% del disco) estilo referencia (bota + chasis ondulado).
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <defs>
    <mask id="skFrm">
      <rect x="5" y="38" width="62" height="14" rx="1.5" fill="white"/>
      <circle cx="14" cy="54" r="6.2" fill="black"/>
      <circle cx="26" cy="54" r="6.2" fill="black"/>
      <circle cx="38" cy="54" r="6.2" fill="black"/>
      <circle cx="50" cy="54" r="6.2" fill="black"/>
    </mask>
    <filter id="skSh" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#skSh)">
    <circle cx="36" cy="36" r="33" fill="#070b14" stroke="#475569" stroke-width="1.6"/>
    <g transform="translate(4,2)" stroke="#334155" stroke-linecap="round" stroke-linejoin="round">
      <g fill="#64748b">
        <circle cx="14" cy="54" r="5"/><circle cx="26" cy="54" r="5"/>
        <circle cx="38" cy="54" r="5"/><circle cx="50" cy="54" r="5"/>
      </g>
      <g fill="#f1f5f9" stroke="none">
        <circle cx="14" cy="54" r="1.6"/><circle cx="26" cy="54" r="1.6"/>
        <circle cx="38" cy="54" r="1.6"/><circle cx="50" cy="54" r="1.6"/>
      </g>
      <rect x="5" y="39" width="62" height="12" fill="#1e293b" mask="url(#skFrm)" stroke="none"/>
      <path d="M9 40V25c0-10 7-17 18-17h12c10 0 17 7 17 17v15H9z" fill="#4a6fa5" stroke-width="1.25"/>
      <rect x="9" y="5" width="24" height="16" rx="4" fill="#7eb8e8" stroke-width="1.2"/>
      <rect x="12" y="9" width="18" height="4" rx="1" fill="#5b8cc9" stroke="none"/>
      <circle cx="22" cy="24" r="3.2" fill="#1e293b" stroke-width="1"/>
      <path d="M14 26 L44 33" stroke="#3d6ea8" stroke-width="4.5" stroke-linecap="round"/>
      <rect x="38" y="28" width="14" height="3.8" rx="1.2" fill="#3d6ea8" stroke-width="0.9"/>
      <rect x="42" y="32" width="11" height="3.2" rx="1" fill="#3d6ea8" stroke-width="0.9"/>
    </g>
  </g>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
  }, []);

  const trackingLineGeoJson = useMemo(() => {
    const coords = trackingPoints
      .filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat))
      .map((p) => [p.lng, p.lat]);
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    };
  }, [trackingPoints]);

  const lastPoint = trackingPoints.length > 0 ? trackingPoints[trackingPoints.length - 1] : null;

  const computeBearingDeg = (a: {lat: number; lng: number}, b: {lat: number; lng: number}): number => {
    // Bearing inicial (0-360) a partir de dos puntos.
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLng = toRad(b.lng - a.lng);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  };

  /** El SVG mira hacia la derecha (+X); el mapa usa 0° = norte, así que restamos 90°. */
  const markerRotationFromBearing = (bearingDeg: number) => (bearingDeg - 90 + 360) % 360;

  const navigationFollow = followMode || trackingActive;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setLoading(false);
      return;
    }

    // Crear un div dinámicamente para el mapa
    const mapDiv = document.createElement('div');
    mapDiv.id = 'mapbox-map-container';
    mapDiv.style.width = '100%';
    mapDiv.style.height = '100%';
    mapDiv.style.position = 'absolute';
    mapDiv.style.top = '0';
    mapDiv.style.left = '0';

    const loadMapbox = () => {
      const resolveHostEl = (ref: any): HTMLElement | null => {
        if (!ref) {
          return null;
        }
        if (typeof ref.appendChild === 'function') {
          return ref as HTMLElement;
        }
        // Compat: algunas versiones de RN-web exponen el nodo en otra propiedad
        const inner = ref._nativeNode ?? ref.__dom__ ?? ref.current;
        if (inner && typeof inner.appendChild === 'function') {
          return inner as HTMLElement;
        }
        return null;
      };

      const checkMapbox = setInterval(() => {
        const mapboxgl = (window as any).mapboxgl;
        const hostEl = resolveHostEl(containerRef.current);
        if (mapboxgl && hostEl) {
          clearInterval(checkMapbox);

          try {
            // Obtener el elemento DOM del View
            const viewNode = hostEl;
            let parentElement;

            // React Native Web: el View se renderiza como un div
            if (viewNode) {
              // En web, el ref apunta directamente al DOM element
              parentElement = viewNode;
              
              // Agregar el div del mapa al contenedor
              if (parentElement && parentElement.appendChild) {
                parentElement.appendChild(mapDiv);
              } else {
                // Si no tiene appendChild, buscar el elemento padre
                const parent = parentElement?.parentNode || document.getElementById('root');
                if (parent) {
                  parent.appendChild(mapDiv);
                }
              }
            }

            if (mapDiv.parentNode) {
              mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

              // Centro por defecto: CDMX (solo fallback cuando aún no hay GPS).
              mapRef.current = new mapboxgl.Map({
                container: mapDiv,
                // Estilo más "premium" tipo navegación.
              style:
                styleVariant === 'night'
                  ? 'mapbox://styles/mapbox/navigation-night-v1'
                  : 'mapbox://styles/mapbox/navigation-day-v1',
                center: [-99.1332, 19.4326],
                zoom: 13,
              });

              mapRef.current.on('load', () => {
                try {
                  // Controles de zoom (inferior derecho)
                  mapRef.current.addControl(
                    new mapboxgl.NavigationControl({showCompass: false}),
                    'bottom-right',
                  );
                } catch {
                  // no-op
                }

                // Detectar interacción del usuario para no recentrar agresivamente
                mapRef.current.on('dragstart', () => {
                  userInteractingRef.current = true;
                  setShowRecenter(true);
                });
                mapRef.current.on('zoomstart', () => {
                  userInteractingRef.current = true;
                  setShowRecenter(true);
                });

                setLoading(false);
              });

              mapRef.current.on('error', () => {
                setLoading(false);
              });
            }
          } catch (error) {
            console.error('Error inicializando mapa:', error);
            setLoading(false);
          }
        }
      }, 100);

      // Mapbox se carga async en index.html; dar margen antes de rendirse (evita caja gris/blanca eterna).
      setTimeout(() => {
        clearInterval(checkMapbox);
        setLoading(false);
      }, 15000);
    };

    // Esperar a que el componente se monte
    const timer = setTimeout(() => {
      loadMapbox();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapDiv && mapDiv.parentNode) {
        mapDiv.parentNode.removeChild(mapDiv);
      }
    };
  }, []);

  // Si ya tenemos GPS del usuario, centrar el mapa cerca de él (Puebla/Monterrey/etc.).
  // El centro CDMX es solo un fallback cuando aún no hay contexto.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    if (!originCoords || originCoords.length < 2) {
      return;
    }
    if (calculateRoute) {
      return;
    }
    if (hasCenteredOnUserGpsRef.current) {
      return;
    }

    const tryCenter = () => {
      const map = mapRef.current;
      if (!map) {
        return false;
      }
      try {
        const lng = Number(originCoords[0]);
        const lat = Number(originCoords[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          return true;
        }

        const run = () => {
          try {
            map.easeTo({
              center: [lng, lat],
              zoom: Math.max(map.getZoom?.() ?? 13, 13),
              duration: 650,
            });
            hasCenteredOnUserGpsRef.current = true;
          } catch {
            // no-op
          }
        };

        if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) {
          run();
        } else if (typeof map.once === 'function') {
          map.once('load', run);
        } else {
          run();
        }
        return true;
      } catch {
        return false;
      }
    };

    // El mapa puede montarse async; reintentar un poco.
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      if (tryCenter() || attempts > 80) {
        clearInterval(id);
      }
    }, 100);

    return () => clearInterval(id);
  }, [originCoords, calculateRoute]);

  // Punto azul del usuario (estilo Google/Uber). Durante seguimiento / follow el patín ya marca posición.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const map = mapRef.current;
    const mapboxgl = (window as any).mapboxgl;
    if (trackingActive || followMode) {
      try {
        userDotMarkerRef.current?.remove?.();
      } catch {
        // no-op
      }
      userDotMarkerRef.current = null;
      userDotElRef.current = null;
      return;
    }
    if (!map || !mapboxgl || !userCoords || userCoords.length < 2) {
      return;
    }
    const lng = Number(userCoords[0]);
    const lat = Number(userCoords[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return;
    }

    const ensureDot = () => {
      if (userDotMarkerRef.current) {
        return;
      }
      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '7px';
      el.style.background = '#1D4ED8';
      el.style.border = '3px solid #93C5FD';
      el.style.boxShadow = '0 0 0 6px rgba(29,78,216,0.18)';
      userDotElRef.current = el;
      userDotMarkerRef.current = new mapboxgl.Marker({element: el, anchor: 'center'});
    };
    ensureDot();
    try {
      userDotMarkerRef.current.setLngLat([lng, lat]).addTo(map);
    } catch {
      // no-op
    }
  }, [userCoords?.[0], userCoords?.[1], trackingActive, followMode]);

  // Pin de previsualización para confirmar (origen/destino).
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const map = mapRef.current;
    const mapboxgl = (window as any).mapboxgl;
    if (!map || !mapboxgl) {
      return;
    }
    if (!previewCoords || previewCoords.length < 2) {
      // limpiar pin si existía
      try {
        previewMarkerRef.current?.remove?.();
      } catch {
        // no-op
      }
      previewMarkerRef.current = null;
      previewElRef.current = null;
      hasCenteredOnPreviewRef.current = false;
      return;
    }
    const lng = Number(previewCoords[0]);
    const lat = Number(previewCoords[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return;
    }

    const ensurePreview = () => {
      if (previewMarkerRef.current) {
        return;
      }
      const el = document.createElement('div');
      el.style.width = '22px';
      el.style.height = '22px';
      el.style.borderRadius = '11px';
      el.style.background = '#EF4444';
      el.style.border = '3px solid #FFFFFF';
      el.style.boxShadow = '0 10px 22px rgba(0,0,0,0.35)';
      previewElRef.current = el;
      previewMarkerRef.current = new mapboxgl.Marker({element: el, anchor: 'center'});
    };
    ensurePreview();
    try {
      previewMarkerRef.current.setLngLat([lng, lat]).addTo(map);
    } catch {
      // no-op
    }

    // Centrar una sola vez cuando aparece el pin (sin recalcular ruta).
    if (!calculateRoute && !hasCenteredOnPreviewRef.current) {
      const run = () => {
        try {
          map.easeTo({center: [lng, lat], zoom: Math.max(map.getZoom?.() ?? 15, 15), duration: 650});
          hasCenteredOnPreviewRef.current = true;
        } catch {
          // no-op
        }
      };
      try {
        if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) {
          run();
        } else if (typeof map.once === 'function') {
          map.once('load', run);
        } else {
          run();
        }
      } catch {
        // no-op
      }
    }
  }, [previewCoords?.[0], previewCoords?.[1], calculateRoute]);

  // El cálculo (geocoding + directions) vive en NavegacionScreen / mapboxCyclingRoute.ts.
  // Aquí solo pintamos la geometría que llega por props (web).
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    const waitForMap = async (timeoutMs: number): Promise<any> => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const map = mapRef.current;
        if (map) {
          try {
            if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) {
              return map;
            }
          } catch {
            // ignore
          }
          try {
            if (typeof map.getCenter === 'function') {
              map.getCenter();
              return map;
            }
          } catch {
            // ignore
          }
        }
        await sleep(80);
      }
      return mapRef.current;
    };

    let cancelled = false;

    const run = async () => {
      const map = await waitForMap(15000);
      if (cancelled || !map) {
        return;
      }
      try {
        if (!routeGeometry) {
          try {
            if (map.getLayer?.('route')) {
              map.removeLayer('route');
            }
            if (map.getSource?.('route')) {
              map.removeSource('route');
            }
          } catch {
            // no-op
          }
          return;
        }

        const source = map.getSource('route');
        if (source) {
          source.setData(routeGeometry);
          if (map.getLayer?.('route-casing')) {
            map.setPaintProperty('route-casing', 'line-color', '#FFFFFF');
            map.setPaintProperty('route-casing', 'line-opacity', 0.95);
            map.setPaintProperty('route-casing', 'line-width', 9);
          }
          if (map.getLayer?.('route')) {
            map.setPaintProperty('route', 'line-color', '#FF4D6D');
            map.setPaintProperty('route', 'line-opacity', 0.98);
            map.setPaintProperty('route', 'line-width', 6);
          }
        } else {
          map.addSource('route', {
            type: 'geojson',
            data: routeGeometry,
          });
          map.addLayer({
            id: 'route-casing',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 9,
              'line-opacity': 0.95,
            },
          });
          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#FF4D6D',
              'line-width': 6,
              'line-opacity': 0.98,
            },
          });
        }

        if (!navigationFollow && routeGeometry?.coordinates?.length) {
          const bounds = new (window as any).mapboxgl.LngLatBounds();
          routeGeometry.coordinates.forEach((coord: number[]) => {
            bounds.extend(coord);
          });
          map.fitBounds(bounds, {padding: 50});
        }
      } catch {
        // no-op
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [routeGeometry, navigationFollow]);

  // Crear/cargar marcador del usuario (patín) y el trazo de recorrido
  useEffect(() => {
    if (!mapRef.current || Platform.OS !== 'web') {
      return;
    }
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) {
      return;
    }

    // Fuente/layer del recorrido (track)
    const ensureTrackLayer = () => {
      try {
        const src = mapRef.current.getSource('track');
        if (src) {
          src.setData(trackingLineGeoJson);
          return;
        }
        mapRef.current.addSource('track', {
          type: 'geojson',
          data: trackingLineGeoJson,
        });
        mapRef.current.addLayer({
          id: 'track',
          type: 'line',
          source: 'track',
          layout: {'line-join': 'round', 'line-cap': 'round'},
          paint: {
            'line-color': '#38BDF8',
            'line-width': 4,
            'line-opacity': 0.9,
          },
        });
      } catch {
        // no-op
      }
    };

    const ensureUserMarker = () => {
      if (userMarkerRef.current) {
        return;
      }
      const el = document.createElement('div');
      el.style.width = '58px';
      el.style.height = '58px';
      el.style.borderRadius = '29px';
      el.style.transformOrigin = 'center center';
      el.style.backgroundImage = `url("${skateSvgDataUrl}")`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      userMarkerElRef.current = el;
      userMarkerRef.current = new mapboxgl.Marker({element: el});
    };

    ensureTrackLayer();
    ensureUserMarker();

    // Actualizar cuando haya punto
    if (lastPoint && (trackingActive || followMode)) {
      try {
        userMarkerRef.current.setLngLat([lastPoint.lng, lastPoint.lat]).addTo(mapRef.current);
        // Rotación según bearing (si tenemos al menos 2 puntos)
        if (userMarkerElRef.current) {
          if (trackingPoints.length >= 2) {
            const a = trackingPoints[trackingPoints.length - 2];
            const b = trackingPoints[trackingPoints.length - 1];
            const bearing = computeBearingDeg(a, b);
            userMarkerElRef.current.style.transform = `rotate(${markerRotationFromBearing(bearing)}deg)`;
          } else {
            userMarkerElRef.current.style.transform = 'rotate(-90deg)';
          }
        }
        // Seguimiento: recentrar si el usuario no está interactuando
        if (!userInteractingRef.current) {
          let bearing = mapRef.current.getBearing?.() ?? 0;
          if (trackingPoints.length >= 2) {
            const a = trackingPoints[trackingPoints.length - 2];
            const b = trackingPoints[trackingPoints.length - 1];
            bearing = computeBearingDeg(a, b);
          }
          mapRef.current.easeTo({
            center: [lastPoint.lng, lastPoint.lat],
            zoom: followMode || trackingActive ? followZoom : Math.max(mapRef.current.getZoom?.() ?? 15, 15),
            bearing,
            pitch: followMode || trackingActive ? followPitch : 0,
            duration: 450,
          });
          if (showRecenter) {
            setShowRecenter(false);
          }
        }
      } catch {
        // no-op
      }
    }
  }, [
    trackingActive,
    followMode,
    followZoom,
    followPitch,
    trackingLineGeoJson,
    skateSvgDataUrl,
    lastPoint,
    trackingPoints,
  ]);

  const handleRecenter = () => {
    if (!mapRef.current || !lastPoint) {
      return;
    }
    try {
      userInteractingRef.current = false;
      setShowRecenter(false);
      let bearing = mapRef.current.getBearing?.() ?? 0;
      if (trackingPoints.length >= 2) {
        const a = trackingPoints[trackingPoints.length - 2];
        const b = trackingPoints[trackingPoints.length - 1];
        bearing = computeBearingDeg(a, b);
      }
      mapRef.current.easeTo({
        center: [lastPoint.lng, lastPoint.lat],
        zoom: followMode || trackingActive ? followZoom : Math.max(mapRef.current.getZoom?.() ?? 15, 15),
        bearing,
        pitch: followMode || trackingActive ? followPitch : 0,
        duration: 450,
      });
    } catch {
      // no-op
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.placeholder}>
        <Text>El mapa solo está disponible en web</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} ref={containerRef}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      )}
      {trackingActive && showRecenter && lastPoint && (
        <View style={styles.recenterWrap} pointerEvents="box-none">
          <TouchableOpacity
            onPress={handleRecenter}
            activeOpacity={0.8}
            style={styles.recenterBtn}>
            <Text style={styles.recenterText}>Recentrar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  loading: {
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  recenterWrap: {
    position: 'absolute',
    right: 14,
    bottom: 92, // encima del zoom (bottom-right)
    zIndex: 1200,
    pointerEvents: 'box-none',
  },
  recenterBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 18,
  },
  recenterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

