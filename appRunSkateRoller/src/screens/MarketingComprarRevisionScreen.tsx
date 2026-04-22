import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {MarketingCheckoutDraft} from '../types/marketingCheckout';
import {SafeAreaView} from 'react-native-safe-area-context';
import {appLog} from '../utils/clientLogger';

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  'MarketingComprarRevision'
>;
type R = RouteProp<RootStackParamList, 'MarketingComprarRevision'>;

const tipoLabel: Record<string, string> = {
  residencial: 'Residencial',
  deposito: 'Depósito',
  oficina: 'Oficina',
  empresa: 'Empresa',
};

function Row({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

export const MarketingComprarRevisionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const d: MarketingCheckoutDraft = route.params.draft;

  const dirCompleta = [
    d.calle,
    d.numero,
    d.colonia,
    d.localidad,
    d.municipio,
    d.estado,
    d.codigoPostal,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Corregir datos</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Revisar pedido</Text>
      <Text style={styles.subtitle}>
        Verifica que la información de entrega y contacto sea correcta.
      </Text>

      <Text style={styles.section}>Producto</Text>
      <Row label="Artículo" value={d.brandModel} />
      <Row label="Precio" value={d.priceMx ? `$${d.priceMx} MXN` : '—'} />

      <Text style={styles.section}>Entrega</Text>
      <Row label="Dirección" value={dirCompleta} />
      {d.numeroExteriorDepto ? (
        <Row label="Interior / depto." value={d.numeroExteriorDepto} />
      ) : null}
      {d.indicaciones ? (
        <Row label="Indicaciones" value={d.indicaciones} />
      ) : null}
      <Row
        label="Tipo de domicilio"
        value={d.tipoDomicilio ? tipoLabel[d.tipoDomicilio] || d.tipoDomicilio : '—'}
      />
      {d.usoUbicacionGps ? (
        <Text style={styles.gpsNote}>
          Ubicación GPS usada como ayuda; confirma calle y CP.
        </Text>
      ) : null}

      <Text style={styles.section}>Contacto</Text>
      <Row label="Nombre" value={d.contactoNombre || ''} />
      <Row label="Teléfono" value={d.contactoTelefono || ''} />

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => {
          appLog.info('Checkout: de revisión a forma de pago', {
            screen: 'MarketingComprarRevisionScreen',
            context: {saleId: d.saleId},
          });
          navigation.navigate('MarketingComprarPago', {draft: d});
        }}>
        <Text style={styles.primaryBtnText}>Siguiente · Forma de pago</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
    marginBottom: 20,
  },
  section: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7DD3FC',
    marginTop: 18,
    marginBottom: 10,
  },
  row: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 15,
    color: '#F1F5F9',
    lineHeight: 21,
  },
  gpsNote: {
    fontSize: 12,
    color: '#A5B4FC',
    marginTop: 4,
    marginBottom: 4,
  },
  primaryBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.55)',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#F0F9FF',
    fontWeight: '800',
    fontSize: 15,
  },
});
