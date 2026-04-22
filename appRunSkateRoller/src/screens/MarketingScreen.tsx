import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  ImageBackground,
  Image,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {LaunchPhaseBanner} from '../components/LaunchPhaseBanner';
import {useNavigation} from '@react-navigation/native';
import {loadMarketingSalesCatalog} from '../services/marketingCatalogService';
import {
  MARKETING_SALES_KEY,
  MARKETING_SALES_UPDATED_EVENT,
} from '../config/marketingStorage';
import authService from '../services/authService';
import {userOwnsMarketingSale} from '../config/marketingDemoUsers';
import type {Usuario} from '../types';
import {getMarketingSaleGalleryUris} from '../utils/marketingSalePhotos';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {appLog} from '../utils/clientLogger';

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

type SaleListItem = {
  id: string;
  brandModel: string;
  priceMx?: string;
  category?: string;
  photoUri?: string | null;
  photoUris?: string[] | null;
  createdAt?: string;
  ownerUserId?: string;
};

const SalePublicationCard: React.FC<{
  item: SaleListItem;
  showComprar: boolean;
  onComprar: () => void;
}> = ({item, showComprar, onComprar}) => {
  const {width: winW, height: winH} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const galleryUris = getMarketingSaleGalleryUris(item);
  const coverUri = galleryUris[0];
  const [imgFailed, setImgFailed] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const showPhoto = Boolean(coverUri) && !imgFailed;
  const galleryH = Math.min(winH * 0.62, 420);

  const openGallery = () => {
    if (galleryUris.length === 0) {
      return;
    }
    setGalleryIndex(0);
    setGalleryOpen(true);
  };

  return (
    <View style={styles.saleCard}>
      {showPhoto ? (
        <Image
          source={{uri: coverUri}}
          style={styles.saleCardBgImage}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View style={styles.saleCardFallbackBg}>
          <Text style={styles.salePlaceholder}>Sin foto</Text>
        </View>
      )}
      <View style={styles.saleCardOverlay} pointerEvents="none" />
      {galleryUris.length > 0 ? (
        <TouchableOpacity
          style={styles.saleGalleryChip}
          onPress={openGallery}
          activeOpacity={0.88}
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
          <Text style={styles.saleGalleryChipText}>
            {galleryUris.length > 1
              ? `🔍 ${galleryUris.length} fotos`
              : '🔍 Ver foto'}
          </Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.saleCardInner}>
        <Text style={styles.saleTitle} numberOfLines={2}>
          {item.brandModel || '-'}
        </Text>
        <Text style={styles.salePrice} numberOfLines={1}>
          {item.priceMx ? `$${item.priceMx} MXN` : '$0 MXN'}
        </Text>
        <Text style={styles.saleMeta} numberOfLines={2}>
          {item.category || '—'}
        </Text>
        {showComprar ? (
          <TouchableOpacity
            style={styles.saleComprarBtn}
            onPress={onComprar}
            activeOpacity={0.85}>
            <Text style={styles.saleComprarBtnText}>Comprar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={galleryOpen}
        transparent
        animationType="fade"
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.galleryModalRoot}>
          <View
            style={[
              styles.galleryModalHeader,
              {
                paddingTop:
                  Platform.OS === 'web'
                    ? 12
                    : Math.max(insets.top, Platform.OS === 'android' ? 12 : 8),
              },
            ]}>
            <Text style={styles.galleryModalTitle} numberOfLines={1}>
              {item.brandModel || 'Producto'}
            </Text>
            <TouchableOpacity
              style={styles.galleryModalClose}
              onPress={() => setGalleryOpen(false)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <Text style={styles.galleryModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            key={galleryOpen ? `gallery-open-${item.id}` : `gallery-closed-${item.id}`}
            data={galleryUris}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(u, i) => `${item.id}-g-${i}`}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const next = Math.round(x / winW);
              if (next >= 0 && next < galleryUris.length) {
                setGalleryIndex(next);
              }
            }}
            getItemLayout={(_, index) => ({
              length: winW,
              offset: winW * index,
              index,
            })}
            renderItem={({item: uri}) => (
              <View style={{width: winW, height: galleryH, justifyContent: 'center'}}>
                <Image
                  source={{uri}}
                  style={{width: winW, height: galleryH}}
                  resizeMode="contain"
                />
              </View>
            )}
          />
          {galleryUris.length > 1 ? (
            <View style={styles.galleryDotsRow}>
              {galleryUris.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.galleryDot,
                    i === galleryIndex && styles.galleryDotActive,
                  ]}
                />
              ))}
            </View>
          ) : null}
          <Text
            style={[
              styles.galleryCounter,
              {paddingBottom: Math.max(insets.bottom, 16)},
            ]}>
            {galleryIndex + 1} / {galleryUris.length}
          </Text>
        </View>
      </Modal>
    </View>
  );
};

