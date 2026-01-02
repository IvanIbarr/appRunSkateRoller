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
import authService from '../services/authService';
import {LoginCredentials} from '../types';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});

  const validate = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    if (!credentials.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!credentials.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(credentials);

      if (response.success && response.usuario) {
        // Navegar directamente a la pantalla de navegación y tracking
        navigation.replace('Navegacion');
      } else {
        Alert.alert('Error', response.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Título arriba */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>RunSkateRoller</Text>
          </View>

          {/* Logo de fondo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.jpeg')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Input
                label="Email"
                placeholder="correo@ejemplo.com"
                value={credentials.email}
                onChangeText={text =>
                  setCredentials({...credentials, email: text})
                }
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                labelStyle={styles.labelWhite}
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                value={credentials.password}
                onChangeText={text =>
                  setCredentials({...credentials, password: text})
                }
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
                labelStyle={styles.labelWhite}
              />
            </View>

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
            />
          </View>

          {/* Leyenda de registro fuera del formulario */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
            <Text
              style={styles.registerLink}
              onPress={() => navigation.navigate('Registro')}>
              Regístrate
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    zIndex: 10,
  },
  logoContainer: {
    // Logo a pantalla completa como fondo que resalta
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  logo: {
    // Logo ocupando toda la pantalla como fondo con color original
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    marginBottom: 0,
    // Sin opacidad para mantener el color original de la imagen
  },
  title: {
    fontSize: 58, // 20% más grande (48 * 1.20 = 57.6, redondeado a 58)
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
    zIndex: 10,
  },
  form: {
    zIndex: 10,
    // Sin fondo para que resalte el logo de fondo
    padding: 24,
    marginTop: 80, // Espacio desde el título
    marginBottom: 20,
    alignItems: 'center', // Centrar los campos
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400, // Limitar el ancho máximo para centrado
    alignSelf: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
  },
  labelWhite: {
    color: '#FFF',
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 10, // Reducido pero más legible
    paddingHorizontal: 18, // Reducido pero más legible
    minHeight: 35, // Reducido pero más legible
    alignSelf: 'center', // Centrar el botón
  },
  loginButtonText: {
    fontSize: 13, // Tamaño más legible
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    zIndex: 10,
    // Sin fondo para que resalte el logo de fondo
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'center',
    minWidth: 280,
  },
  registerText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  registerLink: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
});

