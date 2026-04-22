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
import supportService from '../services/supportService';
import authService from '../services/authService';
import type {SupportTicket, SupportTicketStatus} from '../types/supportTicket';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString('es-ES', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
}

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  nuevo: 'Nuevo',
  visto: 'Visto',
  resuelto: 'Resuelto',
};

export const AdminBuzonScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SupportTicketStatus | 'todos'>('todos');

  const load = async () => {
    setLoading(true);
    try {
      const list = await supportService.listTickets();
      setTickets(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'todos') {
      return tickets;
    }
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const ensureAdmin = async (): Promise<boolean> => {
    const user = await authService.getCurrentUser();
    const isAdmin = user?.email === 'admin@roller.com';
    if (!isAdmin) {
      Alert.alert('Acceso denegado', 'Esta sección es solo para administración.');
      return false;
    }
    return true;
  };

  const setStatus = async (id: string, status: SupportTicketStatus) => {
    if (!(await ensureAdmin())) {
      return;
    }
    await supportService.updateStatus(id, status);
    await load();
  };

  const remove = async (id: string) => {
    if (!(await ensureAdmin())) {
      return;
    }
    Alert.alert('Eliminar ticket', '¿Deseas eliminar este ticket del buzón?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supportService.deleteTicket(id);
          await load();
        },
      },
    ]);
  };

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
            <Text style={styles.title}>Buzón (Admin)</Text>
            <Text style={styles.subtitle}>
              Tickets de ayuda enviados por usuarios (MVP local).
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => void load()}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {(['todos', 'nuevo', 'visto', 'resuelto'] as const).map((k) => {
            const active = filter === k;
            const label = k === 'todos' ? 'Todos' : STATUS_LABEL[k];
            return (
              <TouchableOpacity
                key={k}
                onPress={() => setFilter(k)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.85}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Cargando…</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No hay tickets.</Text>
        ) : (
          filtered.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {t.title}
                </Text>
                <View style={[styles.badge, styles[`badge_${t.status}`]]}>
                  <Text style={styles.badgeText}>{STATUS_LABEL[t.status]}</Text>
                </View>
              </View>

              <Text style={styles.meta}>
                {formatDate(t.createdAt)} · Área: {t.area}
              </Text>
              {!!t.fromEmail && <Text style={styles.meta}>De: {t.fromEmail}</Text>}

              <Text style={styles.desc}>{t.description}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={() => void setStatus(t.id, 'visto')}>
                  <Text style={styles.actionBtnText}>Marcar visto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGreen]}
                  onPress={() => void setStatus(t.id, 'resuelto')}>
                  <Text style={styles.actionBtnText}>Resolver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnRed]}
                  onPress={() => remove(t.id)}>
                  <Text style={styles.actionBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  container: {
    padding: 18,
    paddingBottom: 26,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
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
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10},
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.34)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {backgroundColor: '#38BDF8', borderColor: '#38BDF8'},
  filterChipText: {fontSize: 12, fontWeight: '900', color: '#E0F2FE'},
  filterChipTextActive: {color: '#020617'},
  emptyText: {color: 'rgba(226,232,240,0.78)', marginTop: 14},
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardTop: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  cardTitle: {color: '#E2E8F0', fontSize: 14, fontWeight: '900', flex: 1},
  meta: {color: 'rgba(226,232,240,0.68)', fontSize: 12, marginTop: 6},
  desc: {color: '#E2E8F0', marginTop: 10, lineHeight: 18},
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badge_nuevo: {backgroundColor: 'rgba(251, 191, 36, 0.18)', borderColor: 'rgba(251, 191, 36, 0.38)'},
  badge_visto: {backgroundColor: 'rgba(59, 130, 246, 0.16)', borderColor: 'rgba(59, 130, 246, 0.34)'},
  badge_resuelto: {backgroundColor: 'rgba(34, 197, 94, 0.16)', borderColor: 'rgba(34, 197, 94, 0.34)'},
  badgeText: {color: '#E2E8F0', fontSize: 12, fontWeight: '900'},
  actionsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnOutline: {backgroundColor: 'rgba(15, 23, 42, 0.22)', borderColor: 'rgba(148, 163, 184, 0.22)'},
  actionBtnGreen: {backgroundColor: 'rgba(34, 197, 94, 0.18)', borderColor: 'rgba(34, 197, 94, 0.38)'},
  actionBtnRed: {backgroundColor: 'rgba(239, 68, 68, 0.16)', borderColor: 'rgba(239, 68, 68, 0.34)'},
  actionBtnText: {color: '#E2E8F0', fontSize: 12, fontWeight: '900'},
});

