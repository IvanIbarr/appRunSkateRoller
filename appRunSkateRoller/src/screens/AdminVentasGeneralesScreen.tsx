import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import adminGateService from '../services/adminGateService';
import authService from '../services/authService';
import {loadMarketingSalesCatalog, type MarketingCatalogItem} from '../services/marketingCatalogService';
import recapSalesService from '../services/recapSalesService';
import {RECAP_PLAN_OPTIONS} from '../types/recapCheckout';

type Tab = 'marketing' | 'recap';

function mx(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString('es-MX', {style: 'currency', currency: 'MXN', maximumFractionDigits: 0});
}

function bar(count: number, max: number): string {
  if (max <= 0) {
    return '';
  }
  const width = 18;
  const n = Math.max(0, Math.min(width, Math.round((count / max) * width)));
  return '█'.repeat(n);
}

export const AdminVentasGeneralesScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [tab, setTab] = useState<Tab>('marketing');
  const [loading, setLoading] = useState(true);
  const [marketing, setMarketing] = useState<MarketingCatalogItem[]>([]);
  const [recapDaily, setRecapDaily] = useState<Array<{day: string; count: number; revenueMx: number}>>([]);
  const [recapTotals, setRecapTotals] = useState<Record<string, {count: number; revenueMx: number}>>({});

  const ensureAdmin = async (): Promise<boolean> => {
    const u = await authService.getCurrentUser();
    const isAdmin = u?.email === 'admin@roller.com';
    if (!isAdmin) {
      Alert.alert('Acceso denegado', 'Solo administración.');
      return false;
    }
    return await adminGateService.ensureUnlocked();
  };

  const load = async () => {
    if (!(await ensureAdmin())) {
      return;
    }
    setLoading(true);
    try {
      const sales = await loadMarketingSalesCatalog();
      setMarketing(sales);
      setRecapDaily(await recapSalesService.countsByDay(14));
      setRecapTotals(await recapSalesService.totalsByPlan());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const marketingStats = useMemo(() => {
    const count = marketing.length;
    const sumListingFees = marketing.reduce((acc, s) => acc + (Number(s.listingFeeMx) || 0), 0);
    const sumPrices = marketing.reduce((acc, s) => acc + (Number(s.priceMx) || 0), 0);
    const toDeposit = Math.max(0, sumPrices - sumListingFees);
    return {count, sumListingFees, sumPrices, toDeposit};
  }, [marketing]);

  const recapStats = useMemo(() => {
    const count = Object.values(recapTotals).reduce((acc, v) => acc + (v.count || 0), 0);
    const revenue = Object.values(recapTotals).reduce((acc, v) => acc + (v.revenueMx || 0), 0);
    const maxDaily = Math.max(0, ...recapDaily.map((d) => d.count));
    return {count, revenue, maxDaily};
  }, [recapTotals, recapDaily]);

  return (
    <WithBottomTabBar>
      <View style={styles.root}>
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/menu-fondo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.backgroundOverlay} />
        </View>
        <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}>
            <Text style={styles.title}>Ventas Generales (Admin)</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Cargando…' : tab === 'marketing' ? 'Marketing' : 'Recap'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => void load()}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {(['marketing', 'recap'] as const).map((t) => {
            const active = t === tab;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tabChip, active && styles.tabChipActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.85}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t === 'marketing' ? 'Marketing' : 'Recap'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'marketing' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumen Marketing</Text>
              <Text style={styles.line}>Publicaciones: {marketingStats.count}</Text>
              <Text style={styles.line}>Total listado (suma precios): {mx(marketingStats.sumPrices)}</Text>
              <Text style={styles.line}>Cuotas/fees (suma listingFeeMx): {mx(marketingStats.sumListingFees)}</Text>
              <Text style={styles.lineStrong}>A depositar (aprox): {mx(marketingStats.toDeposit)}</Text>
              <Text style={styles.note}>
                Nota: esto se calcula desde el catálogo de publicaciones. Para “ventas reales” necesitaríamos
                eventos de compra/pago en backend.
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumen Recap</Text>
              <Text style={styles.line}>Compras (demo) registradas: {recapStats.count}</Text>
              <Text style={styles.lineStrong}>Ingresos (demo): {mx(recapStats.revenue)}</Text>
              <Text style={styles.note}>
                Se registra cuando el usuario confirma “Compra (demo)” en el checkout.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Por plan</Text>
              {RECAP_PLAN_OPTIONS.map((p) => {
                const v = recapTotals[p.id] || {count: 0, revenueMx: 0};
                return (
                  <View key={p.id} style={styles.planRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.planName}>{p.title}</Text>
                      <Text style={styles.planMeta}>
                        {v.count} compras · {mx(v.revenueMx)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recap por día (últimos 14)</Text>
              {recapDaily.map((d) => (
                <View key={d.day} style={styles.dailyRow}>
                  <Text style={styles.day}>{d.day}</Text>
                  <Text style={styles.bar}>{bar(d.count, recapStats.maxDaily)}</Text>
                  <Text style={styles.count}>{d.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}
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
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 12, 24, 0.62)',
  },
  container: {padding: 18, paddingBottom: 26, zIndex: 1},
  headerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
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
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  refreshText: {color: '#E2E8F0', fontSize: 18, fontWeight: '900'},
  title: {color: '#E2E8F0', fontSize: 18, fontWeight: '900'},
  subtitle: {color: 'rgba(226,232,240,0.72)', fontSize: 12, marginTop: 2},
  tabsRow: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10},
  tabChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.34)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginRight: 10,
    marginBottom: 8,
  },
  tabChipActive: {backgroundColor: '#38BDF8', borderColor: '#38BDF8'},
  tabText: {fontSize: 12, fontWeight: '900', color: '#E0F2FE'},
  tabTextActive: {color: '#020617'},
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {color: '#E2E8F0', fontWeight: '900', marginBottom: 10},
  line: {color: 'rgba(226,232,240,0.82)', marginBottom: 6},
  lineStrong: {color: '#E2E8F0', fontWeight: '900', marginTop: 4},
  note: {color: 'rgba(226,232,240,0.6)', fontSize: 12, marginTop: 10, lineHeight: 16},
  planRow: {paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.12)'},
  planName: {color: '#E2E8F0', fontWeight: '900'},
  planMeta: {color: 'rgba(226,232,240,0.68)', fontSize: 12, marginTop: 2},
  dailyRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  day: {width: 92, color: 'rgba(226,232,240,0.78)', fontSize: 12},
  bar: {flex: 1, color: '#38BDF8', fontSize: 12},
  count: {width: 26, textAlign: 'right', color: '#E2E8F0', fontWeight: '900'},
});

