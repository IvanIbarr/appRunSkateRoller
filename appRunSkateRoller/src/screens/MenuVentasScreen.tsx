import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {LaunchPhaseBanner} from '../components/LaunchPhaseBanner';
import authService from '../services/authService';
import {userOwnsMarketingSale} from '../config/marketingDemoUsers';
import {MARKETING_SALES_KEY, notifyMarketingSalesUpdated} from '../config/marketingStorage';
import {
  loadMarketingSalesCatalog,
  deleteMarketingSaleRemote,
  updateMarketingSaleRemote,
} from '../services/marketingCatalogService';
import {getMarketingSaleGalleryUris} from '../utils/marketingSalePhotos';
import {appLog} from '../utils/clientLogger';

const DEPOSIT_KEY = '@marketing:ventasDepositCard';

export type MarketingSaleItem = {
  id: string;
  brandModel: string;
  priceMx?: string;
  category?: string;
  photoUri?: string | null;
  photoUris?: string[] | null;
  createdAt?: string;
  homeDelivery?: boolean;
  deliveryFeeMx?: number;
  ownerUserId?: string;
  saleType?: string;
  listingFeeMx?: number;
};

type DepositCardDraft = {
  titular: string;
  numeroTarjeta: string;
};

export const MenuVentasScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [mySales, setMySales] = useState<MarketingSaleItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MarketingSaleItem | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [deposit, setDeposit] = useState<DepositCardDraft>({
    titular: '',
    numeroTarjeta: '',
  });

  const loadAll = useCallback(async () => {
    const me = await authService.getCurrentUser();
    const uid = me?.id ?? null;
    setUserId(uid);
    try {
      const all: MarketingSaleItem[] = await loadMarketingSalesCatalog();
      const mine = me
        ? all.filter((s) => userOwnsMarketingSale(s.ownerUserId, me))
        : [];
      setMySales(mine);
    } catch (e) {
      setMySales([]);
      appLog.warn('Mis ventas: error al cargar catálogo', {
        screen: 'MenuVentasScreen',
        context: {message: e instanceof Error ? e.message : String(e)},
      });
    }
    try {
      const depRaw = await AsyncStorage.getItem(DEPOSIT_KEY);
      if (depRaw && uid) {
        const parsed = JSON.parse(depRaw);
        if (parsed.userId === uid) {
          setDeposit({
            titular: parsed.titular ?? '',
            numeroTarjeta: parsed.numeroTarjeta ?? '',
          });
        } else {
          setDeposit({
            titular: '',
            numeroTarjeta: '',
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const persistSales = async (next: MarketingSaleItem[]) => {
    const me = await authService.getCurrentUser();
    const uid = me?.id ?? null;
    const raw = await AsyncStorage.getItem(MARKETING_SALES_KEY);
    const all: MarketingSaleItem[] = raw ? JSON.parse(raw) : [];
    const others =
      me?.id != null
        ? all.filter((s) => !userOwnsMarketingSale(s.ownerUserId, me))
        : all.filter((s) => !next.some((n) => n.id === s.id));
    const merged = [...next, ...others];
    await AsyncStorage.setItem(MARKETING_SALES_KEY, JSON.stringify(merged));
    setMySales(next);
  };

  const openEdit = (item: MarketingSaleItem) => {
    setEditItem(item);
    setEditBrand(item.brandModel || '');
    setEditPrice(item.priceMx || '');
    setEditCategory(item.category || '');
  };

  const saveEdit = async () => {
    if (!editItem) {
      return;
    }
    const next = mySales.map((s) =>
      s.id === editItem.id
        ? {
            ...s,
            brandModel: editBrand.trim() || s.brandModel,
            priceMx: editPrice.trim() || s.priceMx,
            category: editCategory.trim() || s.category,
          }
        : s,
    );
    const apiOk = await updateMarketingSaleRemote(editItem.id, {
      brandModel: editBrand.trim() || editItem.brandModel,
      priceMx: editPrice.trim() || editItem.priceMx,
      category: editCategory.trim() || editItem.category,
    });
    if (apiOk) {
      notifyMarketingSalesUpdated();
      await loadAll();
      setEditItem(null);
      appLog.info('Venta actualizada vía API', {
        screen: 'MenuVentasScreen',
        context: {saleId: editItem.id},
      });
      Alert.alert('Ventas', 'Publicación actualizada.');
      return;
    }
    try {
      await persistSales(next);
      setEditItem(null);
      appLog.info('Venta actualizada solo en dispositivo', {
        screen: 'MenuVentasScreen',
        context: {saleId: editItem.id},
      });
      Alert.alert('Ventas', 'Publicación actualizada.');
    } catch {
      appLog.warn('No se pudo guardar edición de venta', {
        screen: 'MenuVentasScreen',
        context: {saleId: editItem.id},
      });
      Alert.alert('Ventas', 'No se pudo guardar.');
    }
  };

  const performDeleteSale = async (id: string) => {
    const apiOk = await deleteMarketingSaleRemote(id);
    if (apiOk) {
      notifyMarketingSalesUpdated();
      await loadAll();
      appLog.info('Publicación eliminada vía API', {
        screen: 'MenuVentasScreen',
        context: {saleId: id},
      });
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(MARKETING_SALES_KEY);
      const all: MarketingSaleItem[] = raw ? JSON.parse(raw) : [];
      const merged = all.filter((s) => s.id !== id);
      await AsyncStorage.setItem(MARKETING_SALES_KEY, JSON.stringify(merged));
      setMySales((prev) => prev.filter((s) => s.id !== id));
      appLog.info('Publicación eliminada solo en dispositivo', {
        screen: 'MenuVentasScreen',
        context: {saleId: id},
      });
    } catch {
      appLog.warn('Fallo al eliminar publicación', {
        screen: 'MenuVentasScreen',
        context: {saleId: id},
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('No se pudo eliminar la publicación.');
      } else {
        Alert.alert('Ventas', 'No se pudo eliminar.');
      }
    }
  };

  const confirmDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm('¿Quitar esta venta del listado?')
      ) {
        void performDeleteSale(id);
      }
      return;
    }
    Alert.alert('Eliminar publicación', '¿Quitar esta venta del listado?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => void performDeleteSale(id),
      },
    ]);
  };

  const saveDepositCard = async () => {
    if (!userId) {
      appLog.warn('Guardar depósito sin sesión', {screen: 'MenuVentasScreen'});
      Alert.alert('Ventas', 'Inicia sesión para guardar los datos de depósito.');
      return;
    }
    try {
      await AsyncStorage.setItem(
        DEPOSIT_KEY,
        JSON.stringify({
          userId,
          ...deposit,
          updatedAt: new Date().toISOString(),
        }),
      );
      appLog.info('Datos de depósito guardados en dispositivo', {
        screen: 'MenuVentasScreen',
      });
      Alert.alert('Ventas', 'Datos de tarjeta guardados en este dispositivo.');
    } catch {
      appLog.warn('No se pudieron guardar datos de depósito', {
        screen: 'MenuVentasScreen',
      });
      Alert.alert('Ventas', 'No se pudo guardar.');
    }
  };

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <LaunchPhaseBanner screenRouteName="MenuVentas" />
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Regresar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mis ventas</Text>
          <Text style={styles.subtitle}>
            Publicaciones de marketing que creaste. Edita o elimina desde aquí.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Depósito de ventas (tarjeta)</Text>
            <Text style={styles.warning}>
              Aviso: estos datos son solo de referencia en el dispositivo. No
              sustituyen un cobro real ni cumplen normas PCI; en producción usa un
              proveedor de pagos certificado.
            </Text>
            <Text style={styles.label}>Titular de la tarjeta</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre como aparece en la tarjeta"
              placeholderTextColor="rgba(203, 213, 245, 0.55)"
              value={deposit.titular}
              onChangeText={(t) => setDeposit((d) => ({...d, titular: t}))}
            />
            <Text style={styles.label}>Número de tarjeta</Text>
            <TextInput
              style={styles.input}
              placeholder="Solo para pruebas locales"
              placeholderTextColor="rgba(203, 213, 245, 0.55)"
              keyboardType="numeric"
              value={deposit.numeroTarjeta}
              onChangeText={(t) => setDeposit((d) => ({...d, numeroTarjeta: t}))}
            />
            <TouchableOpacity style={styles.saveDepositBtn} onPress={saveDepositCard}>
              <Text style={styles.saveDepositBtnText}>Guardar datos de depósito</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Tus publicaciones</Text>
          {mySales.length === 0 ? (
            <Text style={styles.empty}>
              No tienes ventas publicadas o aún no se registró el dueño en
              publicaciones antiguas. Publica desde Marketing → Vender.
            </Text>
          ) : (
            mySales.map((item) => {
              const thumbUri = getMarketingSaleGalleryUris(item)[0];
              return (
              <View key={item.id} style={styles.saleRow}>
                <View style={styles.saleThumb}>
                  {thumbUri ? (
                    <Image
                      source={{uri: thumbUri}}
                      style={styles.saleThumbImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.saleThumbPh}>—</Text>
                  )}
                </View>
                <View style={styles.saleBody}>
                  <Text style={styles.saleTitle} numberOfLines={2}>
                    {item.brandModel || '-'}
                  </Text>
                  <Text style={styles.salePrice}>
                    {item.priceMx ? `$${item.priceMx} MXN` : '$0 MXN'}
                  </Text>
                  <Text style={styles.saleMeta} numberOfLines={1}>
                    {item.category || '—'}
                  </Text>
                  <View style={styles.saleActions}>
                    <TouchableOpacity
                      style={styles.btnEdit}
                      onPress={() => openEdit(item)}>
                      <Text style={styles.btnEditText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnDel}
                      onPress={() => confirmDelete(item.id)}>
                      <Text style={styles.btnDelText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
            })
          )}
        </ScrollView>

        <Modal
          visible={editItem !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setEditItem(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Editar publicación</Text>
              <Text style={styles.label}>Marca / modelo</Text>
              <TextInput
                style={styles.input}
                value={editBrand}
                onChangeText={setEditBrand}
                placeholderTextColor="rgba(203, 213, 245, 0.55)"
              />
              <Text style={styles.label}>Precio (MXN)</Text>
              <TextInput
                style={styles.input}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
                placeholderTextColor="rgba(203, 213, 245, 0.55)"
              />
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholderTextColor="rgba(203, 213, 245, 0.55)"
              />
              <Text style={styles.modalHint}>
                La foto no se puede cambiar aquí; crea una nueva publicación si
                necesitas otra imagen.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalGhost}
                  onPress={() => setEditItem(null)}>
                  <Text style={styles.modalGhostText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimary} onPress={saveEdit}>
                  <Text style={styles.modalPrimaryText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backBtnText: {
    color: '#CBD5F5',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  warning: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#E2E8F0',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    fontSize: 14,
  },
  saveDepositBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  saveDepositBtnText: {
    color: '#7DD3FC',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5F5',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  empty: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
  },
  saleRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    marginBottom: 12,
  },
  saleThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleThumbImg: {
    width: '100%',
    height: '100%',
  },
  saleThumbPh: {
    color: '#64748B',
    fontSize: 12,
  },
  saleBody: {
    flex: 1,
    minWidth: 0,
  },
  saleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  salePrice: {
    fontSize: 13,
    color: '#7DD3FC',
    fontWeight: '700',
    marginBottom: 4,
  },
  saleMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  saleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnEdit: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  btnEditText: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDel: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  btnDelText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  modalHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalGhost: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalGhostText: {
    color: '#CBD5F5',
    fontWeight: '600',
  },
  modalPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  modalPrimaryText: {
    color: '#7DD3FC',
    fontWeight: '700',
  },
});
