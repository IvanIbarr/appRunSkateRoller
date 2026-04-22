import React, {useEffect, useState} from 'react';
import {Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import authService from '../services/authService';
import subscriptionsService, {UserSubscription} from '../services/subscriptionsService';

export const MySubscriptionsScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const me = await authService.getCurrentUser();
      if (!me?.email || !me.id) {
        setSub(null);
        return;
      }
      setSub(await subscriptionsService.get(me.id, me.email));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cancel = async () => {
    const me = await authService.getCurrentUser();
    if (!me?.email || !me.id) {
      return;
    }
    Alert.alert(
      'Cancelar renovación',
      'Tu suscripción se marcará como cancelada (MVP local). Puedes reactivarla al comprar de nuevo.',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await subscriptionsService.cancel(me.id, me.email);
            await load();
          },
        },
      ],
    );
  };

  return (
    <WithBottomTabBar>
      <View style={styles.root}>
        <View style={styles.backgroundImageContainer}>
          <Image source={require('../../assets/menu-fondo.jpeg')} style={styles.backgroundImage} resizeMode="cover" />
          <View style={styles.backgroundOverlay} />
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Mis suscripciones</Text>
          </View>

          <View style={styles.card}>
            {loading ? (
              <Text style={styles.meta}>Cargando…</Text>
            ) : !sub ? (
              <Text style={styles.meta}>No tienes una suscripción registrada en este dispositivo.</Text>
            ) : (
              <>
                <Text style={styles.planTitle}>{sub.planTitle}</Text>
                <Text style={styles.meta}>Estado: {sub.status === 'active' ? 'Activa' : 'Cancelada'}</Text>
                <Text style={styles.meta}>Renovación automática: {sub.autoRenew ? 'Sí' : 'No'}</Text>
                <Text style={styles.meta}>Inicio: {sub.startedAt.slice(0, 10)}</Text>

                {sub.autoRenew && sub.status === 'active' ? (
                  <TouchableOpacity style={styles.cancelBtn} onPress={cancel} activeOpacity={0.9}>
                    <Text style={styles.cancelText}>Cancelar renovación</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>

          <Text style={styles.legal}>
            Las suscripciones se renuevan automáticamente. Puedes cancelar en cualquier momento desde Ajustes → Mis suscripciones (en el menú).
          </Text>
        </ScrollView>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, position: 'relative'},
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 0,
  },
  backgroundImage: {width: '100%', height: '100%'},
  backgroundOverlay: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 12, 24, 0.62)'},
  container: {padding: 18, paddingBottom: 26, zIndex: 1},
  headerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backText: {color: '#E2E8F0', fontSize: 18, fontWeight: '900'},
  title: {color: '#E2E8F0', fontSize: 18, fontWeight: '900'},
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 14,
    padding: 12,
  },
  planTitle: {color: '#E2E8F0', fontWeight: '900', fontSize: 16, marginBottom: 6},
  meta: {color: 'rgba(226,232,240,0.78)', marginTop: 6},
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.34)',
    alignItems: 'center',
  },
  cancelText: {color: '#FEE2E2', fontWeight: '900'},
  legal: {color: 'rgba(226,232,240,0.65)', fontSize: 12, marginTop: 12, lineHeight: 16},
});

