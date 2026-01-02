import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import grupoService from '../services/grupoService';
import {WithBottomTabBar} from '../components/WithBottomTabBar';

interface NombreGrupoScreenProps {
  navigation: any;
}

export const NombreGrupoScreen: React.FC<NombreGrupoScreenProps> = ({
  navigation,
}) => {
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [nombreGrupoOriginal, setNombreGrupoOriginal] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadNombreGrupo();
  }, []);

  const loadNombreGrupo = async () => {
    try {
      setLoadingData(true);
      const response = await grupoService.getNombreGrupo();
      if (response.success) {
        const nombre = response.nombreGrupo || '';
        setNombreGrupo(nombre);
        setNombreGrupoOriginal(nombre);
      } else {
        Alert.alert('Error', response.error || 'No se pudo cargar el nombre del grupo');
      }
    } catch (error) {
      console.error('Error al cargar nombre del grupo:', error);
      Alert.alert('Error', 'Error al cargar el nombre del grupo');
    } finally {
      setLoadingData(false);
    }
  };

  const handleGuardar = async () => {
    setError('');
    setSuccessMessage('');

    const nombreTrimmed = nombreGrupo.trim();

    if (!nombreTrimmed) {
      setError('El nombre del grupo es requerido');
      return;
    }

    if (nombreTrimmed.length > 255) {
      setError('El nombre del grupo no puede exceder 255 caracteres');
      return;
    }

    // Verificar si el nombre no cambió
    if (nombreTrimmed === nombreGrupoOriginal) {
      setError('⚠️ Ya tienes este nombre de grupo. No hay cambios para guardar.');
      return;
    }

    setLoading(true);

    try {
      const response = await grupoService.updateNombreGrupo(nombreTrimmed);

      if (response.success) {
        setNombreGrupoOriginal(nombreTrimmed);
        setSuccessMessage('✓ Nombre del grupo guardado exitosamente');
        
        // Navegar después de 1.5 segundos para que se vea el mensaje
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = response.error || 'Error al guardar el nombre del grupo';
        // Verificar si el error menciona que ya existe
        if (errorMessage.toLowerCase().includes('ya existe') || errorMessage.toLowerCase().includes('duplicado')) {
          setError('⚠️ ' + errorMessage);
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error al guardar nombre del grupo:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      setError('⚠️ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      </WithBottomTabBar>
    );
  }

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        {/* Imagen de fondo a pantalla completa */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/menu-fondo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              <Text style={styles.title}>Nombre del Grupo</Text>
              <Text style={styles.subtitle}>
                Establece el nombre de tu grupo
              </Text>

              <View style={styles.form}>
                <Input
                  label="Nombre del Grupo"
                  placeholder="Ej: Grupo de Rollers CDMX"
                  value={nombreGrupo}
                  onChangeText={text => {
                    setNombreGrupo(text);
                    setError(''); // Limpiar error al escribir
                    setSuccessMessage(''); // Limpiar mensaje de éxito al escribir
                  }}
                  error={error}
                  maxLength={255}
                  labelStyle={styles.labelWhite}
                />

                <Button
                  title="Guardar"
                  onPress={handleGuardar}
                  loading={loading}
                  style={styles.submitButton}
                  textStyle={styles.submitButtonText}
                />

                {successMessage ? (
                  <Text style={styles.successMessage}>{successMessage}</Text>
                ) : null}

                <Button
                  title="Volver al Menú"
                  onPress={() => navigation.navigate('Menu')}
                  variant="outline"
                  style={styles.menuButton}
                  textStyle={styles.menuButtonText}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  form: {
    marginTop: 20,
  },
  labelWhite: {
    color: '#FFF',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#34C759',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  menuButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    marginTop: 12,
    fontSize: 16,
    color: '#34C759',
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
});

