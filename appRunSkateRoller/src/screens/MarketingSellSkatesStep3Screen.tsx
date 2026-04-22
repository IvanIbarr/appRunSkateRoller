import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {useRoute, useNavigation, StackActions} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import {appLog} from '../utils/clientLogger';

export const MarketingSellSkatesStep3Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const category = route.params?.category || '';
  const [brandModel, setBrandModel] = useState('');
  const [photos, setPhotos] = useState<Array<{uri: string; name?: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [condition, setCondition] = useState<'nuevo' | 'usado' | 'reacondicionado' | null>(
    null,
  );
  const [sizeMx, setSizeMx] = useState('');
  const [sizeUs, setSizeUs] = useState('');
  const [wheelSize, setWheelSize] = useState('');
  const [priceMx, setPriceMx] = useState('');
  const [saleType, setSaleType] = useState<'gratis' | 'clasica' | 'premium' | null>(
    null,
  );
  const [homeDelivery, setHomeDelivery] = useState(false);

  const DELIVERY_FEE_MXN = 99;
  const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
  const MIN_DIMENSION = 500;
  const MAX_PHOTOS = 5;
  const MIN_PHOTOS_FOR_NEXT = 1;

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Regresar</Text>
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={styles.title}>Inicio de Publicar venta</Text>
                <Text style={styles.subtitle}>Paso 2</Text>
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
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <Text style={styles.timelineTextActive}>Paso 2</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineText}>Paso 3</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.helperText}>
              Categoría seleccionada: <Text style={styles.highlight}>{category}</Text>
            </Text>
            <Text style={styles.label}>Marca y modelo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. FR1 80, Powerslide Next, Rollerblade Twister"
              placeholderTextColor="rgba(203, 213, 245, 0.7)"
              value={brandModel}
              onChangeText={setBrandModel}
              multiline
            />
            <View style={styles.sectionDivider} />
            <Text style={styles.label}>Condición del producto</Text>
            <View style={styles.conditionRow}>
              {[
                {id: 'nuevo', label: 'Nuevo'},
                {id: 'usado', label: 'Usado'},
                {id: 'reacondicionado', label: 'Reacondicionamiento'},
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.conditionItem,
                    condition === item.id && styles.conditionItemActive,
                  ]}
                  onPress={() =>
                    setCondition(item.id as 'nuevo' | 'usado' | 'reacondicionado')
                  }>
                  <Text
                    style={[
                      styles.conditionText,
                      condition === item.id && styles.conditionTextActive,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sizeRow}>
              <View style={styles.sizeColumn}>
                <Text style={styles.label}>Talla (MX)</Text>
                <TextInput
                  style={styles.inputSmall}
                  placeholder="Ej. 27"
                  placeholderTextColor="rgba(203, 213, 245, 0.7)"
                  value={sizeMx}
                  onChangeText={setSizeMx}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.sizeColumn}>
                <Text style={styles.label}>Talla (US)</Text>
                <TextInput
                  style={styles.inputSmall}
                  placeholder="Ej. 9"
                  placeholderTextColor="rgba(203, 213, 245, 0.7)"
                  value={sizeUs}
                  onChangeText={setSizeUs}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={styles.label}>Tamaño de ruedas (mm)</Text>
            <TextInput
              style={styles.inputSmall}
              placeholder="Ej. 80"
              placeholderTextColor="rgba(203, 213, 245, 0.7)"
              value={wheelSize}
              onChangeText={setWheelSize}
              keyboardType="numeric"
            />
            <View style={styles.sectionDivider} />
            <Text style={styles.label}>Precio (MXN)</Text>
            <TextInput
              style={styles.inputSmall}
              placeholder="$ 0.00"
              placeholderTextColor="rgba(203, 213, 245, 0.7)"
              value={priceMx}
              onChangeText={setPriceMx}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.deliveryRow}
              onPress={() => setHomeDelivery((v) => !v)}
              activeOpacity={0.8}>
              <View
                style={[
                  styles.deliveryCheckbox,
                  homeDelivery && styles.deliveryCheckboxChecked,
                ]}>
                {homeDelivery ? <Text style={styles.deliveryCheckmark}>✓</Text> : null}
              </View>
              <View style={styles.deliveryTextBlock}>
                <Text style={styles.deliveryLabel}>
                  Servicio de entrega a domicilio
                </Text>
                <Text style={styles.deliveryPrice}>${DELIVERY_FEE_MXN} MXN</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.deliveryLegend}>
              Aviso: por ahora todas las ventas en el marketplace se coordinan con{' '}
              <Text style={styles.deliveryLegendEmphasis}>envío a domicilio</Text>, para
              respaldar la operación y que el comprador reciba el producto con menos riesgo.
              Si ofreces esta entrega, activa la casilla; el cargo de{' '}
              {`$${DELIVERY_FEE_MXN} MXN`} se muestra desglosado en el resumen antes de
              publicar.
            </Text>
            <Text style={styles.label}>Tipo de venta</Text>
            <View style={styles.saleTypeList}>
              {[
                {id: 'gratis', label: 'Gratis (60 días)'},
                {id: 'clasica', label: 'Clásica (150 días) · $120'},
                {id: 'premium', label: 'Un año Premium · $200'},
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.saleTypeItem,
                    saleType === item.id && styles.saleTypeItemActive,
                  ]}
                  onPress={() =>
                    setSaleType(item.id as 'gratis' | 'clasica' | 'premium')
                  }>
                  <Text
                    style={[
                      styles.saleTypeText,
                      saleType === item.id && styles.saleTypeTextActive,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.saleTypeNote}>
              Nota: se te descuenta en tu depósito.
            </Text>
            <View style={styles.sectionDivider} />
            <Text style={styles.label}>Fotos de los patines (hasta {MAX_PHOTOS})</Text>
            <Text style={styles.helperText}>
              Adjunta al menos 1 foto para continuar (hasta {MAX_PHOTOS}). Máximo 10
              MB y mínimo 500 px por lado.
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  fileInputRef.current?.click();
                  return;
                }
                launchImageLibrary(
                  {
                    mediaType: 'photo',
                    selectionLimit: 0,
                  },
                  (response) => {
                    if (response.didCancel || response.errorCode) {
                      return;
                    }
                    const assets = response.assets || [];
                    const selected = assets
                      .filter((asset) => {
                        if (!asset.uri) {
                          return false;
                        }
                        const tooBig =
                          typeof asset.fileSize === 'number' &&
                          asset.fileSize > MAX_PHOTO_BYTES;
                        const tooSmall =
                          typeof asset.width === 'number' &&
                          typeof asset.height === 'number' &&
                          (asset.width < MIN_DIMENSION || asset.height < MIN_DIMENSION);
                        return !tooBig && !tooSmall;
                      })
                      .map((asset) => ({
                        uri: asset.uri as string,
                        name: asset.fileName,
                      }));
                    if (selected.length < assets.length) {
                      appLog.warn('Fotos descartadas por tamaño o resolución', {
                        screen: 'MarketingSellSkatesStep3Screen',
                        context: {rejected: assets.length - selected.length},
                      });
                      Alert.alert(
                        'Marketing',
                        'Algunas fotos no cumplen el límite de 10 MB o 500 px.',
                      );
                    }
                    setPhotos((prev) => {
                      const merged = [...prev, ...selected];
                      return merged.slice(0, MAX_PHOTOS);
                    });
                  },
                );
              }}>
              <Text style={styles.uploadButtonText}>Adjuntar fotos</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              // @ts-ignore - input only exists on web
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{display: 'none'}}
                onChange={async (event) => {
                  const files = Array.from(event.target.files || []);
                  const validated = await Promise.all(
                    files.map(
                      (file) =>
                        new Promise<{ok: boolean; uri?: string; name?: string}>(
                          (resolve) => {
                            if (file.size > MAX_PHOTO_BYTES) {
                              resolve({ok: false});
                              return;
                            }
                            const img = new window.Image();
                            const url = URL.createObjectURL(file);
                            img.onload = () => {
                              const ok =
                                img.width >= MIN_DIMENSION &&
                                img.height >= MIN_DIMENSION;
                              resolve({ok, uri: url, name: file.name});
                            };
                            img.onerror = () => resolve({ok: false});
                            img.src = url;
                          },
                        ),
                    ),
                  );
                  const selected = validated
                    .filter((item) => item.ok && item.uri)
                    .map((item) => ({
                      uri: item.uri as string,
                      name: item.name,
                    }));
                  if (selected.length < files.length) {
                    appLog.warn('Fotos web descartadas por tamaño o resolución', {
                      screen: 'MarketingSellSkatesStep3Screen',
                      context: {rejected: files.length - selected.length},
                    });
                    Alert.alert(
                      'Marketing',
                      'Algunas fotos no cumplen el límite de 10 MB o 500 px.',
                    );
                  }
                  setPhotos((prev) => {
                    const merged = [...prev, ...selected];
                    return merged.slice(0, MAX_PHOTOS);
                  });
                }}
              />
            )}
            <View style={styles.photoRow}>
              {photos.length === 0 ? (
                <Text style={styles.helperText}>Aún no hay fotos adjuntas.</Text>
              ) : (
                photos.map((photo, index) => (
                  <View key={`${photo.uri}-${index}`} style={styles.photoThumb}>
                    <Image source={{uri: photo.uri}} style={styles.photoImage} />
                    <View style={styles.photoBadge}>
                      <Text style={styles.photoBadgeText}>{index + 1}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.photoDelete}
                      onPress={() =>
                        setPhotos((prev) => prev.filter((_, i) => i !== index))
                      }>
                      <Text style={styles.photoDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
            <Text style={styles.photoCount}>
              {photos.length} / {MAX_PHOTOS} fotos
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.nextButton,
              photos.length < MIN_PHOTOS_FOR_NEXT && styles.nextButtonDisabled,
            ]}
            onPress={() => {
              if (photos.length < MIN_PHOTOS_FOR_NEXT) {
                appLog.warn('Publicar venta: falta al menos una foto', {
                  screen: 'MarketingSellSkatesStep3Screen',
                });
                Alert.alert(
                  'Marketing',
                  'Adjunta al menos una foto del producto para continuar al paso 3.',
                );
                return;
              }
              const params = {
                category,
                brandModel,
                priceMx,
                photos,
                homeDelivery,
                deliveryFeeMx: homeDelivery ? DELIVERY_FEE_MXN : 0,
                saleType,
              };
              appLog.info('Publicar venta paso 2 → resumen/publicar', {
                screen: 'MarketingSellSkatesStep3Screen',
                context: {
                  category,
                  photoCount: photos.length,
                  saleType: saleType ?? 'unset',
                },
              });
              navigation.dispatch(StackActions.push('MarketingSellSkatesStep4', params));
            }}>
            <Text style={styles.nextButtonText}>Siguiente</Text>
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
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
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
  },
  label: {
    fontSize: 12,
    color: '#E2E8F0',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    fontSize: 13,
  },
  helperText: {
    fontSize: 12,
    color: '#CBD5F5',
    marginBottom: 10,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  conditionItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  conditionItemActive: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  conditionText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  conditionTextActive: {
    color: '#7DD3FC',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  sizeColumn: {
    flex: 1,
  },
  inputSmall: {
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
  saleTypeList: {
    gap: 8,
    marginBottom: 6,
  },
  saleTypeItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  saleTypeItemActive: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  saleTypeText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  saleTypeTextActive: {
    color: '#7DD3FC',
  },
  saleTypeNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  deliveryCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  deliveryCheckboxChecked: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  deliveryCheckmark: {
    color: '#7DD3FC',
    fontSize: 14,
    fontWeight: '800',
  },
  deliveryTextBlock: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  deliveryPrice: {
    fontSize: 12,
    color: '#7DD3FC',
    fontWeight: '700',
    marginTop: 2,
  },
  deliveryLegend: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 4,
  },
  deliveryLegendEmphasis: {
    color: '#CBD5F5',
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  uploadButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#7DD3FC',
    fontWeight: '700',
  },
  photoRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  photoDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
  },
  photoDeleteText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  photoCount: {
    marginTop: 6,
    fontSize: 11,
    color: '#94A3B8',
  },
  nextButton: {
    marginTop: 6,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  nextButtonText: {
    fontSize: 12,
    color: '#7DD3FC',
    fontWeight: '700',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  highlight: {
    color: '#7DD3FC',
    fontWeight: '700',
  },
});
