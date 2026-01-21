import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity,
  Share,
  Linking,
  Modal,
} from 'react-native';
import {Input} from '../components/Input';
import {UberStyleSearchInput} from '../components/UberStyleSearchInput';
import {Button} from '../components/Button';
import {MapboxMap} from '../components/MapboxMap';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import locationService, {Location} from '../services/locationService';
import seguimientoService from '../services/seguimientoService';
import {Usuario} from '../types';

interface RouteData {
  distance: number; // en metros
  duration: number; // en segundos
  geometry: any;
}

interface NavegacionScreenProps {
  navigation: any;
}

export const NavegacionScreen: React.FC<NavegacionScreenProps> = ({navigation}) => {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [origenSeleccionado, setOrigenSeleccionado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  
  // Estados para seguimiento GPS
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<Location[]>([]);
  const [distanceTraveled, setDistanceTraveled] = useState(0); // en metros
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [seguimientoId, setSeguimientoId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationUpdateRef = useRef<Date | null>(null);

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

  // Limpiar tracking al desmontar
  useEffect(() => {
    return () => {
      if (isTracking) {
        locationService.stopTracking();
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking]);

  // Mapbox ya se carga desde index.html, no necesita carga adicional

  const handleCalcularRuta = () => {
    if (!origen.trim() || !destino.trim()) {
      Alert.alert('Error', 'Por favor ingresa origen y destino');
      return;
    }

    setLoading(true);
    setRouteData(null); // Limpiar datos anteriores
    // La ruta se calculará automáticamente cuando cambien origen y destino
    // y el componente MapboxMap la procesará
    
    // Timeout de seguridad: si después de 30 segundos no hay respuesta, desactivar loading
    const timeoutId = setTimeout(() => {
      setLoading(prevLoading => {
        if (prevLoading) {
          Alert.alert('Tiempo de espera agotado', 'La ruta está tardando más de lo esperado. Por favor, verifica las direcciones e intenta nuevamente.');
          return false;
        }
        return prevLoading;
      });
    }, 30000);
    
    // Limpiar timeout si el componente se desmonta o se completa antes
    return () => clearTimeout(timeoutId);
  };

  const handleOrigenSelect = (suggestion: any) => {
    setOrigen(suggestion.place_name);
    setOrigenSeleccionado(true);
  };

  const handleEditarOrigen = () => {
    setOrigenSeleccionado(false);
    setOrigen('');
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

  const formatElapsedTime = (start: Date): string => {
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

  // Calcular distancia entre dos puntos GPS
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      // Detener tracking
      locationService.stopTracking();
      setIsTracking(false);
      setStartTime(null);
      
      // Finalizar seguimiento en el backend
      if (seguimientoId) {
        try {
          await seguimientoService.finishSeguimiento(seguimientoId);
        } catch (error) {
          console.error('Error finalizando seguimiento:', error);
        }
      }
      
      // Mostrar resumen del recorrido
      Alert.alert(
        'Recorrido Finalizado',
        `Distancia recorrida: ${distanceTraveled >= 1000 
          ? `${(distanceTraveled / 1000).toFixed(2)} km` 
          : `${distanceTraveled.toFixed(0)} m`}\nPuntos registrados: ${trackingPoints.length}`,
      );
      
      // Resetear datos
      setTrackingPoints([]);
      setDistanceTraveled(0);
      setSeguimientoId(null);
      setShareUrl(null);
    } else {
      // Validar que haya origen y destino
      if (!origen.trim() || !destino.trim()) {
        Alert.alert('Error', 'Por favor selecciona origen y destino antes de iniciar el recorrido');
        return;
      }

      try {
        // Crear sesión de seguimiento en el backend
        const seguimiento = await seguimientoService.createSeguimiento(origen, destino);
        setSeguimientoId(seguimiento.id);
        
        // Generar URL compartible
        const baseUrl = Platform.OS === 'web' 
          ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
          : 'https://siigroller.com'; // URL de producción para móvil
        const url = `${baseUrl}/seguimiento/${seguimiento.id}`;
        setShareUrl(url);

      // Iniciar tracking
      const started = await locationService.startTracking(
          async (location: Location) => {
          setCurrentLocation(location);
          
            // Agregar punto al tracking local
          setTrackingPoints(prev => {
            const newPoints = [...prev, location];
            
            // Calcular distancia total
            if (newPoints.length > 1) {
              const prevPoint = newPoints[newPoints.length - 2];
              const distance = calculateDistance(
                prevPoint.latitude,
                prevPoint.longitude,
                location.latitude,
                location.longitude,
              );
              setDistanceTraveled(prev => prev + distance);
            }
            
            return newPoints;
          });

            // Enviar punto al backend (cada 5 segundos o cada 10 metros)
            const now = new Date();
            const shouldUpdate = 
              !lastLocationUpdateRef.current || 
              (now.getTime() - lastLocationUpdateRef.current.getTime()) > 5000;

            if (shouldUpdate && seguimiento.id) {
              lastLocationUpdateRef.current = now;
              try {
                await seguimientoService.addLocationPoint(
                  seguimiento.id,
                  location.latitude,
                  location.longitude,
                  location.accuracy,
                  location.speed,
                  location.timestamp || Date.now(),
                );
              } catch (error) {
                console.error('Error enviando punto de ubicación:', error);
              }
            }
        },
        (error: any) => {
          console.error('Error en tracking GPS:', error);
          Alert.alert('Error de GPS', 'Hubo un problema con el seguimiento GPS.');
        },
      );

      if (started) {
        setIsTracking(true);
        setStartTime(new Date());
          lastLocationUpdateRef.current = new Date();
        Alert.alert('Recorrido Iniciado', 'El seguimiento GPS ha comenzado.');
      }
      } catch (error) {
        console.error('Error iniciando seguimiento:', error);
        Alert.alert('Error', 'No se pudo iniciar el seguimiento. Por favor intenta nuevamente.');
      }
    }
  };

  const buildShareMessage = (url: string): string => {
    return `Sigue mi recorrido en tiempo real:\n${url}`;
  };

  const handleShareUrl = () => {
    if (!shareUrl) {
      Alert.alert('Error', 'No hay URL para compartir. Inicia un recorrido primero.');
      return;
    }
    setShowShareModal(true);
  };

  const handleShareSystem = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await Share.share({
        message: buildShareMessage(shareUrl),
        url: shareUrl,
        title: 'Compartir Seguimiento',
      });
    } catch (error) {
      console.error('Error compartiendo URL:', error);
      Alert.alert('Error', 'No se pudo compartir la URL.');
    } finally {
      setShowShareModal(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!shareUrl) {
      return;
    }
    const mensaje = encodeURIComponent(buildShareMessage(shareUrl));
    const whatsappAppUrl = `whatsapp://send?text=${mensaje}`;
    const whatsappWebUrl = `https://wa.me/?text=${mensaje}`;
    try {
      if (Platform.OS === 'web') {
        await Linking.openURL(whatsappWebUrl);
      } else {
        const canOpen = await Linking.canOpenURL(whatsappAppUrl);
        await Linking.openURL(canOpen ? whatsappAppUrl : whatsappWebUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir WhatsApp para compartir.');
    } finally {
      setShowShareModal(false);
    }
  };

  const handleShareFacebook = async () => {
    if (!shareUrl) {
      return;
    }
    const mensaje = encodeURIComponent(buildShareMessage(shareUrl));
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl,
    )}&quote=${mensaje}`;
    try {
      await Linking.openURL(facebookUrl);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir Facebook para compartir.');
    } finally {
      setShowShareModal(false);
    }
  };

  const handleShareInstagram = async () => {
    if (!shareUrl) {
      return;
    }
    const instagramAppUrl = 'instagram://app';
    const instagramWebUrl = 'https://www.instagram.com/';
    try {
      if (Platform.OS === 'web') {
        await Linking.openURL(instagramWebUrl);
      } else {
        const canOpen = await Linking.canOpenURL(instagramAppUrl);
        await Linking.openURL(canOpen ? instagramAppUrl : instagramWebUrl);
      }
      Alert.alert(
        'Instagram',
        'Se abrió Instagram. Pega el enlace del seguimiento en tu publicación o historia.',
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir Instagram para compartir.');
    } finally {
      setShowShareModal(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
        } else if (typeof document !== 'undefined') {
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        Alert.alert('URL Copiada', 'La URL del seguimiento ha sido copiada al portapapeles.');
      } else {
        Alert.alert('Copiar enlace', shareUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo copiar la URL.');
    } finally {
      setShowShareModal(false);
    }
  };

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        {/* Imagen de fondo a pantalla completa */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/patines-fondo-nuevo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        {/* Contenido sobre el fondo */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <AvatarCircle avatar={currentUser?.avatar} size={50} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Inicio de Recorrido</Text>
              <Text style={styles.subtitle}>Navegación y Tracking</Text>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
        {/* Mostrar campo de Origen solo si no está seleccionado */}
        {!origenSeleccionado ? (
          <View style={styles.inputRow}>
            <UberStyleSearchInput
              label="Origen"
              placeholder="Buscar dirección o lugar..."
              value={origen}
              onChangeText={setOrigen}
              style={styles.input}
              labelStyle={styles.labelWhite}
              onSelectSuggestion={handleOrigenSelect}
              showCurrentLocation={true}
            />
          </View>
        ) : (
          // Mostrar origen seleccionado con opción de editar
          <View style={styles.selectedLocationContainer}>
            <View style={styles.selectedLocationContent}>
              <View style={styles.selectedLocationInfo}>
                <Text style={styles.selectedLocationLabel}>Origen:</Text>
                <Text style={styles.selectedLocationText} numberOfLines={2}>
                  {origen}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditarOrigen}>
                <Text style={styles.editButtonText}>✏️ Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mostrar campo de Destino solo si el origen está seleccionado */}
        {origenSeleccionado && (
          <View style={styles.inputRow}>
            <UberStyleSearchInput
              label="Destino"
              placeholder="Buscar dirección o lugar..."
              value={destino}
              onChangeText={setDestino}
              style={styles.input}
              labelStyle={styles.labelWhite}
              onSelectSuggestion={(suggestion) => {
                const destinationText = suggestion.isCurrentLocation 
                  ? suggestion.place_name 
                  : suggestion.place_name;
                setDestino(destinationText);
                console.log('Destino seleccionado:', destinationText);
              }}
              showCurrentLocation={false}
            />
          </View>
        )}

        {/* Mostrar botón de calcular solo si ambos están seleccionados */}
        {origenSeleccionado && destino.trim() && (
          <Button
            title={loading ? "Calculando..." : "Calcular Ruta"}
            onPress={handleCalcularRuta}
            loading={loading}
            disabled={loading}
            style={styles.calculateButton}
            textStyle={styles.calculateButtonText}
          />
        )}

        {routeData && (
          <View>
            <View style={styles.routeInfo}>
              <View style={styles.routeInfoItem}>
                <Text style={styles.routeInfoLabel}>Distancia:</Text>
                <Text style={styles.routeInfoValue}>
                  {formatDistance(routeData.distance)}
                </Text>
              </View>
              <View style={styles.routeInfoItem}>
                <Text style={styles.routeInfoLabel}>Tiempo estimado:</Text>
                <Text style={styles.routeInfoValue}>
                  {formatDuration(routeData.duration)}
                </Text>
              </View>
            </View>
            <Button
              title={isTracking ? "Detener Recorrido" : "Iniciar Recorrido"}
              onPress={handleToggleTracking}
              style={isTracking ? styles.stopRouteButton : styles.startRouteButton}
              textStyle={styles.startRouteButtonText}
            />
            
            {isTracking && (
              <View style={styles.trackingInfo}>
                <View style={styles.trackingInfoItem}>
                  <Text style={styles.trackingLabel}>Distancia recorrida:</Text>
                  <Text style={styles.trackingValue}>
                    {distanceTraveled >= 1000 
                      ? `${(distanceTraveled / 1000).toFixed(2)} km` 
                      : `${distanceTraveled.toFixed(0)} m`}
                  </Text>
                </View>
                {startTime && (
                  <View style={styles.trackingInfoItem}>
                    <Text style={styles.trackingLabel}>Tiempo:</Text>
                    <Text style={styles.trackingValue}>
                      {formatElapsedTime(startTime)}
                    </Text>
                  </View>
                )}
                {shareUrl && (
                  <Button
                    title="📤 Compartir Seguimiento"
                    onPress={handleShareUrl}
                    style={styles.shareButton}
                    textStyle={styles.shareButtonText}
                  />
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.mapWrapper}>
          <MapboxMap
            origin={origen}
            destination={destino}
            currentLocation={currentLocation}
            trackingPoints={trackingPoints}
            onRouteCalculate={(route) => {
              // Solo actualizar si hay datos válidos (distancia > 0)
              if (route && route.distance > 0) {
                setRouteData(route);
              }
              // Siempre desactivar loading cuando se recibe respuesta
              setLoading(false);
            }}
          />
        </View>
        </View>
        </ScrollView>

        {/* Modal de Compartir Seguimiento */}
        <Modal
          visible={showShareModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowShareModal(false)}>
          <View style={styles.shareModalOverlay}>
            <View style={styles.shareModalContainer}>
              <Text style={styles.shareModalTitle}>Compartir seguimiento</Text>
              <Text style={styles.shareModalSubtitle}>
                Elige una opción para compartir
              </Text>

              <View style={styles.shareOptions}>
                <TouchableOpacity
                  style={[styles.shareOptionButton, styles.shareOptionWhatsApp]}
                  onPress={handleShareWhatsApp}
                  activeOpacity={0.8}>
                  <Text style={styles.shareOptionText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareOptionButton, styles.shareOptionFacebook]}
                  onPress={handleShareFacebook}
                  activeOpacity={0.8}>
                  <Text style={styles.shareOptionText}>Facebook</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareOptionButton, styles.shareOptionInstagram]}
                  onPress={handleShareInstagram}
                  activeOpacity={0.8}>
                  <Text style={styles.shareOptionText}>Instagram</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.shareSystemButton}
                onPress={handleShareSystem}
                activeOpacity={0.8}>
                <Text style={styles.shareSystemButtonText}>Más opciones</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareCopyButton}
                onPress={handleCopyLink}
                activeOpacity={0.8}>
                <Text style={styles.shareCopyButtonText}>Copiar enlace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareCancelButton}
                onPress={() => setShowShareModal(false)}
                activeOpacity={0.8}>
                <Text style={styles.shareCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  },
  contentScroll: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    alignItems: 'flex-start', // Cambiar para alinear el avatar a la izquierda
    // Sin fondo para que resalte la imagen de atrás
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
  subtitle: {
    fontSize: 21, // 30% más grande (16 * 1.30 = 20.8, redondeado a 21)
    color: '#FFF',
    textAlign: 'center', // Centrar el texto
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  formContainer: {
    padding: 20,
    position: 'relative',
    zIndex: 10, // Alto z-index para que esté por encima del mapa
    // Sin fondo para que resalte la imagen de atrás
  },
  inputRow: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 20, // Z-index muy alto para que las sugerencias se vean
    elevation: 20, // Para Android
  },
  input: {
    width: '100%',
  },
  calculateButton: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  routeInfo: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  routeInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  routeInfoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  startRouteButton: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  startRouteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#FFF',
  },
  stopRouteButton: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  trackingInfo: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  trackingInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  trackingLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  trackingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  mapWrapper: {
    flex: 1,
    margin: 20,
    marginBottom: 100, // Espacio para la barra inferior
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(224, 224, 224, 0.85)',
    zIndex: 0, // Z-index bajo para que esté detrás del formulario
    ...Platform.select({
      web: {
        minHeight: 400,
      },
    }),
  },
  labelWhite: {
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  selectedLocationContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedLocationInfo: {
    flex: 1,
    marginRight: 12,
  },
  selectedLocationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedLocationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
  shareButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#9B59B6',
    shadowColor: '#9B59B6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shareModalContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  shareModalSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#C7D0E0',
    textAlign: 'center',
    marginBottom: 16,
  },
  shareOptions: {
    gap: 10,
    marginBottom: 12,
  },
  shareOptionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareOptionWhatsApp: {
    backgroundColor: '#25D366',
  },
  shareOptionFacebook: {
    backgroundColor: '#1877F2',
  },
  shareOptionInstagram: {
    backgroundColor: '#C13584',
  },
  shareOptionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  shareSystemButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
  },
  shareSystemButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  shareCopyButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shareCopyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  shareCancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shareCancelButtonText: {
    color: '#C7D0E0',
    fontSize: 13,
    fontWeight: '600',
  },
});

