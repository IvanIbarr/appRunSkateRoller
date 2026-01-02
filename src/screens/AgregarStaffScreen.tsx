import React, {useState} from 'react';
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
import staffService, {CreateStaffData} from '../services/staffService';
import {WithBottomTabBar} from '../components/WithBottomTabBar';

interface AgregarStaffScreenProps {
  navigation: any;
}

export const AgregarStaffScreen: React.FC<AgregarStaffScreenProps> = ({
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validate = (): boolean => {
    setError('');
    
    if (!email.trim()) {
      setError('El email es requerido');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('El email no es válido');
      return false;
    }
    
    return true;
  };

  const handleAgregarStaff = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await staffService.createStaff({email});

      if (response.success && response.usuario) {
        setSuccessMessage(`✓ Usuario ${response.usuario.email} agregado al staff exitosamente`);
        setEmail(''); // Limpiar el campo
        
        // Navegar después de 2 segundos para que se vea el mensaje
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        const errorMessage = response.error || 'Error al agregar miembro del staff';
        // Verificar si el error indica que ya está dado de alta
        if (errorMessage.toLowerCase().includes('ya tiene perfil') || 
            errorMessage.toLowerCase().includes('ya está') ||
            errorMessage.toLowerCase().includes('liderGrupo')) {
          setError('⚠️ ' + errorMessage);
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error al agregar staff:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      setError('⚠️ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              <Text style={styles.title}>Agregar Staff</Text>
              <Text style={styles.subtitle}>
                Ingresa el correo de un usuario existente con perfil roller para agregarlo al staff
              </Text>

              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    setError(''); // Limpiar error al escribir
                    setSuccessMessage(''); // Limpiar mensaje de éxito al escribir
                  }}
                  error={error}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  labelStyle={styles.labelWhite}
                />

                <Button
                  title="Agregar Staff"
                  onPress={handleAgregarStaff}
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
