import React, {useEffect, useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import adminGateService from '../services/adminGateService';
import authService from '../services/authService';
import chatService, {Message} from '../services/chatService';

type ChatType = 'general' | 'staff';

export const AdminChatsScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [chatType, setChatType] = useState<ChatType>('staff');
  const [groupName, setGroupName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureAdmin = async (): Promise<boolean> => {
    const u = await authService.getCurrentUser();
    const isAdmin = u?.email === 'admin@roller.com';
    if (!isAdmin) {
      Alert.alert('Acceso denegado', 'Solo administración.');
      return false;
    }
    const ok = await adminGateService.ensureUnlocked();
    return ok;
  };

  const load = async () => {
    if (!(await ensureAdmin())) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await chatService.getMessages(chatType);
      if (res.success && res.messages) {
        // más nuevos al final
        const sorted = [...res.messages].sort((a, b) => {
          const ta = new Date(a.timestamp as any).getTime();
          const tb = new Date(b.timestamp as any).getTime();
          return ta - tb;
        });
        setMessages(sorted);
      } else {
        setMessages([]);
        setError(res.error || 'No se pudieron cargar mensajes.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [chatType]);

  const label = chatType === 'staff' ? 'Chat staff' : 'Chat general';

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
            <Text style={styles.title}>Chats (Admin)</Text>
            <Text style={styles.subtitle}>
              {label}
              {groupName.trim() ? ` · Grupo: ${groupName.trim()}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => void load()}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tipo de chat</Text>
          <View style={styles.chipsRow}>
            {(['staff', 'general'] as const).map((t) => {
              const active = t === chatType;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setChatType(t)}
                  activeOpacity={0.85}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t === 'staff' ? 'Staff' : 'General'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Nombre del grupo (solo para referencia)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Roller Santa Fe"
            placeholderTextColor="rgba(226,232,240,0.62)"
            value={groupName}
            onChangeText={setGroupName}
          />
          <Text style={styles.hint}>
            Nota: actualmente el backend expone solo `general`/`staff`. Cuando tengamos endpoint por grupo, lo conectamos aquí.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mensajes</Text>
          {loading ? (
            <Text style={styles.meta}>Cargando…</Text>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : messages.length === 0 ? (
            <Text style={styles.meta}>No hay mensajes.</Text>
          ) : (
            messages.slice(-80).map((m) => (
              <View key={m.id} style={styles.msgRow}>
                <Text style={styles.msgHead}>
                  {m.userName} · {String(m.timestamp).slice(0, 16)}
                </Text>
                <Text style={styles.msgText}>{m.text}</Text>
              </View>
            ))
          )}
        </View>
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
  chipsRow: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8},
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.34)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {backgroundColor: '#38BDF8', borderColor: '#38BDF8'},
  chipText: {fontSize: 12, fontWeight: '900', color: '#E0F2FE'},
  chipTextActive: {color: '#020617'},
  label: {color: '#E2E8F0', fontSize: 13, fontWeight: '800', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E2E8F0',
  },
  hint: {color: 'rgba(226,232,240,0.6)', fontSize: 12, marginTop: 8, lineHeight: 16},
  meta: {color: 'rgba(226,232,240,0.78)'},
  error: {color: '#FCA5A5'},
  msgRow: {paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.12)'},
  msgHead: {color: 'rgba(226,232,240,0.72)', fontSize: 12, marginBottom: 6},
  msgText: {color: '#E2E8F0', lineHeight: 18},
});

