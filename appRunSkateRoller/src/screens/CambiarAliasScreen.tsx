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
import aliasService from '../services/aliasService';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import authService from '../services/authService';

interface CambiarAliasScreenProps {
  navigation: any;
}

export const CambiarAliasScreen: React.FC<CambiarAliasScreenProps> = ({
  navigation,
}) => {
  const [alias, setAlias] = useState('');
  const [aliasActual, setAliasActual] = useState<string | null>(null);
  const [cambiosRestantes, setCambiosRestantes] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadAliasInfo();
  }, []);

  const loadAliasInfo = async () => {
    try {
      setLoadingData(true);
      const response = await aliasService.getAlias();
      if (response.success) {
        setAliasActual(response.alias || null);
        setAlias(response.alias || '');
        setCambiosRestantes(response.cambiosRestantes ?? null);
      } else {
        Alert.alert('Error', response.error || 'No se pudo cargar la información del alias');
      }
    } catch (error) {
      console.error('Error al cargar información del alias:', error);
      Alert.alert('Error', 'Error al cargar la información del alias');
    } finally {
      setLoadingData(false);
    }
  };

  const handleGuardar = async () => {
    setError('');
    setSuccessMessage('');

    if (!alias.trim()) {
      setError('El alias es requerido');
      return;
    }

    if (alias.trim() === aliasActual) {
      setError('El nuevo alias debe ser diferente al actual');
      return;
    }

    if (alias.trim().length > 100) {
      setError('El alias no puede exceder 100 caracteres');
      return;
    }

    // Validar que solo contenga letras, números, espacios, guiones y guiones bajos
    const aliasRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$/;
    if (!aliasRegex.test(alias.trim())) {
      setError('El alias solo puede contener letras, números, espacios, guiones y guiones bajos');
      return;
    }

    if (cambiosRestantes !== null && cambiosRestantes <= 0) {
      setError('⚠️ Has alcanzado el límite de cambios de alias (3 cambios máximos)');
      return;
    }

    setLoading(true);

    try {
      const response = await aliasService.cambiarAlias(alias.trim());

      if (response.success && response.usuario) {
        // Actualizar el usuario en AsyncStorage
        await authService.getCurrentUser();
        
        setSuccessMessage('✓ ' + (response.message || 'Alias cambiado exitosamente'));
        
        // Navegar después de 1.5 segundos para que se vea el mensaje
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = response.error || 'Error al cambiar alias';
        // Verificar si el error es porque el alias ya existe
        if (errorMessage.toLowerCase().includes('ya existe') || errorMessage.toLowerCase().includes('límite')) {
          setError('⚠️ ' + errorMessage);
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error al cambiar alias:', error);
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
              <Text style={styles.title}>Cambiar Alias</Text>
              <Text style={styles.subtitle}>
                {cambiosRestantes !== null && cambiosRestantes > 0
                  ? `Te quedan ${cambiosRestantes} cambio${cambiosRestantes !== 1 ? 's' : ''} disponible${cambiosRestantes !== 1 ? 's' : ''}`
                  : cambiosRestantes === 0
                  ? 'Has alcanzado el límite de cambios (3 cambios máximos)'
                  : 'Modifica tu alias personal'}
              </Text>

              {aliasActual && (
                <View style={styles.currentAliasContainer}>
                  <Text style={styles.currentAliasLabel}>Alias actual:</Text>
                  <Text style={styles.currentAliasValue}>{aliasActual}</Text>
                </View>
              )}

              <View style={styles.form}>
                <Input
                  label="Nuevo Alias"
                  placeholder="Ej: RollerPro2024"
                  value={alias}
                  onChangeText={text => {
                    setAlias(text);
                    setError(''); // Limpiar error al escribir
                    setSuccessMessage(''); // Limpiar mensaje de éxito al escribir
                  }}
                  error={error}
                  maxLength={100}
                  labelStyle={styles.labelWhite}
                  editable={cambiosRestantes === null || cambiosRestantes > 0}
                />

                <Button
                  title="Guardar Cambios"
                  onPress={handleGuardar}
                  loading={loading}
                  disabled={cambiosRestantes !== null && cambiosRestantes <= 0}
                  style={[
                    styles.submitButton,
                    (cambiosRestantes !== null && cambiosRestantes <= 0) && styles.submitButtonDisabled,
                  ]}
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
    color: '#FFF',
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
  currentAliasContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentAliasLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 4,
    opacity: 0.8,
  },
  currentAliasValue: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
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
  submitButtonDisabled: {
    backgroundColor: '#999',
    shadowColor: '#999',
    opacity: 0.6,
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
