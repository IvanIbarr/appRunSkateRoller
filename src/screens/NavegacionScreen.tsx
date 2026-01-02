import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import {Input} from '../components/Input';
import {AutocompleteInput} from '../components/AutocompleteInput';
import {Button} from '../components/Button';
import {MapboxMap} from '../components/MapboxMap';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
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
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

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

  // Mapbox ya se carga desde index.html, no necesita carga adicional

  const handleCalcularRuta = () => {
    if (!origen.trim() || !destino.trim()) {
      Alert.alert('Error', 'Por favor ingresa origen y destino');
      return;
    }

    setLoading(true);
    // La ruta se calculará automáticamente cuando cambien origen y destino
    // y el componente MapboxMap la procesará
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
        <View style={styles.inputRow}>
          <AutocompleteInput
            label="Origen"
            placeholder="Ej: Lic. Primo Verdad, Col. Jardines, CDMX"
            value={origen}
            onChangeText={setOrigen}
            style={styles.input}
            labelStyle={styles.labelWhite}
            onSelectSuggestion={(suggestion) => {
              setOrigen(suggestion.place_name);
            }}
          />
        </View>

        <View style={styles.inputRow}>
          <AutocompleteInput
            label="Destino"
            placeholder="Ej: Xitla, Col. Arenal 4ta Sección, CDMX"
            value={destino}
            onChangeText={setDestino}
            style={styles.input}
            labelStyle={styles.labelWhite}
            onSelectSuggestion={(suggestion) => {
              setDestino(suggestion.place_name);
            }}
          />
        </View>

        <Button
          title="Calcular Ruta"
          onPress={handleCalcularRuta}
          loading={loading}
          style={styles.calculateButton}
          textStyle={styles.calculateButtonText}
        />

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
              title="Iniciar Recorrido"
              onPress={() => {
                Alert.alert('Recorrido Iniciado', 'El seguimiento de tu recorrido ha comenzado.');
                // Aquí se puede agregar lógica para iniciar el seguimiento GPS
              }}
              style={styles.startRouteButton}
              textStyle={styles.startRouteButtonText}
            />
          </View>
        )}

        <View style={styles.mapWrapper}>
          <MapboxMap
            origin={origen}
            destination={destino}
            onRouteCalculate={(route) => {
              setRouteData(route);
              setLoading(false);
            }}
          />
        </View>
        </View>
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
    // Sin fondo para que resalte la imagen de atrás
  },
  inputRow: {
    marginBottom: 16,
    position: 'relative',
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
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeInfoItem: {
    alignItems: 'center',
  },
  routeInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 20,
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
  mapWrapper: {
    flex: 1,
    margin: 20,
    marginBottom: 100, // Espacio para la barra inferior
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(224, 224, 224, 0.85)',
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

