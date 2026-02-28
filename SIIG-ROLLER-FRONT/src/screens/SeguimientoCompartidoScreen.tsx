import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {MapboxMap} from '../components/MapboxMap';
import seguimientoService, {Seguimiento, LocationPoint} from '../services/seguimientoService';

interface SeguimientoCompartidoScreenProps {
  navigation: any;
  route: {
    params: {
      seguimientoId: string;
    };
  };
}

export const SeguimientoCompartidoScreen: React.FC<SeguimientoCompartidoScreenProps> = ({
  navigation,
  route,
}) => {
  const {seguimientoId} = route.params;
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSeguimiento();
  }, [seguimientoId]);

  // Efecto separado para actualización en tiempo real
  useEffect(() => {
    // Limpiar intervalo anterior si existe
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Si el seguimiento está activo, actualizar cada 5 segundos
    if (seguimiento?.activo) {
      updateIntervalRef.current = setInterval(() => {
        loadSeguimiento();
      }, 5000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [seguimiento?.activo]);

  const loadSeguimiento = async () => {
    try {
      setLoading(true);
      const data = await seguimientoService.getSeguimiento(seguimientoId);
      setSeguimiento(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando seguimiento:', err);
      setError('No se pudo cargar el seguimiento. Puede que haya finalizado o no exista.');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDuration = (startTime: string): string => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calcular distancia total recorrida
  const calculateTotalDistance = (puntos: LocationPoint[]): number => {
    if (puntos.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < puntos.length; i++) {
      const prev = puntos[i - 1];
      const curr = puntos[i];
      const R = 6371000; // Radio de la Tierra en metros
      const dLat = ((curr.latitud - prev.latitud) * Math.PI) / 180;
      const dLon = ((curr.longitud - prev.longitud) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prev.latitud * Math.PI) / 180) *
          Math.cos((curr.latitud * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    return totalDistance;
  };

  if (loading && !seguimiento) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando seguimiento...</Text>
          </View>
        </View>
      </WithBottomTabBar>
    );
  }

  if (error || !seguimiento) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || 'Seguimiento no encontrado'}</Text>
          </View>
        </View>
      </WithBottomTabBar>
    );
  }

  const puntos = seguimiento.puntos || [];
  const distanciaTotal = calculateTotalDistance(puntos);
  const currentLocation = seguimiento.ultimoPunto
    ? {
        latitude: seguimiento.ultimoPunto.latitud,
        longitude: seguimiento.ultimoPunto.longitud,
      }
    : null;

  const trackingPoints = puntos.map(p => ({
    latitude: p.latitud,
    longitude: p.longitud,
  }));

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Seguimiento en Tiempo Real</Text>
            <Text style={styles.subtitle}>
              {seguimiento.activo ? '🟢 En curso' : '🔴 Finalizado'}
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Origen:</Text>
              <Text style={styles.infoValue}>{seguimiento.origen || 'No especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Destino:</Text>
              <Text style={styles.infoValue}>{seguimiento.destino || 'No especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Distancia recorrida:</Text>
              <Text style={styles.infoValue}>{formatDistance(distanciaTotal)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Puntos registrados:</Text>
              <Text style={styles.infoValue}>{puntos.length}</Text>
            </View>
            {seguimiento.creado_en && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tiempo transcurrido:</Text>
                <Text style={styles.infoValue}>{formatDuration(seguimiento.creado_en)}</Text>
              </View>
            )}
          </View>

          <View style={styles.mapWrapper}>
            <MapboxMap
              origin={seguimiento.origen || ''}
              destination={seguimiento.destino || ''}
              currentLocation={currentLocation}
              trackingPoints={trackingPoints}
            />
          </View>
        </ScrollView>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  mapWrapper: {
    flex: 1,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    minHeight: 400,
    ...Platform.select({
      web: {
        minHeight: 500,
      },
    }),
  },
});

