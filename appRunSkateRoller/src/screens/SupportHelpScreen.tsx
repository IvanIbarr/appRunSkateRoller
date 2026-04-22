import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import authService from '../services/authService';
import supportService from '../services/supportService';
import type {SupportArea, SupportTicket, SupportTicketStatus} from '../types/supportTicket';

const AREA_OPTIONS: Array<{id: SupportArea; label: string}> = [
  {id: 'ruta', label: 'Ruta'},
  {id: 'chat', label: 'Chat'},
  {id: 'historial', label: 'Historial'},
  {id: 'calendario', label: 'Calendario'},
  {id: 'rollertips', label: 'RollerTips'},
  {id: 'marketing', label: 'Marketing'},
  {id: 'compras', label: 'Compras / Checkout'},
  {id: 'juego', label: 'Funcionamiento del juego'},
  {id: 'mi_cuenta', label: 'Mi cuenta'},
  {id: 'lenguaje_seguro', label: 'Lenguaje limpio y seguro'},
  {id: 'otro', label: 'Otro'},
];

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  nuevo: 'Nuevo',
  visto: 'Visto / en curso',
  resuelto: 'Resuelto',
};

function shortFolio(id: string): string {
  return id.length > 20 ? `${id.slice(0, 14)}…` : id;
}

export const SupportHelpScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [area, setArea] = useState<SupportArea>('ruta');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  const remaining = useMemo(() => 2500 - description.length, [description.length]);

  const loadTickets = useCallback(async () => {
    try {
      const list = await supportService.listTickets();
      setMyTickets(list.slice(0, 8));
    } catch {
      setMyTickets([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTickets();
    }, [loadTickets]),
  );

  const submit = async () => {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      Alert.alert('Falta información', 'Por favor escribe un título y una descripción.');
      return;
    }
    if (d.length > 2500) {
      Alert.alert('Descripción muy larga', 'La descripción debe ser máximo 2,500 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await authService.getCurrentUser();
      const ticket = await supportService.createTicket({
        area,
        title: t,
        description: d,
        fromEmail: user?.email ?? null,
        fromUserId: user?.id ?? null,
      });
      const folio = shortFolio(ticket.id);
      setTitle('');
      setDescription('');
      void loadTickets();
      Alert.alert(
        'Solicitud enviada',
        `Tu folio: ${folio}\n\nGuárdalo para seguimiento. En esta versión el ticket queda en este dispositivo; la mesa de ayuda lo verá cuando conectemos el buzón al servidor.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation?.canGoBack?.()) {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo enviar tu solicitud. Intenta nuevamente.',
      );
    } finally {
      setSubmitting(false);
    }
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
            <Text style={styles.title}>Ayuda y Asistencia</Text>
          </View>

        <Text style={styles.subtitle}>
          Cuéntanos en qué parte necesitas ayuda. Responderemos lo antes posible.
        </Text>

        {myTickets.length > 0 && (
          <View style={styles.ticketListCard}>
            <Text style={styles.ticketListTitle}>Tus folios en este dispositivo</Text>
            {myTickets.map((tk) => (
              <View key={tk.id} style={styles.ticketRow}>
                <Text style={styles.ticketFolio} numberOfLines={1}>
                  {shortFolio(tk.id)}
                </Text>
                <Text style={styles.ticketStatus}>{STATUS_LABEL[tk.status]}</Text>
                <Text style={styles.ticketTitle} numberOfLines={1}>
                  {tk.title}
                </Text>
              </View>
            ))}
            <Text style={styles.ticketListNote}>
              Estado según carga el equipo en el buzón admin. Aún no hay campo de “solución” en
              el ticket local; verás resuelto cuando el admin lo marque.
            </Text>
          </View>
        )}

        <Text style={styles.label}>¿En qué página necesitas ayuda?</Text>
        <View style={styles.chipsRow}>
          {AREA_OPTIONS.map((o) => {
            const active = o.id === area;
            return (
              <TouchableOpacity
                key={o.id}
                onPress={() => setArea(o.id)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: No me salen sugerencias en destino"
          placeholderTextColor="rgba(226,232,240,0.62)"
          value={title}
          onChangeText={setTitle}
          autoCorrect={false}
        />

        <Text style={styles.label}>Descripción (máx. 2,500)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe el problema o tu sugerencia…"
          placeholderTextColor="rgba(226,232,240,0.62)"
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, 2500))}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.counter}>
          {remaining} caracteres restantes
        </Text>

        <TouchableOpacity
          style={[styles.sendBtn, submitting && styles.sendBtnDisabled]}
          disabled={submitting}
          onPress={submit}
          activeOpacity={0.9}>
          <Text style={styles.sendBtnText}>{submitting ? 'Enviando…' : 'Enviar'}</Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <Text style={styles.footerHint}>
            Nota: en este MVP, los tickets se guardan localmente en este dispositivo. Luego lo conectamos al backend.
          </Text>
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
  title: {color: '#E2E8F0', fontSize: 18, fontWeight: '900'},
  subtitle: {
    color: 'rgba(226,232,240,0.78)',
    marginBottom: 14,
    lineHeight: 18,
  },
  label: {color: '#E2E8F0', fontSize: 13, fontWeight: '800', marginBottom: 8},
  chipsRow: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.34)',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {backgroundColor: '#38BDF8', borderColor: '#38BDF8'},
  chipText: {color: '#E0F2FE', fontSize: 12, fontWeight: '900'},
  chipTextActive: {color: '#020617'},
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E2E8F0',
    marginBottom: 12,
  },
  textArea: {minHeight: 140},
  counter: {color: 'rgba(226,232,240,0.72)', fontSize: 12, marginTop: -6, marginBottom: 12},
  ticketListCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  ticketListTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  ticketRow: {marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(148, 163, 184, 0.2)'},
  ticketFolio: {color: '#94A3B8', fontSize: 11, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined},
  ticketStatus: {color: '#4ADE80', fontSize: 12, fontWeight: '700', marginTop: 2},
  ticketTitle: {color: 'rgba(226,232,240,0.9)', fontSize: 12, marginTop: 2},
  ticketListNote: {color: 'rgba(148, 163, 184, 0.95)', fontSize: 11, lineHeight: 15, marginTop: 6},
  sendBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendBtnDisabled: {opacity: 0.55},
  sendBtnText: {color: '#DCFCE7', fontWeight: '900'},
  footerHint: {
    color: 'rgba(226,232,240,0.55)',
    fontSize: 12,
    marginTop: 14,
    lineHeight: 16,
  },
});

