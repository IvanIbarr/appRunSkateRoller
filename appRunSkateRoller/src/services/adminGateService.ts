import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Platform} from 'react-native';

const UNLOCK_KEY = '@admin:unlocked:v1';

function getConfiguredAdminKey(): string | null {
  // Webpack define plugin ya expone process.env en web.
  const raw =
    typeof process !== 'undefined' && process.env && (process.env.REACT_APP_ADMIN_KEY as string | undefined);
  const v = (raw || '').trim();
  return v.length > 0 ? v : null;
}

async function promptForKey(): Promise<string | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.prompt === 'function') {
    const v = window.prompt('Clave de administrador');
    return (v || '').trim() || null;
  }
  // RN nativo: sin prompt de texto built-in; por ahora avisamos.
  Alert.alert(
    'Clave requerida',
    'Para desbloquear Admin en móvil nativo, configura la clave en web o implementamos un modal de texto.',
  );
  return null;
}

class AdminGateService {
  async isUnlocked(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(UNLOCK_KEY);
      return raw === 'true';
    } catch {
      return false;
    }
  }

  async lock(): Promise<void> {
    try {
      await AsyncStorage.setItem(UNLOCK_KEY, 'false');
    } catch {
      // ignore
    }
  }

  async unlock(): Promise<void> {
    try {
      await AsyncStorage.setItem(UNLOCK_KEY, 'true');
    } catch {
      // ignore
    }
  }

  async ensureUnlocked(): Promise<boolean> {
    const configured = getConfiguredAdminKey();
    // Si no hay clave configurada, no bloqueamos (modo demo).
    if (!configured) {
      await this.unlock();
      return true;
    }
    if (await this.isUnlocked()) {
      return true;
    }
    const entered = await promptForKey();
    if (!entered) {
      return false;
    }
    if (entered !== configured) {
      Alert.alert('Clave incorrecta', 'No se pudo desbloquear el módulo de administración.');
      return false;
    }
    await this.unlock();
    return true;
  }
}

export default new AdminGateService();

