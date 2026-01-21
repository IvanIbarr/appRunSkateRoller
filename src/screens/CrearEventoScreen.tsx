import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native';
import {Input} from '../components/Input';
import {Button} from '../components/Button';
import {ImageUploader} from '../components/ImageUploader';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import eventoService from '../services/eventoService';
import authService from '../services/authService';

interface CrearEventoScreenProps {
  navigation: any;
  route?: any;
}

export const CrearEventoScreen: React.FC<CrearEventoScreenProps> = ({
  navigation,
  route,
}) => {
  const isWide = Dimensions.get('window').width >= 768;
  // Obtener datos del evento para editar si existen
  const eventoParaEditar = route?.params?.eventoParaEditar;
  const esEdicion = route?.params?.esEdicion || false;

  // Formatear fecha para el input (DD/MM/YYYY)
  const formatearFechaParaInput = (fecha: string | Date | undefined): string => {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [tituloRuta, setTituloRuta] = useState(eventoParaEditar?.tituloRuta || eventoParaEditar?.titulo || '');
  const [puntoSalida, setPuntoSalida] = useState(eventoParaEditar?.puntoSalida || eventoParaEditar?.puntoEncuentroDireccion || '');
  const [fechaInicio, setFechaInicio] = useState(eventoParaEditar?.fechaInicio || formatearFechaParaInput(eventoParaEditar?.fecha) || '');
  const [cita, setCita] = useState(eventoParaEditar?.cita || eventoParaEditar?.hora || '');
  const [salida, setSalida] = useState(eventoParaEditar?.salida || '');
  const [nivel, setNivel] = useState(eventoParaEditar?.nivel || '');
  const [lugarDestino, setLugarDestino] = useState<string | null>(eventoParaEditar?.lugarDestino || null);
  const [loading, setLoading] = useState(false);

  const handleCrearEvento = async () => {
    // Validación básica
    if (!tituloRuta.trim()) {
      Alert.alert('Error', 'El título de la ruta es requerido');
      return;
    }
    if (!puntoSalida.trim()) {
      Alert.alert('Error', 'El punto de salida es requerido');
      return;
    }
    if (!fechaInicio.trim()) {
      Alert.alert('Error', 'La fecha de inicio es requerida');
      return;
    }
    if (!cita.trim()) {
      Alert.alert('Error', 'La hora de cita es requerida');
      return;
    }
    if (!salida.trim()) {
      Alert.alert('Error', 'La hora de salida es requerida');
      return;
    }
    if (!nivel.trim()) {
      Alert.alert('Error', 'El nivel es requerido');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos del evento
      const eventoData = {
        tituloRuta,
        puntoSalida,
        fechaInicio,
        cita,
        salida,
        nivel,
        lugarDestino,
      };
      
      if (esEdicion && eventoParaEditar?.id) {
        // Actualizar evento existente
        const response = await eventoService.actualizarEvento({
          id: eventoParaEditar.id,
          ...eventoData,
        });

        if (response.success) {
          Alert.alert(
            '✅ Evento Actualizado',
            `El evento "${tituloRuta}" ha sido actualizado exitosamente.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        } else {
          Alert.alert('Error', response.error || 'Error al actualizar el evento');
        }
        setLoading(false);
      } else {
        // Crear nuevo evento - navegar a vista previa
        console.log('Creando evento:', eventoData);
        setLoading(false);
        navigation.navigate('VistaPreviaEvento', eventoData);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Ocurrió un error al procesar el evento');
      console.error('Error:', error);
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
            <Text style={styles.title}>
              {esEdicion ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Detalles del evento</Text>
              <Input
                label="Título de la Ruta"
                placeholder="Ej: Rodada Nocturna Centro Histórico"
                value={tituloRuta}
                onChangeText={setTituloRuta}
                style={styles.input}
                labelStyle={styles.inputLabel}
                inputStyle={styles.inputField}
              />

              <Input
                label="Punto de Salida"
                placeholder="Ej: Monumento a la Revolución"
                value={puntoSalida}
                onChangeText={setPuntoSalida}
                style={styles.input}
                labelStyle={styles.inputLabel}
                inputStyle={styles.inputField}
              />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Fecha y horarios</Text>
              <View style={[styles.inputRow, isWide && styles.inputRowWide]}>
                <Input
                  label="Fecha Inicio"
                  placeholder="DD/MM/YYYY"
                  value={fechaInicio}
                  onChangeText={setFechaInicio}
                  style={[styles.input, styles.inputHalf]}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />
                <Input
                  label="Nivel"
                  placeholder="Ej: Principiante"
                  value={nivel}
                  onChangeText={setNivel}
                  style={[styles.input, styles.inputHalf]}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />
              </View>

              <View style={[styles.inputRow, isWide && styles.inputRowWide]}>
                <Input
                  label="Cita"
                  placeholder="HH:MM"
                  value={cita}
                  onChangeText={setCita}
                  style={[styles.input, styles.inputHalf]}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />
                <Input
                  label="Salida"
                  placeholder="HH:MM"
                  value={salida}
                  onChangeText={setSalida}
                  style={[styles.input, styles.inputHalf]}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Imagen del destino</Text>
              <View style={styles.imageUploadSingle}>
                <ImageUploader
                  label="Lugar del Destino"
                  imageUri={lugarDestino}
                  onImageSelected={setLugarDestino}
                  style={styles.imageUploaderSmall}
                />
              </View>
            </View>

            <Button
              title={esEdicion ? 'Actualizar Evento' : 'Crear Evento'}
              onPress={handleCrearEvento}
              loading={loading}
              style={styles.createButton}
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
  formContainer: {
    padding: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#00D9FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'column',
  },
  inputRowWide: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    color: '#FFFFFF',
  },
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(0, 217, 255, 0.5)',
    color: '#FFFFFF',
  },
  imageUploadSingle: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imageUploaderSmall: {
    width: 220,
    maxWidth: '100%',
  },
  createButton: {
    marginTop: 8,
    backgroundColor: '#00D9FF',
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, #00D9FF 0%, #00A8CC 100%)',
      },
    }),
  },
});

