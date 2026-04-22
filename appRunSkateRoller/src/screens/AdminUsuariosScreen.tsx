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
import adminUsersService, {AdminUserRow} from '../services/adminUsersService';
import authService from '../services/authService';

function bar(count: number, max: number): string {
  if (max <= 0) {
    return '';
  }
  const width = 18;
  const n = Math.max(0, Math.min(width, Math.round((count / max) * width)));
  return '█'.repeat(n);
}

export const AdminUsuariosScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [daily, setDaily] = useState<Array<{day: string; count: number}>>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = async (): Promise<boolean> => {
    const u = await authService.getCurrentUser();
    return u?.email === 'admin@roller.com';
  };

  const load = async () => {
    setLoading(true);
    try {
      // Semilla si está vacío (usuarios demo)
      await adminUsersService.seedIfEmpty([
        {id: 'mock-admin', email: 'admin@roller.com', tipoPerfil: 'administrador', createdAtIso: new Date().toISOString()},
        {id: 'mock-lider', email: 'lider@roller.com', tipoPerfil: 'liderGrupo', createdAtIso: new Date().toISOString()},
        {id: 'mock-roller', email: 'roller@roller.com', tipoPerfil: 'roller', createdAtIso: new Date().toISOString()},
      ]);
      const list = await adminUsersService.list();
      setUsers(list);
      setDaily(await adminUsersService.countsByDay(14));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const total = users.length;
  const maxDaily = useMemo(() => Math.max(0, ...daily.map((d) => d.count)), [daily]);

  const deleteUser = async (row: AdminUserRow) => {
    if (!(await isAdmin())) {
      Alert.alert('Acceso denegado', 'Solo administración.');
      return;
    }
    const ok = await adminGateService.ensureUnlocked();
    if (!ok) {
      return;
    }
    Alert.alert(
      'Eliminar usuario (hard delete)',
      `Esto borrará al usuario y datos locales relacionados (tickets/eventos) en este dispositivo.\n\nUsuario: ${row.email}\nID: ${row.id}\n\n¿Continuar?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await adminUsersService.deleteUserHard(row);
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
            <Text style={styles.title}>Usuarios (Admin)</Text>
            <Text style={styles.subtitle}>Total: {total}{loading ? ' · cargando…' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => void load()}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Altas por día (últimos 14)</Text>
          {daily.map((d) => (
            <View key={d.day} style={styles.row}>
              <Text style={styles.day}>{d.day}</Text>
              <Text style={styles.bar}>{bar(d.count, maxDaily)}</Text>
              <Text style={styles.count}>{d.count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lista de usuarios</Text>
          {users.length === 0 ? (
            <Text style={styles.emptyText}>No hay usuarios registrados en este dispositivo.</Text>
          ) : (
            users.map((u) => (
              <View key={u.id} style={styles.userRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={styles.userMeta}>
                    {u.tipoPerfil} · {u.createdAtIso.slice(0, 10)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteUser(u)}
                  style={styles.deleteBtn}
                  activeOpacity={0.85}>
                  <Text style={styles.deleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <Text style={styles.note}>
          Nota: como aún no hay backend de administración, estas métricas/acciones son locales a este dispositivo.
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
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {color: '#E2E8F0', fontWeight: '900', marginBottom: 10},
  row: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  day: {width: 92, color: 'rgba(226,232,240,0.78)', fontSize: 12},
  bar: {flex: 1, color: '#38BDF8', fontSize: 12},
  count: {width: 26, textAlign: 'right', color: '#E2E8F0', fontWeight: '900'},
  emptyText: {color: 'rgba(226,232,240,0.78)'},
  userRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.12)'},
  userEmail: {color: '#E2E8F0', fontWeight: '900'},
  userMeta: {color: 'rgba(226,232,240,0.68)', fontSize: 12, marginTop: 2},
  deleteBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: 'rgba(239, 68, 68, 0.34)',
  },
  deleteText: {color: '#FEE2E2', fontWeight: '900', fontSize: 12},
  note: {color: 'rgba(226,232,240,0.65)', fontSize: 12, marginTop: 6, lineHeight: 16},
});