export const MarketingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [showProposalInfo, setShowProposalInfo] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellType, setSellType] = useState<'patines' | 'accesorio' | null>(null);
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  const refreshUser = useCallback(async () => {
    const me = await authService.getCurrentUser();
    setCurrentUser(me);
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const list = await loadMarketingSalesCatalog();
      setSales(list);
      appLog.info('Catálogo de marketing cargado', {
        screen: 'MarketingScreen',
        context: {count: list.length},
      });
    } catch (e) {
      setSales([]);
      appLog.warn('No se pudo cargar el catálogo de marketing', {
        screen: 'MarketingScreen',
        context: {
          message: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }, []);

  useEffect(() => {
    void loadSales();
    void refreshUser();
    const unsubscribe = navigation.addListener('focus', () => {
      void loadSales();
      void refreshUser();
    });
    return unsubscribe;
  }, [navigation, loadSales, refreshUser]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === MARKETING_SALES_KEY || e.key === null) {
        void loadSales();
      }
    };
    const onUpdated = () => void loadSales();
    window.addEventListener('storage', onStorage);
    window.addEventListener(MARKETING_SALES_UPDATED_EVENT, onUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(MARKETING_SALES_UPDATED_EVENT, onUpdated);
    };
  }, [loadSales]);

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/marketing-bg.png')}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}>
          <View style={styles.backgroundOverlay} pointerEvents="none" />
          <ScrollView contentContainerStyle={styles.content}>
            <LaunchPhaseBanner screenRouteName="Marketing" />
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Marketing</Text>
                </View>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => setShowProposalInfo(true)}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Panel en construcción</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setSellType(null);
                    setShowSellModal(true);
                  }}>
                  <Text style={styles.actionIcon}>🛒</Text>
                <Text style={styles.actionText}>Vender</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>🧩</Text>
                  <Text style={styles.actionText}>Categoria</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.searchSection}>
                <Text style={styles.searchLabel}>Búsqueda</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Busca productos o vendedores..."
                  placeholderTextColor="rgba(203, 213, 245, 0.7)"
                />
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Publicaciones recientes</Text>
              <Text style={styles.catalogHint}>
                Con el servidor activo, todas las cuentas ven el mismo listado en
                tiempo real. Si no hay conexión al API, se usa solo el almacenamiento
                de este dispositivo.
              </Text>
              {sales.length === 0 ? (
                <Text style={styles.cardText}>Aún no hay publicaciones.</Text>
              ) : (
                <View style={styles.salesList}>
                  {chunkPairs(sales).map((pair, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.salesRow}>
                      {pair.map((item) => {
                        const isOwner = userOwnsMarketingSale(
                          item.ownerUserId,
                          currentUser,
                        );
                        return (
                          <SalePublicationCard
                            key={item.id}
                            item={item}
                            showComprar={!isOwner}
                            onComprar={() =>
                              navigation.navigate('MarketingComprarEnvio', {
                                draft: {
                                  saleId: item.id,
                                  brandModel: item.brandModel || 'Producto',
                                  priceMx: item.priceMx,
                                  photoUri: item.photoUri,
                                  ownerUserId: item.ownerUserId,
                                },
                              })
                            }
                          />
                        );
                      })}
                      {pair.length === 1 ? (
                        <View style={[styles.saleCard, styles.saleCardPlaceholder]} />
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </ImageBackground>
      </View>
      <Modal
        visible={showProposalInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProposalInfo(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Propuesta de Marketing</Text>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Marketplace Roller</Text>
              <Text style={styles.modalText}>
                Venta de patines y accesorios nuevos o usados (kit de protección,
                ropa, ruedas, herramientas). Catálogo con fotos, estado, talla,
                compatibilidad y precio.
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Flujo de compra segura</Text>
              <Text style={styles.modalText}>
                1) Publicar producto{'\n'}
                2) Comprador paga y se retiene el dinero{'\n'}
                3) Vendedor imprime guía y entrega a paquetería{'\n'}
                4) Entrega confirmada{'\n'}
                5) Pago liberado al vendedor menos comisión
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Pagos y comisiones</Text>
              <Text style={styles.modalText}>
                Integración con Mercado Pago o PayPal. Se cobra comisión por
                transacción (porcentaje + tarifa fija). La comisión se descuenta
                antes de transferir al vendedor.
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Envíos a domicilio</Text>
              <Text style={styles.modalText}>
                Solo envíos con guía tendrán costo extra y es generada por Mercado
                Envíos, Estafeta, DHL o FedEx. El vendedor imprime la guía y deja
                el paquete en la paquetería.
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Seguridad y confianza</Text>
              <Text style={styles.modalText}>
                Verificación de identidad, reputación por ventas, reportes,
                revisión de fotos y bloqueo de cuentas sospechosas.
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Carrito y checkout</Text>
              <Text style={styles.modalText}>
                Carrito con múltiples productos, cálculo de envío, total final y
                confirmación de compra. Historial de pedidos y estatus de envío.
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Ingreso extra</Text>
              <Text style={styles.modalText}>
                Banner de anuncios para proveedores. Cobro mensual por presencia
                destacada y opción de campañas por temporada.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProposalInfo(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showSellModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSellModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Publicar venta</Text>
            <Text style={styles.modalText}>
              Selecciona el tipo de publicación:
            </Text>
            <View style={styles.sellTypeRow}>
              <TouchableOpacity
                style={[
                  styles.sellTypeCard,
                  sellType === 'patines' && styles.sellTypeCardActive,
                ]}
                onPress={() => {
                  setSellType('patines');
                  setShowSellModal(false);
                  navigation.navigate('MarketingSellSkates');
                }}>
                <Text style={styles.sellTypeIcon}>🛼</Text>
                <Text style={styles.sellTypeText}>Patines</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sellTypeCard,
                  sellType === 'accesorio' && styles.sellTypeCardActive,
                ]}
                onPress={() => setSellType('accesorio')}>
                <Text style={styles.sellTypeIcon}>🧩</Text>
                <Text style={styles.sellTypeText}>Accesorio</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSellModal(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </WithBottomTabBar>
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
    backgroundColor: 'rgba(10, 12, 24, 0.6)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    alignSelf: 'stretch',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  subtitle: {
    fontSize: 13,
    color: '#CBD5F5',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
    width: '100%',
    alignSelf: 'stretch',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  catalogHint: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#7DD3FC',
    fontWeight: '700',
  },
  searchSection: {
    marginTop: 12,
  },
  searchLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    fontSize: 13,
  },
  salesList: {
    width: '100%',
  },
  salesRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 10,
  },
  saleCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 188,
    position: 'relative',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  saleCardBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  saleCardFallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.42)',
  },
  saleCardInner: {
    flex: 1,
    minHeight: 188,
    padding: 10,
    paddingBottom: 8,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  saleGalleryChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  saleGalleryChipText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '700',
  },
  galleryModalRoot: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.94)',
    justifyContent: 'center',
  },
  galleryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  galleryModalTitle: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
  },
  galleryModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryModalCloseText: {
    color: '#FCA5A5',
    fontSize: 18,
    fontWeight: '700',
  },
  galleryDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  galleryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.45)',
  },
  galleryDotActive: {
    backgroundColor: '#38BDF8',
    width: 18,
  },
  galleryCounter: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  saleComprarBtn: {
    marginTop: 8,
    alignSelf: 'stretch',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.55)',
    alignItems: 'center',
  },
  saleComprarBtnText: {
    color: '#BBF7D0',
    fontSize: 12,
    fontWeight: '800',
  },
  saleCardPlaceholder: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  salePlaceholder: {
    fontSize: 10,
    color: '#64748B',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  saleTitle: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  salePrice: {
    fontSize: 13,
    color: '#7DD3FC',
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  saleMeta: {
    fontSize: 10,
    color: '#E2E8F0',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  infoButton: {
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  infoIcon: {
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  modalText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  modalSection: {
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  modalCloseButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  modalCloseText: {
    color: '#7DD3FC',
    fontWeight: '600',
  },
  sellTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  sellTypeCard: {
    flex: 1,
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sellTypeCardActive: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  sellTypeIcon: {
    fontSize: 22,
  },
  sellTypeText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
  },
});
