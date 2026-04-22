import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';
import {RECAP_PLAN_OPTIONS} from '../../types/recapCheckout';
import {SafeAreaView} from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RecapCheckoutPlan'>;

export const RecapCheckoutPlanScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver a Crear Recap</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Elegir plan</Text>
        <Text style={styles.sub}>
          Elige el plan que mejor se adapte a ti. En esta demo podrás avanzar hasta “Pago” sin cobro real.
        </Text>
        {RECAP_PLAN_OPTIONS.map((p) => (
          (() => {
            const extra =
              p.id === 'gratis0'
                ? [
                    '⏳ Prioridad estándar: tu video se procesa después de usuarios Plus (el tiempo varía según la actividad).',
                    '📣 Comunidad: incluye un breve anuncio o marca de agua para mantener el servicio gratuito.',
                    '🏷️ Sello RunSkateRoller: tu video incluye nuestra marca de agua oficial.',
                    '⏱️ Recuerdos rápidos: descarga tu video durante 15 días.',
                    '🖼️ Esencial: hasta 5 fotos por ruta.',
                  ]
                : p.id === 'pase25'
                  ? [
                      '✅ Calidad profesional sin compromisos: todo Premium en 1 solo video.',
                      '🔒 Sin marcas de agua: video HD.',
                      '⚡ Prioridad alta: saltas la fila de espera.',
                      '🖼️ Más recuerdos: hasta 15 fotos en este video.',
                    ]
                  : p.id === 'plus59'
                    ? [
                        '✅ Prioridad VIP: sin anuncios y con la mejor prioridad.',
                        '☁️ Videoteca en la nube: mientras tu plan esté activo.',
                        '🖼️ Sin límites de marca de agua y hasta 60 fotos por video.',
                        '📈 Estadísticas avanzadas: elevación y velocidad máxima (próximamente).',
                      ]
                    : p.id === 'plus479'
                      ? [
                          '✅ Todo lo Pro por ~ $40/mes.',
                          '🧭 Ideal para temporada: olvídate de pagos mensuales.',
                          '⭐ Soporte premium: acceso anticipado a nuevas funciones y mapas 3D (próximamente).',
                        ]
                      : [];
            return (
          <TouchableOpacity
            key={p.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('RecapCheckoutDatos', {
                draft: {planId: p.id, planTitle: p.title, amountMx: p.amountMx},
              })
            }
            activeOpacity={0.88}>
            <Text style={styles.cardTitle}>{p.title}</Text>
            <Text style={styles.cardSub}>{p.subtitle}</Text>
            {extra.length > 0 ? (
              <Text style={styles.cardRules}>{extra.join('\n')}</Text>
            ) : null}
            {p.amountMx === 0 ? (
              <View style={styles.freeCtaRow}>
                <View style={styles.freePill}>
                  <Text style={styles.freePillText}>$0</Text>
                </View>
                <View style={styles.freeBtn}>
                  <Text style={styles.freeBtnText}>Elegir gratis</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.price}>${p.amountMx} MXN</Text>
            )}
          </TouchableOpacity>
            );
          })()
        ))}
        <Text style={styles.footerNote}>
          Tip: en el plan gratis, cerca del límite de fotos puedes desbloquear 15 fotos con el Pase Único por $25.
        </Text>
        <Text style={styles.legal}>
          Las suscripciones se renuevan automáticamente. Puedes cancelar en cualquier momento desde el menú → Mis suscripciones.
        </Text>
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
  sub: {color: 'rgba(148, 163, 184, 0.95)', fontSize: 13, lineHeight: 18, marginBottom: 16},
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  cardTitle: {color: '#F8FAFC', fontSize: 17, fontWeight: '800'},
  cardSub: {color: 'rgba(203, 213, 225, 0.9)', fontSize: 13, marginTop: 4, lineHeight: 18},
  cardRules: {
    color: 'rgba(148, 163, 184, 0.95)',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  price: {color: 'rgba(56, 189, 248, 0.98)', fontSize: 18, fontWeight: '900', marginTop: 10},
  freeCtaRow: {flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10},
  freePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  freePillText: {color: '#E2E8F0', fontWeight: '900'},
  freeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    alignItems: 'center',
  },
  freeBtnText: {color: '#DCFCE7', fontWeight: '900'},
  footerNote: {
    marginTop: 10,
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  legal: {
    marginTop: 10,
    color: 'rgba(148, 163, 184, 0.75)',
    fontSize: 11,
    lineHeight: 15,
  },
});
