import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import eventoService from '../services/eventoService';
import {Evento} from '../types';

interface EventoDetalleScreenProps {
  navigation: any;
  route: {params?: {id?: string}};
}

export const EventoDetalleScreen: React.FC<EventoDetalleScreenProps> = ({
  navigation,
  route,
}) => {
  const eventoId = route?.params?.id;
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvento = async () => {
      try {
        const response = await eventoService.getEventos();
        if (response.success && response.eventos) {
          const encontrado = response.eventos.find(e => e.id === eventoId) || null;
          setEvento(encontrado);
        }
      } catch (error) {
        console.error('Error cargando evento:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEvento();
  }, [eventoId]);

  if (loading) {
    return (
      <WithBottomTabBar>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D9FF" />
          <Text style={styles.loadingText}>Cargando evento...</Text>
        </View>
      </WithBottomTabBar>
    );
  }

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        {/* Imagen de fondo */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/IMG_2675.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.overlay} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Detalle del Evento</Text>
          </View>

          {!evento ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No se encontró el evento solicitado.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {evento.lugarDestino ? (
                <Image
                  source={{uri: evento.lugarDestino}}
                  style={styles.eventImage}
                  resizeMode="contain"
                />
              ) : null}

              <Text style={styles.eventTitle}>
                {evento.tituloRuta || evento.titulo || 'Evento'}
              </Text>
              <Text style={styles.eventSubtitle}>
                {evento.fecha
                  ? new Date(evento.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Fecha no especificada'}
              </Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cita:</Text>
                <Text style={styles.infoValue}>{evento.cita || evento.hora || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Salida:</Text>
                <Text style={styles.infoValue}>{evento.salida || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nivel:</Text>
                <Text style={styles.infoValue}>{evento.nivel || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Punto de salida:</Text>
                <Text style={styles.infoValue}>
                  {evento.puntoSalida || evento.puntoEncuentroDireccion || 'N/A'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigation.navigate('Calendario')}>
                <Text style={styles.ctaButtonText}>Ver en Calendario</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </WithBottomTabBar>
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
    opacity: 0.35,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 17, 40, 0.75)',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 24,
    color: '#00D9FF',
    fontWeight: '300',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  eventImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#EEE',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  eventSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 120,
    fontSize: 12,
    color: '#8B9DC3',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: 16,
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
  },
  emptyText: {
    color: '#333',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
  },
});
