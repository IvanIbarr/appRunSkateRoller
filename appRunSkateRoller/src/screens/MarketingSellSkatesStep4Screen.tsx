import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {useRoute, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import {
  MARKETING_SALES_KEY,
  notifyMarketingSalesUpdated,
} from '../config/marketingStorage';
import {createMarketingSaleRemote} from '../services/marketingCatalogService';
import {appLog} from '../utils/clientLogger';

const COMMISSION_RATE = 0.1;
const IVA_ON_COMMISSION = 0.16;
const DELIVERY_FEE = 99;
const LISTING_FEE_CLASICA_MXN = 120;
const LISTING_FEE_PREMIUM_MXN = 200;

type SaleTypeParam = 'gratis' | 'clasica' | 'premium' | null | undefined;

function listingFeeForSaleType(st: SaleTypeParam): number {
  if (st === 'clasica') {
    return LISTING_FEE_CLASICA_MXN;
  }
  if (st === 'premium') {
    return LISTING_FEE_PREMIUM_MXN;
  }
  return 0;
}

function saleTypeRowLabel(st: SaleTypeParam): string {
  if (st === 'clasica') {
    return 'Tipo de venta · Clásica (150 días)';
  }
  if (st === 'premium') {
    return 'Tipo de venta · Premium (un año)';
  }
  if (st === 'gratis') {
    return 'Tipo de venta · Gratis (60 días)';
  }
  return 'Tipo de venta (Gratis, Clásica o Premium)';
}

function parsePriceMx(raw: string): number {
  const n = parseFloat(String(raw).replace(/,/g, '').trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatMoney(n: number): string {
  return n.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * En web, las fotos suelen ser blob:…; esas URLs no sobreviven al guardar en
 * AsyncStorage ni al recargar. Las convertimos a data:image/…;base64,…
 */
async function persistPhotoUri(
  uri: string | null | undefined,
): Promise<string | null> {
  if (!uri) {
    return null;
  }
  if (uri.startsWith('data:')) {
    return uri;
  }
  if (Platform.OS === 'web' && uri.startsWith('blob:')) {
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const r = reader.result;
          if (typeof r === 'string' && r.length > 0) {
            resolve(r);
          } else {
            reject(new Error('empty'));
          }
        };
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
  return uri;
}

export const MarketingSellSkatesStep4Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {width: windowWidth} = useWindowDimensions();
  const category = route.params?.category || '';
  const brandModel = route.params?.brandModel || '';
  const priceMx = route.params?.priceMx || '';
  const homeDelivery = Boolean(route.params?.homeDelivery);
  const deliveryFeeMx = route.params?.deliveryFeeMx ?? (homeDelivery ? DELIVERY_FEE : 0);
  const saleType = route.params?.saleType as SaleTypeParam;
  const photos = (route.params?.photos || []) as Array<{uri: string}>;
  const createdAt = useMemo(() => new Date(), []);
  const createdAtLabel = useMemo(
    () => createdAt.toLocaleDateString('es-MX'),
    [createdAt],
  );
  const [isPublishing, setIsPublishing] = useState(false);

  const isWide = windowWidth >= 720;

  const breakdown = useMemo(() => {
    const productPrice = parsePriceMx(priceMx);
    const tarifaVenta = productPrice * COMMISSION_RATE;
    const ivaComision = tarifaVenta * IVA_ON_COMMISSION;
    const tarifaPublicacion = listingFeeForSaleType(saleType);
    const subtotalVendedor =
      productPrice - tarifaVenta - ivaComision - tarifaPublicacion;
    const envioDomicilio = homeDelivery ? deliveryFeeMx : 0;
    const costoGuia = homeDelivery ? -DELIVERY_FEE : 0;
    const totalRecibir = subtotalVendedor + envioDomicilio + costoGuia;
    return {
      productPrice,
      tarifaVenta,
      ivaComision,
      tarifaPublicacion,
      subtotalVendedor,
      envioDomicilio,
      costoGuia,
      totalRecibir,
    };
  }, [priceMx, homeDelivery, deliveryFeeMx, saleType]);

  const publish = async () => {
    if (isPublishing) {
      return;
    }
    setIsPublishing(true);
    try {
      const listingFee = listingFeeForSaleType(saleType);
      const photoUris: string[] = [];
      for (const p of photos.slice(0, 5)) {
        const u = await persistPhotoUri(p?.uri);
        if (u) {
          photoUris.push(u);
        }
      }
      const photoUri = photoUris[0] ?? null;
      const me = await authService.getCurrentUser();
      const ownerUserId = me?.id != null ? String(me.id) : '';

      const payload = {
        brandModel,
        priceMx,
        category,
        photoUri,
        photoUris: photoUris.length > 0 ? photoUris : undefined,
        homeDelivery,
        deliveryFeeMx: homeDelivery ? deliveryFeeMx : 0,
        saleType: saleType ?? 'gratis',
        listingFeeMx: listingFee,
      };

      const apiOk = await createMarketingSaleRemote(payload);
      if (apiOk) {
        notifyMarketingSalesUpdated();
        appLog.info('Venta publicada en servidor', {
          screen: 'MarketingSellSkatesStep4Screen',
          context: {category, saleType: payload.saleType},
        });
        Alert.alert('Marketing', 'Publicado correctamente.');
        navigation.navigate('Marketing');
        return;
      }

      const stored = await AsyncStorage.getItem(MARKETING_SALES_KEY);
      const current = stored ? JSON.parse(stored) : [];
      const item = {
        id: `sale-${Date.now()}`,
        ...payload,
        photoUris: payload.photoUris ?? (photoUri ? [photoUri] : undefined),
        createdAt: createdAt.toISOString(),
        ownerUserId,
      };
      const updated = [item, ...current];
      await AsyncStorage.setItem(MARKETING_SALES_KEY, JSON.stringify(updated));
      notifyMarketingSalesUpdated();
      appLog.warn('Venta publicada solo local (API no disponible o sin sesión)', {
        screen: 'MarketingSellSkatesStep4Screen',
        context: {localId: item.id, category},
      });
      Alert.alert(
        'Marketing',
        'Publicado solo en este dispositivo (sin servidor o sesión no válida en el API).',
      );
      navigation.navigate('Marketing');
    } catch {
      appLog.error('Error al publicar venta', {
        screen: 'MarketingSellSkatesStep4Screen',
      });
      Alert.alert('Marketing', 'No se pudo publicar.');
    } finally {
      setIsPublishing(false);
    }
  };

  const b = breakdown;
  const priceLabel = b.productPrice > 0 ? `$${formatMoney(b.productPrice)} MXN` : '$0.00 MXN';

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Regresar</Text>
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={styles.title}>Inicio de Publicar venta</Text>
                <Text style={styles.subtitle}>Paso 3 · Resumen</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotDone]} />
              <Text style={styles.timelineText}>Paso 1</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotDone]} />
              <Text style={styles.timelineText}>Paso 2</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <Text style={styles.timelineTextActive}>Paso 3</Text>
            </View>
          </View>

          <View
            style={[
              styles.splitRow,
              !isWide && styles.splitRowStacked,
            ]}>
            <View style={[styles.leftPane, !isWide && styles.paneFull]}>
              <View style={styles.productImageWrap}>
                {photos[0] ? (
                  <Image source={{uri: photos[0].uri}} style={styles.productImage} />
                ) : (
                  <Text style={styles.helperText}>Sin imagen</Text>
                )}
              </View>
              <Text style={styles.productTitle} numberOfLines={3}>
                {brandModel || 'Sin título'}
              </Text>
              <Text style={styles.productPrice}>{priceLabel}</Text>
              <Text style={styles.productMeta}>Categoría: {category || '-'}</Text>
              <Text style={styles.productMeta}>Alta: {createdAtLabel}</Text>
            </View>

            <View style={[styles.rightPane, !isWide && styles.paneFull]}>
              <Text style={styles.summaryTitle}>Resumen de la Publicación</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={styles.tableHeaderConcept}>Concepto</Text>
                  <Text style={styles.tableHeaderMonto}>Monto</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.cellConcept, styles.cellBold]}>
                    Precio de tu Producto
                  </Text>
                  <Text style={[styles.cellMonto, styles.cellBold]}>
                    {`$${formatMoney(b.productPrice)}`}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellConcept}>
                    Tarifa de Venta (10% Comisión)
                  </Text>
                  <Text style={styles.cellMonto}>
                    {`- $${formatMoney(b.tarifaVenta)}`}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellConcept}>IVA sobre Comisión (16%)</Text>
                  <Text style={styles.cellMonto}>
                    {`- $${formatMoney(b.ivaComision)}`}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellConcept}>{saleTypeRowLabel(saleType)}</Text>
                  <Text style={styles.cellMonto}>
                    {`- $${formatMoney(b.tarifaPublicacion)}`}
                  </Text>
                </View>
                <View style={[styles.tableRow, styles.tableRowSubtotal]}>
                  <Text style={[styles.cellConcept, styles.cellBold]}>
                    Subtotal Vendedor
                  </Text>
                  <Text style={[styles.cellMonto, styles.cellBold]}>
                    {`$${formatMoney(b.subtotalVendedor)}`}
                  </Text>
                </View>
                <View style={[styles.tableRow, styles.tableRowSection]}>
                  <Text style={[styles.cellConcept, styles.cellBold]}>
                    Logística y Entrega
                  </Text>
                  <View style={styles.cellMontoSpacer} />
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellConcept}>
                    Envío a Domicilio (Pagado por cliente)
                  </Text>
                  <Text style={styles.cellMonto}>
                    {`$${formatMoney(b.envioDomicilio)}`}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellConcept}>Costo de Guía y Recolección</Text>
                  <Text style={styles.cellMonto}>
                    {homeDelivery
                      ? `- $${formatMoney(DELIVERY_FEE)}`
                      : `$${formatMoney(0)}`}
                  </Text>
                </View>
                <View style={[styles.tableRow, styles.tableRowTotal]}>
                  <Text style={[styles.cellConcept, styles.cellTotalLabel]}>
                    TOTAL A RECIBIR
                  </Text>
                  <Text style={[styles.cellMonto, styles.cellTotalMonto]}>
                    {`$${formatMoney(b.totalRecibir)}`}
                  </Text>
                </View>
              </View>
              <Text style={styles.summaryPaymentLegend}>
                Tu pago será liberado 48 horas después de que el cliente reciba el
                producto.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.publishButton,
              isPublishing && styles.publishButtonDisabled,
            ]}
            onPress={publish}>
            <Text style={styles.publishButtonText}>
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    width: '100%',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backButtonText: {
    fontSize: 11,
    color: '#CBD5F5',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
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
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  timelineStep: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    marginBottom: 4,
  },
  timelineDotDone: {
    backgroundColor: '#38BDF8',
  },
  timelineDotActive: {
    backgroundColor: '#F59E0B',
  },
  timelineLine: {
    height: 2,
    width: 26,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
    marginBottom: 12,
  },
  timelineText: {
    fontSize: 10,
    color: '#CBD5F5',
    fontWeight: '600',
  },
  timelineTextActive: {
    fontSize: 10,
    color: '#FCD34D',
    fontWeight: '700',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  splitRowStacked: {
    flexDirection: 'column',
  },
  leftPane: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  rightPane: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  paneFull: {
    width: '100%',
  },
  productImageWrap: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 280,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productTitle: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  productPrice: {
    fontSize: 18,
    color: '#7DD3FC',
    fontWeight: '700',
    marginBottom: 8,
  },
  productMeta: {
    fontSize: 11,
    color: '#CBD5F5',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  summaryPaymentLegend: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.35)',
    gap: 10,
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  tableRowSubtotal: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.45)',
    borderBottomColor: 'rgba(148, 163, 184, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  tableRowSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  tableRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: 'rgba(148, 163, 184, 0.55)',
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  tableHeaderConcept: {
    flex: 1.25,
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'left',
  },
  tableHeaderMonto: {
    flex: 0.95,
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'right',
    ...(Platform.OS !== 'web' ? {fontVariant: ['tabular-nums' as const]} : {}),
  },
  cellConcept: {
    flex: 1.25,
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '400',
    lineHeight: 17,
    textAlign: 'left',
  },
  cellMonto: {
    flex: 0.95,
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '400',
    textAlign: 'right',
    ...(Platform.OS !== 'web' ? {fontVariant: ['tabular-nums' as const]} : {}),
  },
  cellMontoSpacer: {
    flex: 0.95,
    minHeight: 12,
  },
  cellBold: {
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cellTotalLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#4ADE80',
  },
  cellTotalMonto: {
    fontWeight: '700',
    color: '#4ADE80',
    ...(Platform.OS !== 'web' ? {fontVariant: ['tabular-nums' as const]} : {}),
  },
  helperText: {
    fontSize: 12,
    color: '#CBD5F5',
  },
  publishButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.55)',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    minWidth: 200,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 14,
    color: '#7DD3FC',
    fontWeight: '700',
  },
});
