import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {
  MarketingCheckoutDraft,
  TipoDomicilioCompra,
} from '../types/marketingCheckout';
import {lookupMexicanPostalCode} from '../services/mexicoPostalCodeService';
import {
  getCurrentPositionCoords,
  reverseGeocodeMexico,
} from '../services/reverseGeocodeService';
import {SafeAreaView} from 'react-native-safe-area-context';
import {appLog} from '../utils/clientLogger';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MarketingComprarEnvio'>;
type R = RouteProp<RootStackParamList, 'MarketingComprarEnvio'>;

const TIPOS_DOMICILIO: {key: TipoDomicilioCompra; label: string}[] = [
  {key: 'residencial', label: 'Residencial'},
  {key: 'deposito', label: 'Depósito'},
  {key: 'oficina', label: 'Oficina'},
  {key: 'empresa', label: 'Empresa'},
];

export const MarketingComprarEnvioScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const base = route.params?.draft;

  const [draft, setDraft] = useState<MarketingCheckoutDraft>(() => ({
    saleId: base?.saleId || '',
    brandModel: base?.brandModel || '',
    priceMx: base?.priceMx,
    photoUri: base?.photoUri,
    ownerUserId: base?.ownerUserId,
    calle: base?.calle || '',
    numero: base?.numero || '',
    codigoPostal: base?.codigoPostal || '',
    estado: base?.estado || '',
    municipio: base?.municipio || '',
    localidad: base?.localidad || '',
    colonia: base?.colonia || '',
    coloniasOpciones: base?.coloniasOpciones || [],
    numeroExteriorDepto: base?.numeroExteriorDepto || '',
    indicaciones: base?.indicaciones || '',
    tipoDomicilio: base?.tipoDomicilio,
    contactoNombre: base?.contactoNombre || '',
    contactoTelefono: base?.contactoTelefono || '',
    usoUbicacionGps: base?.usoUbicacionGps,
  }));

  const [cpLoading, setCpLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coloniaModal, setColoniaModal] = useState(false);

  const applyPostalLookup = useCallback(async (cpRaw: string) => {
    const digits = cpRaw.replace(/\D/g, '').slice(0, 5);
    if (digits.length !== 5) {
      return;
    }
    setCpLoading(true);
    try {
      const r = await lookupMexicanPostalCode(digits);
      if (r) {
        setDraft((d) => ({
          ...d,
          codigoPostal: digits,
          estado: r.estado || d.estado,
          municipio: r.municipio || d.municipio,
          localidad: r.localidad || d.localidad,
          coloniasOpciones: r.colonias,
          colonia: r.colonias.length === 1 ? r.colonias[0] : d.colonia,
        }));
      }
    } finally {
      setCpLoading(false);
    }
  }, []);

  const onUsarUbicacion = async () => {
    setGpsLoading(true);
    try {
      const coords = await getCurrentPositionCoords();
      if (!coords) {
        appLog.warn('Checkout envío: GPS sin coordenadas', {
          screen: 'MarketingComprarEnvioScreen',
        });
        Alert.alert(
          'Ubicación',
          'No se pudo obtener tu ubicación. Activa el GPS y los permisos, o llena el formulario manualmente.',
        );
        return;
      }
      const rev = await reverseGeocodeMexico(coords.lat, coords.lon);
      if (!rev) {
        appLog.warn('Checkout envío: geocodificación inversa sin resultado', {
          screen: 'MarketingComprarEnvioScreen',
        });
        Alert.alert(
          'Ubicación',
          'No se pudo interpretar la dirección. Ingresa calle y código postal manualmente.',
        );
        return;
      }
      setDraft((d) => ({
        ...d,
        usoUbicacionGps: true,
        calle: rev.calle || d.calle,
        numero: rev.numero || d.numero,
        codigoPostal: rev.codigoPostal || d.codigoPostal,
        estado: rev.estado || d.estado,
        municipio: rev.municipio || d.municipio,
        localidad: rev.localidad || d.localidad,
        colonia: rev.colonia || d.colonia,
      }));
      if (rev.codigoPostal && rev.codigoPostal.length === 5) {
        await applyPostalLookup(rev.codigoPostal);
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const validarYContinuar = () => {
    const t = (s: string) => s.trim();
    if (!t(draft.calle || '')) {
      appLog.warn('Checkout envío: falta calle', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Indica la calle.');
      return;
    }
    if (!t(draft.numero || '')) {
      appLog.warn('Checkout envío: falta número', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Indica el número.');
      return;
    }
    const cp = (draft.codigoPostal || '').replace(/\D/g, '');
    if (cp.length !== 5) {
      appLog.warn('Checkout envío: CP inválido', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Código postal debe tener 5 dígitos.');
      return;
    }
    if (!t(draft.estado || '')) {
      appLog.warn('Checkout envío: falta estado', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Indica el estado.');
      return;
    }
    if (!t(draft.municipio || '')) {
      appLog.warn('Checkout envío: falta municipio', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Indica el municipio / alcaldía.');
      return;
    }
    if (!t(draft.localidad || '')) {
      appLog.warn('Checkout envío: falta localidad', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Indica la localidad / ciudad.');
      return;
    }
    if (!t(draft.colonia || '')) {
      appLog.warn('Checkout envío: falta colonia', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Selecciona o escribe la colonia.');
      return;
    }
    if (!draft.tipoDomicilio) {
      appLog.warn('Checkout envío: falta tipo de domicilio', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Elige el tipo de domicilio.');
      return;
    }
    if (!t(draft.contactoNombre || '')) {
      appLog.warn('Checkout envío: falta nombre de contacto', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Nombre completo del contacto.');
      return;
    }
    const tel = (draft.contactoTelefono || '').replace(/\D/g, '');
    if (tel.length < 10) {
      appLog.warn('Checkout envío: teléfono corto', {
        screen: 'MarketingComprarEnvioScreen',
      });
      Alert.alert('Datos incompletos', 'Teléfono de al menos 10 dígitos.');
      return;
    }
    appLog.info('Checkout envío: datos listos para revisión', {
      screen: 'MarketingComprarEnvioScreen',
      context: {saleId: draft.saleId},
    });
    navigation.navigate('MarketingComprarRevision', {
      draft: {
        ...draft,
        codigoPostal: cp,
        contactoTelefono: tel,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Comprar · Entrega</Text>
        <Text style={styles.productLine} numberOfLines={2}>
          {draft.brandModel}
        </Text>
        {draft.priceMx ? (
          <Text style={styles.priceLine}>${draft.priceMx} MXN</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Dirección de entrega</Text>
        <View style={styles.rowGps}>
          <TouchableOpacity
            style={[styles.gpsBtn, gpsLoading && styles.btnDisabled]}
            onPress={() => void onUsarUbicacion()}
            disabled={gpsLoading}>
            {gpsLoading ? (
              <ActivityIndicator color="#7DD3FC" />
            ) : (
              <Text style={styles.gpsBtnText}>📍 Usar mi ubicación</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.gpsHint}>
            O llena el formulario. El código postal completa estado, municipio y
            opciones de colonia cuando hay datos disponibles.
          </Text>
        </View>

        <Text style={styles.label}>Calle</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la calle"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.calle}
          onChangeText={(calle) => setDraft((d) => ({...d, calle}))}
        />

        <Text style={styles.label}>Número</Text>
        <TextInput
          style={styles.input}
          placeholder="Número exterior"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.numero}
          onChangeText={(numero) => setDraft((d) => ({...d, numero}))}
        />

        <Text style={styles.label}>Código postal</Text>
        <View style={styles.cpRow}>
          <TextInput
            style={[styles.input, styles.cpInput]}
            placeholder="5 dígitos"
            placeholderTextColor="rgba(203, 213, 245, 0.5)"
            keyboardType="numeric"
            maxLength={5}
            value={draft.codigoPostal}
            onChangeText={(t) =>
              setDraft((d) => ({...d, codigoPostal: t.replace(/\D/g, '').slice(0, 5)}))
            }
            onBlur={() => void applyPostalLookup(draft.codigoPostal || '')}
          />
          {cpLoading ? <ActivityIndicator style={styles.cpSpinner} color="#7DD3FC" /> : null}
        </View>

        <Text style={styles.label}>Estado</Text>
        <TextInput
          style={styles.input}
          placeholder="Estado"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.estado}
          onChangeText={(estado) => setDraft((d) => ({...d, estado}))}
        />

        <Text style={styles.label}>Municipio / alcaldía</Text>
        <TextInput
          style={styles.input}
          placeholder="Municipio o alcaldía"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.municipio}
          onChangeText={(municipio) => setDraft((d) => ({...d, municipio}))}
        />

        <Text style={styles.label}>Localidad / ciudad</Text>
        <TextInput
          style={styles.input}
          placeholder="Localidad o ciudad"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.localidad}
          onChangeText={(localidad) => setDraft((d) => ({...d, localidad}))}
        />

        <Text style={styles.label}>Colonia</Text>
        {(draft.coloniasOpciones?.length || 0) > 0 ? (
          <TouchableOpacity
            style={styles.inputLike}
            onPress={() => setColoniaModal(true)}>
            <Text
              style={
                draft.colonia
                  ? styles.inputLikeText
                  : styles.inputLikePlaceholder
              }>
              {draft.colonia || 'Toca para elegir de la lista del código postal'}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TextInput
          style={[
            styles.input,
            {marginTop: (draft.coloniasOpciones?.length || 0) > 0 ? 8 : 0},
          ]}
          placeholder="Escribe o ajusta la colonia"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.colonia}
          onChangeText={(colonia) => setDraft((d) => ({...d, colonia}))}
        />

        <Text style={styles.label}>Núm. exterior / interior o depto. (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 12-B, Int. 4, Depto. 502"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.numeroExteriorDepto}
          onChangeText={(numeroExteriorDepto) =>
            setDraft((d) => ({...d, numeroExteriorDepto}))
          }
        />

        <Text style={styles.label}>Indicaciones para encontrar (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Portón azul, frente a parque…"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          multiline
          value={draft.indicaciones}
          onChangeText={(indicaciones) => setDraft((d) => ({...d, indicaciones}))}
        />

        <Text style={styles.sectionTitle}>Tipo de domicilio</Text>
        <View style={styles.chipsRow}>
          {TIPOS_DOMICILIO.map(({key, label}) => {
            const active = draft.tipoDomicilio === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDraft((d) => ({...d, tipoDomicilio: key}))}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Datos de contacto</Text>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Quien recibe el envío"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          value={draft.contactoNombre}
          onChangeText={(contactoNombre) =>
            setDraft((d) => ({...d, contactoNombre}))
          }
        />
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="10 dígitos mínimo"
          placeholderTextColor="rgba(203, 213, 245, 0.5)"
          keyboardType="phone-pad"
          value={draft.contactoTelefono}
          onChangeText={(contactoTelefono) =>
            setDraft((d) => ({...d, contactoTelefono}))
          }
        />

        <TouchableOpacity style={styles.continueBtn} onPress={validarYContinuar}>
          <Text style={styles.continueBtnText}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={coloniaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setColoniaModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Elige colonia</Text>
            <ScrollView style={styles.modalList}>
              {(draft.coloniasOpciones || []).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.modalItem}
                  onPress={() => {
                    setDraft((d) => ({...d, colonia: c}));
                    setColoniaModal(false);
                  }}>
                  <Text style={styles.modalItemText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setColoniaModal(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
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
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  productLine: {
    fontSize: 15,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  priceLine: {
    fontSize: 17,
    color: '#7DD3FC',
    fontWeight: '800',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 10,
  },
  rowGps: {
    marginBottom: 12,
  },
  gpsBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  gpsBtnText: {
    color: '#7DD3FC',
    fontWeight: '700',
    fontSize: 14,
  },
  gpsHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  label: {
    fontSize: 12,
    color: '#CBD5F5',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    fontSize: 14,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  cpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cpInput: {
    flex: 1,
  },
  cpSpinner: {
    marginRight: 8,
  },
  inputLike: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  inputLikeText: {
    color: '#F8FAFC',
    fontSize: 14,
  },
  inputLikePlaceholder: {
    color: 'rgba(203, 213, 245, 0.45)',
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  chipActive: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#E0F2FE',
  },
  continueBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.55)',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#F0F9FF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 320,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalItemText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  modalClose: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCloseText: {
    color: '#7DD3FC',
    fontWeight: '700',
  },
});
