import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import eventoService from '../services/eventoService';
import authService from '../services/authService';

interface VistaPreviaEventoScreenProps {
  navigation: any;
  route: any;
}

export const VistaPreviaEventoScreen: React.FC<VistaPreviaEventoScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    tituloRuta,
    puntoSalida,
    fechaInicio,
    cita,
    salida,
    nivel,
    lugarDestino,
  } = route.params || {};

  const [publishing, setPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePublicarEvento = async () => {
    // Validar que todos los campos requeridos estén presentes
    if (!tituloRuta || !puntoSalida || !fechaInicio || !cita || !salida || !nivel) {
      Alert.alert(
        '❌ Error de Validación',
        'Por favor, completa todos los campos requeridos:\n\n' +
        (!tituloRuta ? '• Título de la Ruta\n' : '') +
        (!puntoSalida ? '• Punto de Salida\n' : '') +
        (!fechaInicio ? '• Fecha de Inicio\n' : '') +
        (!cita ? '• Hora de Cita\n' : '') +
        (!salida ? '• Hora de Salida\n' : '') +
        (!nivel ? '• Nivel\n' : ''),
        [{text: 'Entendido', style: 'default'}]
      );
      return;
    }

    setPublishing(true);
    try {
      // Obtener el usuario actual para usar su ID como organizador
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert(
          '❌ Error de Autenticación',
          'No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.',
          [{text: 'OK', style: 'default'}]
        );
        setPublishing(false);
        return;
      }

      // Crear el evento
      const response = await eventoService.crearEvento({
        tituloRuta,
        puntoSalida,
        fechaInicio,
        cita,
        salida,
        nivel,
        lugarDestino: lugarDestino || null,
        organizadorId: currentUser.id,
      });

      if (response.success) {
        // Mostrar modal de éxito
        setPublishing(false);
        setShowSuccessModal(true);
      } else {
        // Mensajes de error específicos según el tipo de error
        let errorMessage = 'No se pudo publicar el evento.';
        
        if (response.error) {
          if (response.error.includes('Ya existe')) {
            errorMessage = `El evento "${tituloRuta}" ya existe para la fecha ${fechaInicio}.\n\nPor favor, verifica la información o modifica la fecha.`;
          } else if (response.error.includes('almacenamiento') || response.error.includes('quota')) {
            errorMessage = 'El almacenamiento está lleno. Por favor, elimina algunos eventos antiguos antes de crear uno nuevo.';
          } else {
            errorMessage = response.error;
          }
        }

        Alert.alert(
          '❌ Error al Publicar',
          errorMessage,
          [
            {
              text: 'Intentar de Nuevo',
              style: 'default',
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error al publicar evento:', error);
      
      let errorMessage = 'Ocurrió un error inesperado al publicar el evento.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'La operación tardó demasiado. Por favor, intenta nuevamente.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      Alert.alert(
        '❌ Error de Conexión',
        errorMessage,
        [
          {
            text: 'Reintentar',
            onPress: () => handlePublicarEvento(),
            style: 'default',
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setPublishing(false);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Vista Previa del Evento</Text>
          </View>

          {/* Contenido */}
          <View style={styles.contentContainer}>
            {/* Título de la Ruta */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Título de la Ruta</Text>
              <Text style={styles.sectionValue}>{tituloRuta || 'No especificado'}</Text>
            </View>

            {/* Punto de Salida */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Punto de Salida</Text>
              <Text style={styles.sectionValue}>{puntoSalida || 'No especificado'}</Text>
            </View>

            {/* Información de Fecha y Horarios */}
            <View style={styles.row}>
              <View style={[styles.section, styles.halfSection]}>
                <Text style={styles.sectionLabel}>Fecha Inicio</Text>
                <Text style={styles.sectionValue}>{fechaInicio || 'No especificado'}</Text>
              </View>
              <View style={[styles.section, styles.halfSection]}>
                <Text style={styles.sectionLabel}>Nivel</Text>
                <Text style={styles.sectionValue}>{nivel || 'No especificado'}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.section, styles.halfSection]}>
                <Text style={styles.sectionLabel}>Cita</Text>
                <Text style={styles.sectionValue}>{cita || 'No especificado'}</Text>
              </View>
              <View style={[styles.section, styles.halfSection]}>
                <Text style={styles.sectionLabel}>Salida</Text>
                <Text style={styles.sectionValue}>{salida || 'No especificado'}</Text>
              </View>
            </View>

            {/* Imagen */}
            <View style={styles.imagesRow}>
              <View style={styles.imageSection}>
                <Text style={styles.imageLabel}>Lugar del Destino</Text>
                {lugarDestino ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{uri: lugarDestino}}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No hay imagen</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.editButtonText}>Editar Evento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.publishButton, publishing && styles.publishButtonDisabled]}
                onPress={handlePublicarEvento}
                disabled={publishing}
                activeOpacity={0.8}>
                {publishing ? (
                  <View style={styles.publishingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.publishingSpinner} />
                    <Text style={styles.publishButtonText}>Publicando...</Text>
                  </View>
                ) : (
                  <Text style={styles.publishButtonText}>📢 Publicar Evento</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal de Éxito */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowSuccessModal(false);
            // Navegar al calendario al cerrar el modal
            navigation.reset({
              index: 0,
              routes: [{name: 'Calendario'}],
            });
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIconSuccess}>✅</Text>
                <Text style={styles.modalTitleSuccess}>¡Evento Publicado!</Text>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalSuccessMessage}>
                  El evento
                </Text>
                <Text style={styles.modalEventNameSuccess}>
                  "{tituloRuta}"
                </Text>
                <Text style={styles.modalSuccessMessage}>
                  ha sido publicado exitosamente y ya está visible en el calendario.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSuccess]}
                  onPress={() => {
                    setShowSuccessModal(false);
                    // Navegar al calendario y limpiar el stack
                    navigation.reset({
                      index: 0,
                      routes: [{name: 'Calendario'}],
                    });
                  }}
                  activeOpacity={0.8}>
                  <Text style={styles.modalButtonSuccessText}>Ver Calendario</Text>
                </TouchableOpacity>
              </View>
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 17, 40, 0.85)',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
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
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  halfSection: {
    flex: 1,
    marginHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imageSection: {
    width: '100%',
    maxWidth: 240,
    alignSelf: 'center',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Hacer cuadrado
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1, // Hacer cuadrado
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    opacity: 0.5,
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00D9FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#00D9FF',
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, #00D9FF 0%, #00A8CC 100%)',
      },
    }),
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  publishingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishingSpinner: {
    marginRight: 8,
  },
  // Estilos para modal de éxito
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconSuccess: {
    fontSize: 64,
    marginBottom: 12,
  },
  modalTitleSuccess: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalContent: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modalSuccessMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalEventNameSuccess: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalButtonSuccess: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#66BB6A',
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
      },
    }),
  },
  modalButtonSuccessText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
});

