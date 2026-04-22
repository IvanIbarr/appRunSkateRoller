import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';
import type {FormaPagoCompra} from '../../types/marketingCheckout';
import type {RecapCheckoutDraft} from '../../types/recapCheckout';
import {SafeAreaView} from 'react-native-safe-area-context';
import {appLog} from '../../utils/clientLogger';
import recapSalesService from '../../services/recapSalesService';
import authService from '../../services/authService';
import subscriptionsService from '../../services/subscriptionsService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RecapCheckoutPago'>;
type R = RouteProp<RootStackParamList, 'RecapCheckoutPago'>;

const OPCIONES: {key: FormaPagoCompra; label: string; hint: string}[] = [
  {
    key: 'tarjeta',
    label: 'Tarjeta débito / crédito',
    hint: 'Integración de pasarela pendiente (demo).',
  },
  {
    key: 'transferencia',
    label: 'Transferencia bancaria',
    hint: 'En producción: datos CLABE / referencia.',
  },
  {
    key: 'efectivo_contra_entrega',
    label: 'Otro / manual',
    hint: 'Solo para completar el flujo de prueba.',
  },
];

export const RecapCheckoutPagoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const [draft] = useState<RecapCheckoutDraft>(route.params.draft);
  const [forma, setForma] = useState<FormaPagoCompra | undefined>(draft.formaPago);

  const confirmar = async () => {
    if (!forma) {
      Alert.alert('Forma de pago', 'Selecciona una opción.');
      return;
    }
    const finalDraft: RecapCheckoutDraft = {...draft, formaPago: forma};
    appLog.info('Recap checkout: pedido demo confirmado (sin pago real)', {
      screen: 'RecapCheckoutPagoScreen',
      context: {
        planId: finalDraft.planId,
        amountMx: finalDraft.amountMx,
        formaPago: forma,
        buyerEmail: finalDraft.buyerEmail,
      },
    });
    try {
      await recapSalesService.addFromDraft(finalDraft);
    } catch {
      // no bloquear el flujo demo si no se puede persistir
    }
    try {
      const me = await authService.getCurrentUser();
      if (me?.id && me.email) {
        await subscriptionsService.setActive(me.id, me.email, {
          planId: finalDraft.planId,
          planTitle: finalDraft.planTitle,
          amountMx: finalDraft.amountMx,
        });
      }
    } catch {
      // ignore
    }
    Alert.alert(
      'Compra demo completada',
      `Plan: ${finalDraft.planTitle}\nTotal: $${finalDraft.amountMx} MXN\nForma: ${forma}\n\nNo se ha cobrado nada. En producción aquí iría la pasarela (Stripe/Conekta, etc.).`,
      [
        {
          text: 'Listo',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.pop(4);
            } else {
              navigation.navigate('CrearRecap');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Forma de pago</Text>
        <Text style={styles.product}>{draft.planTitle}</Text>
        <Text style={styles.price}>${draft.amountMx} MXN</Text>
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
                <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{label}</Text>
                <Text style={styles.optionHint}>{hint}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
          <Text style={styles.confirmBtnText}>Confirmar compra (demo)</Text>
        </TouchableOpacity>
        {Platform.OS === 'web' ? (
          <Text style={styles.hintWeb}>
            Tras confirmar, volverás a Crear Recap. Revisa la consola del navegador (F12) para el log del
            pedido demo.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#0F172A'},
  scroll: {padding: 18, paddingBottom: 32},
  back: {marginBottom: 12, alignSelf: 'flex-start'},
  backText: {color: 'rgba(56, 189, 248, 0.95)', fontWeight: '700', fontSize: 14},
  title: {color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 8},
  product: {color: 'rgba(226, 232, 240, 0.92)', fontSize: 16, fontWeight: '700'},
  price: {color: 'rgba(56, 189, 248, 0.98)', fontSize: 20, fontWeight: '900', marginBottom: 16},
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    marginBottom: 10,
    gap: 12,
  },
  optionActive: {
    borderColor: 'rgba(56, 189, 248, 0.55)',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#38BDF8'},
  optionTextWrap: {flex: 1},
  optionTitle: {color: '#E2E8F0', fontSize: 15, fontWeight: '700'},
  optionTitleActive: {color: '#F8FAFC'},
  optionHint: {color: 'rgba(148, 163, 184, 0.9)', fontSize: 12, marginTop: 4, lineHeight: 16},
  confirmBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    alignItems: 'center',
  },
  confirmBtnText: {color: '#DCFCE7', fontWeight: '900', fontSize: 15},
  hintWeb: {color: 'rgba(148, 163, 184, 0.85)', fontSize: 12, marginTop: 14, lineHeight: 17},
});
