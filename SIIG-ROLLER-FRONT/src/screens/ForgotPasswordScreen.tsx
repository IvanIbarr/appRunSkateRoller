// Copyright (c) 2026 Salvador Ivan Ibarra Garcia. Todos los derechos reservados.
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
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
        if (response.devCode && Platform.OS === 'web') {
          Alert.alert('Código de prueba', `Código: ${response.devCode}`);
        }
        navigation.navigate('ResetPassword', {email: email.trim()});
      } else {
        Alert.alert('Error', response.message || 'No se pudo enviar el código');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Olvidé mi contraseña</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un código de 4 dígitos al correo.
          </Text>

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

          <Text style={styles.backLink} onPress={() => navigation.goBack()}>
            Volver al login
          </Text>
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
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 14,
  },
  backLink: {
    marginTop: 16,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '600',
  },
});
