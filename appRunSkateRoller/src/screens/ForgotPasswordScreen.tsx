import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import authService from '../services/authService';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n${message}`);
      if (onOk) {
        onOk();
      }
      return;
    }

    Alert.alert(
      title,
      message,
      onOk ? [{text: 'OK', onPress: onOk}] : undefined,
      {cancelable: !onOk},
    );
  };

  const handleSendCode = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresa un email válido');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authService.requestPasswordReset(email.trim());
      if (response.success) {
        const successMessage =
          'Se envió el código a su Email, favor de validar en su bandeja de entrada o en la bandeja de Spam';
        showAlert('Se envió el código', successMessage, () =>
          navigation.navigate('ResetPassword', {email: email.trim()}),
        );
      } else {
        showAlert('Error', response.message || 'No se pudo enviar el código');
      }
    } catch (err) {
      showAlert('Error', 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ImageBackground
        source={require('../../assets/registro-bg.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}>
        <View style={styles.backgroundOverlay} pointerEvents="none" />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.headerCard}>
              <Text style={styles.title}>Recuperar contraseña</Text>
              <Text style={styles.subtitle}>
                Te enviaremos un código de 4 dígitos al correo.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Input
                label="Email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  setError(null);
                }}
                error={error || undefined}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Button
                title="Enviar código"
                onPress={handleSendCode}
                loading={loading}
                style={styles.primaryButton}
              />
            </View>

            <Text style={styles.backLink} onPress={() => navigation.goBack()}>
              Volver al login
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 12, 24, 0.55)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#CBD5F5',
    marginBottom: 0,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 14,
  },
  backLink: {
    marginTop: 16,
    textAlign: 'center',
    color: '#38BDF8',
    fontWeight: '600',
  },
});
