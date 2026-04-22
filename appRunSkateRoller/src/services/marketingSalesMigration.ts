import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALEX_AZCAPO_USER_ID} from '../config/marketingDemoUsers';
import {MARKETING_SALES_KEY} from '../config/marketingStorage';

/**
 * Asigna ownerUserId a publicaciones antiguas sin dueño (p. ej. las 3 de prueba)
 * para que aparezcan en "Tus publicaciones" de Alex Azcapo.
 */
export async function migrateOrphanSalesToAlexAzcapo(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(MARKETING_SALES_KEY);
    if (!raw) {
      return;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) {
      return;
    }
    let changed = false;
    const next = list.map((item: {ownerUserId?: string} & Record<string, unknown>) => {
      if (!item.ownerUserId) {
        changed = true;
        return {...item, ownerUserId: ALEX_AZCAPO_USER_ID};
      }
      return item;
    });
    if (changed) {
      await AsyncStorage.setItem(MARKETING_SALES_KEY, JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }
}
