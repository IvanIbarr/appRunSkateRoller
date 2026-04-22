import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import adminGateService from '../services/adminGateService';
import authService from '../services/authService';
import apiService from '../services/apiService';
import {API_ENDPOINTS} from '../config/api';

export const AdminResetPasswordScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const ensureAdmin = async (): Promise<boolean> => {
    const u = await authService.getCurrentUser();
    const isAdmin = u?.email === 'admin@roller.com';
    if (!isAdmin) {
      Alert.alert('Acceso denegado', 'Solo administración.');
      return false;
    }
    return await adminGateService.ensureUnlocked();
  };

  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      Alert.alert('Email inválido', 'Escribe un correo válido.');
      return;
    }
    if (!(await ensureAdmin())) {
      return;
    }
    setSending(true);
    try {
      const res = await apiService.post<{success?: boolean; error?: string}>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        {email: e},
      );
      if (res?.success) {
        Alert.alert('Enviado', 'Se envió el correo de recuperación (si el usuario existe).');
        setEmail('');
      } else {
        Alert.alert('No se pudo enviar', res?.error || 'Error al enviar correo.');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'No se pudo enviar el correo.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <WithBottomTabBar>
      <View style={styles.root}>
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/menu-fondo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.backgroundOverlay} />
        </View>
        <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}>
            <Text style={styles.title}>Reset Password (Admin)</Text>
            <Text style={styles.subtitle}>Envía correo de recuperación</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Correo del usuario</Text>
          <TextInput
            style={styles.input}
            placeholder="usuario@email.com"
            placeholderTextColor="rgba(226,232,240,0.62)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.btn, sending && styles.btnDisabled]}
            onPress={send}
            disabled={sending}
            activeOpacity={0.9}>
            <Text style={styles.btnText}>{sending ? 'Enviando…' : 'Enviar reset'}</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Nota: requiere backend activo para enviar correo. Si falla, verás el mensaje del error.
          </Text>
        </View>
        </ScrollView>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, position: 'relative'},
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
  backgroundImage: {width: '100%', height: '100%'},
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 12, 24, 0.62)',
  },
  container: {padding: 18, paddingBottom: 26, zIndex: 1},
  headerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backText: {color: '#E2E8F0', fontSize: 18, fontWeight: '900'},
  title: {color: '#E2E8F0', fontSize: 18, fontWeight: '900'},
  subtitle: {color: 'rgba(226,232,240,0.72)', fontSize: 12, marginTop: 2},
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  label: {color: '#E2E8F0', fontSize: 13, fontWeight: '800', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E2E8F0',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.42)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#DBEAFE', fontWeight: '900'},
  note: {color: 'rgba(226,232,240,0.6)', fontSize: 12, marginTop: 10, lineHeight: 16},
});

