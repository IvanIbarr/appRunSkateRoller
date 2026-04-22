import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {
  FormaPagoCompra,
  MarketingCheckoutDraft,
} from '../types/marketingCheckout';
import {SafeAreaView} from 'react-native-safe-area-context';
import {appLog} from '../utils/clientLogger';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MarketingComprarPago'>;
type R = RouteProp<RootStackParamList, 'MarketingComprarPago'>;

const OPCIONES: {key: FormaPagoCompra; label: string; hint: string}[] = [
  {
    key: 'tarjeta',
    label: 'Tarjeta débito / crédito',
    hint: 'Pago en línea (integración pendiente en producción).',
  },
  {
    key: 'transferencia',
    label: 'Transferencia bancaria',
    hint: 'Recibirás datos para transferir al confirmar el pedido real.',
  },
  {
    key: 'efectivo_contra_entrega',
    label: 'Efectivo contra entrega',
    hint: 'Acuerdas pago al recibir con el repartidor o punto de entrega.',
  },
];

export const MarketingComprarPagoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const [draft] = useState<MarketingCheckoutDraft>(route.params.draft);
  const [forma, setForma] = useState<FormaPagoCompra | undefined>(
    draft.formaPago,
  );

  const confirmar = () => {
    if (!forma) {
      appLog.warn('Checkout pago: sin forma de pago', {
        screen: 'MarketingComprarPagoScreen',
      });
      Alert.alert('Forma de pago', 'Selecciona una opción.');
      return;
    }
    const finalDraft: MarketingCheckoutDraft = {...draft, formaPago: forma};
    appLog.info('Pedido demo confirmado (sin pago real)', {
      screen: 'MarketingComprarPagoScreen',
      context: {formaPago: forma, saleId: finalDraft.saleId},
    });
    Alert.alert(
      'Pedido registrado (demo)',
      'En producción aquí se procesaría el pago y se notificaría al vendedor. Tus datos de envío quedaron listos en el flujo de prueba.',
      [
        {
          text: 'Volver a Marketing',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.pop(3);
            } else {
              navigation.navigate('Marketing');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Atrás</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Forma de pago</Text>
      <Text style={styles.product}>{draft.brandModel}</Text>
      {draft.priceMx ? (
        <Text style={styles.price}>${draft.priceMx} MXN</Text>
      ) : null}

      {OPCIONES.map(({key, label, hint}) => {
        const active = forma === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => setForma(key)}
            activeOpacity={0.85}>
            <View style={styles.radioOuter}>{active ? <View style={styles.radioInner} /> : null}</View>
            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                {label}
              </Text>
              <Text style={styles.optionHint}>{hint}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
        <Text style={styles.confirmBtnText}>Confirmar pedido</Text>
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
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  product: {
    fontSize: 15,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    color: '#7DD3FC',
    fontWeight: '800',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    marginBottom: 12,
  },
  optionActive: {
    borderColor: 'rgba(56, 189, 248, 0.55)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#38BDF8',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5F5',
    marginBottom: 4,
  },
  optionTitleActive: {
    color: '#F0F9FF',
  },
  optionHint: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  confirmBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#BBF7D0',
    fontWeight: '800',
    fontSize: 16,
  },
});
