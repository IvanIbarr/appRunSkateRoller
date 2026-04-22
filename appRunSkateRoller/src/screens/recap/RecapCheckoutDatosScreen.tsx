import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';
import type {RecapCheckoutDraft} from '../../types/recapCheckout';
import {SafeAreaView} from 'react-native-safe-area-context';
import {appLog} from '../../utils/clientLogger';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RecapCheckoutDatos'>;
type R = RouteProp<RootStackParamList, 'RecapCheckoutDatos'>;

const DEMO = {
  buyerName: 'Ana López Demo',
  buyerEmail: 'ana.recap.demo@ejemplo.com',
  buyerPhone: '5512345678',
};

export const RecapCheckoutDatosScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const base = route.params.draft;
  const [buyerName, setBuyerName] = useState(base.buyerName ?? '');
  const [buyerEmail, setBuyerEmail] = useState(base.buyerEmail ?? '');
  const [buyerPhone, setBuyerPhone] = useState(base.buyerPhone ?? '');

  const fillDemo = () => {
    setBuyerName(DEMO.buyerName);
    setBuyerEmail(DEMO.buyerEmail);
    setBuyerPhone(DEMO.buyerPhone);
  };

  const next = () => {
    const n = buyerName.trim();
    const e = buyerEmail.trim();
    const t = buyerPhone.trim();
    if (!n || !e || !t) {
      Alert.alert('Datos incompletos', 'Completa nombre, correo y teléfono o usa «Llenar con datos de prueba».');
      return;
    }
    const draft: RecapCheckoutDraft = {
      ...base,
      buyerName: n,
      buyerEmail: e,
      buyerPhone: t,
    };
    appLog.info('Recap checkout: datos listos', {screen: 'RecapCheckoutDatos', planId: draft.planId});
    navigation.navigate('RecapCheckoutRevision', {draft});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Cambiar plan</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tus datos</Text>
        <Text style={styles.planLine}>
          {base.planTitle} · ${base.amountMx} MXN
        </Text>
        <TouchableOpacity style={styles.demoBtn} onPress={fillDemo}>
          <Text style={styles.demoBtnText}>Llenar con datos de prueba</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          value={buyerName}
          onChangeText={setBuyerName}
          placeholder="Nombre"
          placeholderTextColor="#64748b"
          autoCapitalize="words"
        />
        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={buyerEmail}
          onChangeText={setBuyerEmail}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Teléfono (10 dígitos)</Text>
        <TextInput
          style={styles.input}
          value={buyerPhone}
          onChangeText={setBuyerPhone}
          placeholder="5512345678"
          placeholderTextColor="#64748b"
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
        />
        <TouchableOpacity style={styles.primary} onPress={next}>
          <Text style={styles.primaryText}>Siguiente · Revisar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#020617'},
  scroll: {padding: 18, paddingBottom: 40},
  back: {marginBottom: 12, alignSelf: 'flex-start'},
  backText: {color: 'rgba(56, 189, 248, 0.95)', fontWeight: '700', fontSize: 14},
  title: {color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 6},
  planLine: {color: 'rgba(148, 163, 184, 0.95)', fontSize: 14, marginBottom: 14},
  demoBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    marginBottom: 18,
  },
  demoBtnText: {color: '#FDE68A', fontWeight: '800', fontSize: 13},
  label: {color: 'rgba(226, 232, 240, 0.88)', fontSize: 12, fontWeight: '700', marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    marginBottom: 14,
  },
  primary: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    alignItems: 'center',
  },
  primaryText: {color: '#E0F2FE', fontWeight: '900', fontSize: 15},
});
