import React, {useEffect, useRef, useState} from 'react';
import {View, Platform, ActivityIndicator, Text, StyleSheet, Alert} from 'react-native';
import {MAPBOX_ACCESS_TOKEN, isExampleToken} from '../config/mapbox';

interface MapboxMapProps {
  origin: string;
  destination: string;
  onRouteCalculate?: (route: {distance: number; duration: number; geometry: any}) => void;
}

export const MapboxMap: React.FC<MapboxMapProps> = ({
  origin,
  destination,
  onRouteCalculate,
}) => {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

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
      const checkMapbox = setInterval(() => {
        const mapboxgl = (window as any).mapboxgl;
        if (mapboxgl && containerRef.current) {
          clearInterval(checkMapbox);

          try {
            // Obtener el elemento DOM del View
            const viewNode = containerRef.current;
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

              mapRef.current = new mapboxgl.Map({
                container: mapDiv,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-3.7038, 40.4168],
                zoom: 13,
              });

              mapRef.current.on('load', () => {
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

      setTimeout(() => {
        clearInterval(checkMapbox);
        if (loading) {
          setLoading(false);
        }
      }, 5000);
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

  useEffect(() => {
    if (!mapRef.current || !origin || !destination || Platform.OS !== 'web') return;

    const calculateRoute = async () => {
      try {
        const MAPBOX_TOKEN = MAPBOX_ACCESS_TOKEN;

        // Geocodificar direcciones
        const geocode = async (address: string) => {
          if (!address || address.trim().length === 0) {
            return null;
          }

          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              address.trim(),
            )}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=mx&language=es`,
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || response.statusText;

            if (response.status === 403) {
              throw new Error(
                'Token de Mapbox inválido. Por favor, configura tu propio token en .env o en src/config/mapbox.ts. Visita https://account.mapbox.com/ para obtener uno gratis.',
              );
            }

            throw new Error(`Error en geocodificación (${response.status}): ${errorMessage || response.statusText}`);
          }

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error || 'Error en geocodificación');
          }

          if (!data.features || data.features.length === 0) {
            console.warn(`No se encontraron resultados para: ${address}`);
            return null;
          }

          const coordinates = data.features[0]?.center;
          if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
            console.warn(`Coordenadas inválidas para: ${address}`);
            return null;
          }

          return coordinates;
        };

        const originCoords = await geocode(origin);
        const destCoords = await geocode(destination);

        // Validar coordenadas antes de calcular la ruta
        if (
          !originCoords ||
          !destCoords ||
          !Array.isArray(originCoords) ||
          !Array.isArray(destCoords) ||
          originCoords.length < 2 ||
          destCoords.length < 2
        ) {
          Alert.alert(
            'Error',
            'No se pudieron encontrar las direcciones. Por favor, selecciona direcciones de las sugerencias o verifica que las direcciones sean válidas y específicas (ej: "Lic. Primo Verdad, Col. Jardines, Ciudad de México").',
          );
          return;
        }

        // Calcular ruta
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || response.statusText;

          if (response.status === 403) {
            throw new Error(
              'Token de Mapbox inválido. Por favor, configura tu propio token en .env o en src/config/mapbox.ts. Visita https://account.mapbox.com/ para obtener uno gratis.',
            );
          }

          if (response.status === 422) {
            throw new Error(
              `No se pudo calcular la ruta: ${errorMessage || 'Las direcciones pueden estar muy lejanas o no tener una ruta válida. Intenta con direcciones más específicas.'}`,
            );
          }

          throw new Error(`Error calculando ruta (${response.status}): ${errorMessage || response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error || 'Error calculando ruta');
        }

        if (!data.routes || data.routes.length === 0) {
          throw new Error('No se encontró una ruta entre las direcciones especificadas');
        }

        if (data.routes?.[0] && mapRef.current) {
          const route = data.routes[0];

          // Agregar ruta al mapa
          const source = mapRef.current.getSource('route');
          if (source) {
            source.setData(route.geometry);
          } else {
            mapRef.current.addSource('route', {
              type: 'geojson',
              data: route.geometry,
            });
            mapRef.current.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#3887be',
                'line-width': 5,
                'line-opacity': 0.75,
              },
            });
          }

          // Ajustar vista
          const bounds = new (window as any).mapboxgl.LngLatBounds();
          route.geometry.coordinates.forEach((coord: number[]) => {
            bounds.extend(coord);
          });
          mapRef.current.fitBounds(bounds, {padding: 50});

          if (onRouteCalculate) {
            onRouteCalculate({
              distance: route.distance,
              duration: route.duration,
              geometry: route.geometry,
            });
          }
        }
      } catch (error) {
        console.error('Error calculando ruta:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido al calcular la ruta';
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    };

    calculateRoute();
  }, [origin, destination, onRouteCalculate]);

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
});

