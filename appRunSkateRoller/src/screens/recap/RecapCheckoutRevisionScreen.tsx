import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';
import type {RecapCheckoutDraft} from '../../types/recapCheckout';
import {SafeAreaView} from 'react-native-safe-area-context';
import {appLog} from '../../utils/clientLogger';
import authService from '../../services/authService';
import subscriptionsService from '../../services/subscriptionsService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RecapCheckoutRevision'>;
type R = RouteProp<RootStackParamList, 'RecapCheckoutRevision'>;

function Row({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

export const RecapCheckoutRevisionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const d: RecapCheckoutDraft = route.params.draft;
  const isFree = Number(d.amountMx) === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Corregir datos</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Revisar compra</Text>
        <Text style={styles.sub}>
          {isFree ? 'Plan gratis: no se requiere pago.' : 'Demo: sin cargo real al confirmar en el siguiente paso.'}
        </Text>
        <Text style={styles.section}>Plan</Text>
        <Row label="Producto" value={d.planTitle} />
        <Row label="Importe" value={`$${d.amountMx} MXN`} />
        <Text style={styles.section}>Titular</Text>
        <Row label="Nombre" value={d.buyerName || ''} />
        <Row label="Correo" value={d.buyerEmail || ''} />
        <Row label="Teléfono" value={d.buyerPhone || ''} />
        <TouchableOpacity
          style={styles.primary}
          onPress={() => {
            if (isFree) {
              appLog.info('Recap checkout: finaliza plan gratis', {screen: 'RecapCheckoutRevision', planId: d.planId});
              (async () => {
                try {
                  const me = await authService.getCurrentUser();
                  if (me?.id && me.email) {
                    await subscriptionsService.setActive(me.id, me.email, {
                      planId: d.planId,
                      planTitle: d.planTitle,
                      amountMx: d.amountMx,
                    });
                  }
                } catch {
                  // ignore
                }
              })();
              Alert.alert('Listo', 'Plan gratis activado (demo).', [
                {
                  text: 'Volver',
                  onPress: () => {
                    if (navigation.canGoBack()) {
                      navigation.pop(3);
                    } else {
                      navigation.navigate('CrearRecap');
                    }
                  },
                },
              ]);
              return;
            }
            appLog.info('Recap checkout: a pago', {screen: 'RecapCheckoutRevision', planId: d.planId});
            navigation.navigate('RecapCheckoutPago', {draft: d});
          }}>
          <Text style={styles.primaryText}>{isFree ? 'Finalizar' : 'Siguiente · Forma de pago'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#020617'},
  scroll: {padding: 18, paddingBottom: 32},
  back: {marginBottom: 12, alignSelf: 'flex-start'},
  backText: {color: 'rgba(56, 189, 248, 0.95)', fontWeight: '700', fontSize: 14},
  title: {color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 6},
  sub: {color: 'rgba(148, 163, 184, 0.95)', fontSize: 13, marginBottom: 18},
  section: {
    color: 'rgba(56, 189, 248, 0.95)',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  row: {marginBottom: 10},
  rowLabel: {color: 'rgba(148, 163, 184, 0.9)', fontSize: 12, marginBottom: 2},
  rowValue: {color: '#F8FAFC', fontSize: 15, fontWeight: '600'},
  primary: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    alignItems: 'center',
  },
  primaryText: {color: '#E0F2FE', fontWeight: '900', fontSize: 15},
});
