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

interface ResetPasswordScreenProps {
  navigation: any;
  route: {params?: {email?: string}};
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  navigation,
  route,
}) => {
  const [email, setEmail] = useState(route.params?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleReset = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      showAlert('Error', 'Ingresa un email válido');
      return;
    }
    if (code.trim().length !== 4) {
      showAlert('Error', 'El código debe tener 4 dígitos');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const verify = await authService.verifyResetCode(email.trim(), code.trim());
      if (!verify.success || !verify.resetToken) {
        setLoading(false);
        showAlert('Error', verify.error || 'Código incorrecto');
        return;
      }

      const reset = await authService.resetPassword(
        email.trim(),
        verify.resetToken,
        newPassword,
      );
      if (reset.success) {
        setLoading(false);
        showAlert('Listo', 'Contraseña actualizada. Inicia sesión.', () =>
          navigation.reset({index: 0, routes: [{name: 'Login'}]}),
        );
        return;
      }
      showAlert('Error', reset.error || 'No se pudo restablecer la contraseña');
    } catch (err) {
      showAlert('Error', 'No se pudo restablecer la contraseña');
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
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa el código de 4 dígitos que recibiste por correo.
          </Text>

          <Input
            label="Email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Código"
            placeholder="1234"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />

          <Input
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Cambiar contraseña"
            onPress={handleReset}
            loading={loading}
            style={styles.primaryButton}
          />
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
    fontSize: 26,
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
    marginTop: 12,
    paddingVertical: 14,
  },
});
