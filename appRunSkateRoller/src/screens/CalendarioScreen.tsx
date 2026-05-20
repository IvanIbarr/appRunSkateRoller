import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  Share,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {LaunchPhaseBanner} from '../components/LaunchPhaseBanner';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import eventoService from '../services/eventoService';
import {Usuario, Evento} from '../types';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {eventoFechaToYmd, ymdToLocalDate} from '../utils/dateOnly';
import {getRealtimeSocket} from '../services/realtimeService';
import getApiBaseUrl from '../config/api';
import {
  cancelEventoQuinceMinAntes,
  scheduleEventoQuinceMinAntes,
} from '../services/eventoRemindersService';

const RSVP_EVENT_IDS_KEY = '@app:calendario:rsvp_event_ids';

interface CalendarioScreenProps {
  navigation: any;
}

const eventosEjemplo: Evento[] = [];

export const CalendarioScreen: React.FC<CalendarioScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {width: windowWidth} = useWindowDimensions();
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [eventoAEliminar, setEventoAEliminar] = useState<{id: string; titulo: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [eventosEliminados, setEventosEliminados] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  /** Eventos con recordatorio local (15 min) programado vía notifee. */
  const [rsvpEventIds, setRsvpEventIds] = useState<Set<string>>(new Set());

  const persistRsvpIds = useCallback(async (set: Set<string>) => {
    try {
      await AsyncStorage.setItem(
        RSVP_EVENT_IDS_KEY,
        JSON.stringify([...set]),
      );
    } catch {
      // ignore
    }
  }, []);

  const loadRsvpIds = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(RSVP_EVENT_IDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) {
          setRsvpEventIds(new Set(arr));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };
    loadUser();
  }, []);

  const loadEventos = async () => {
    try {
      const response = await eventoService.getEventos();
      if (response.success && response.eventos) {
        // Solo usar eventos reales de API/storage (sin datos hardcodeados de marzo).
        const todosEventos = [...response.eventos];
        
        // Filtrar eventos eliminados
        const eventosSinEliminados = todosEventos.filter(
          evento => !evento.id || !eventosEliminados.has(evento.id)
        );
        
        // Eliminar eventos vencidos (más de 2 días)
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);
        const eventosSinVencidos = eventosSinEliminados.filter(evento => {
          const ymd = eventoFechaToYmd(evento.fecha);
          const fechaEvento =
            (ymd ? ymdToLocalDate(ymd) : null) ||
            (typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha);
          fechaEvento.setHours(0, 0, 0, 0);
          const diasDiferencia = Math.floor((ahora.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24));
          // Mantener solo eventos que no tengan más de 2 días de vencidos
          return diasDiferencia <= 2;
        });
        
        // Eliminar automáticamente eventos vencidos del almacenamiento
        const eventosVencidos = eventosSinEliminados.filter(evento => {
          const ymd = eventoFechaToYmd(evento.fecha);
          const fechaEvento =
            (ymd ? ymdToLocalDate(ymd) : null) ||
            (typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha);
          fechaEvento.setHours(0, 0, 0, 0);
          const diasDiferencia = Math.floor((ahora.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24));
          return diasDiferencia > 2 && evento.id;
        });
        
        // Eliminar eventos vencidos del almacenamiento
        if (eventosVencidos.length > 0) {
          for (const eventoVencido of eventosVencidos) {
            if (eventoVencido.id) {
              try {
                await eventoService.eliminarEvento(eventoVencido.id);
              } catch (error) {
                console.error('Error al eliminar evento vencido:', error);
              }
            }
          }
        }
        
        // Eliminar duplicados basándose en ID, o título+fecha si no hay ID
        const eventosUnicos = eventosSinVencidos.filter((evento, index, self) => {
          // Buscar si ya existe un evento con el mismo ID
          if (evento.id) {
            return index === self.findIndex(e => e.id === evento.id);
          }
          // Si no hay ID, comparar por título y fecha
          const titulo = evento.tituloRuta || evento.titulo;
          const fecha = eventoFechaToYmd(evento.fecha) || '';
          return index === self.findIndex(e => {
            const eTitulo = e.tituloRuta || e.titulo;
            const eFecha = eventoFechaToYmd(e.fecha) || '';
            return eTitulo === titulo && eFecha === fecha;
          });
        });
        
        // Ordenar por fecha (más antiguos primero)
        eventosUnicos.sort((a, b) => {
          const ymdA = eventoFechaToYmd(a.fecha) || '';
          const ymdB = eventoFechaToYmd(b.fecha) || '';
          return ymdA.localeCompare(ymdB);
        });
        setEventos(eventosUnicos);
      } else {
        setEventos([]);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setEventos([]);
    }
  };

  useEffect(() => {
    void loadRsvpIds();
  }, [loadRsvpIds]);

  useEffect(() => {
    loadEventos();
  }, []);

  useEffect(() => {
    try {
      const socket = getRealtimeSocket(getApiBaseUrl());
      const refresh = () => {
        loadEventos();
      };
      socket.on('event_created', refresh);
      socket.on('event_updated', refresh);
      socket.on('event_deleted', refresh);
      return () => {
        socket.off('event_created', refresh);
        socket.off('event_updated', refresh);
        socket.off('event_deleted', refresh);
      };
    } catch (e) {
      console.warn('Calendario: socket en tiempo real no disponible', e);
    }
  }, []);

  // Recargar eventos cuando la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      void loadRsvpIds();
      loadEventos();
    }, [loadRsvpIds]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEventos();
    setRefreshing(false);
  };

  const formatFecha = (fecha: string | Date | null | undefined): string => {
    if (fecha == null) {
      return '—';
    }
    const ymd = eventoFechaToYmd(fecha);
    const date =
      (ymd ? ymdToLocalDate(ymd) : null) ||
      (typeof fecha === 'string' ? new Date(fecha) : fecha);
    if (!date || Number.isNaN(date.getTime())) {
      return '—';
    }
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatFechaRango = (fecha: string | Date | null | undefined): string => {
    if (fecha == null) {
      return '—';
    }
    const ymd = eventoFechaToYmd(fecha);
    const date =
      (ymd ? ymdToLocalDate(ymd) : null) ||
      (typeof fecha === 'string' ? new Date(fecha) : fecha);
    if (!date || Number.isNaN(date.getTime())) {
      return '—';
    }
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', {month: 'long'});
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  /**
   * Fase 1: sin backend de asistencia; en móvil se programa notificación local 15 min antes de la cita.
   */
  const handleRegistrarse = async (evento: Evento) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Solo en la app móvil',
        'El aviso 15 minutos antes del recorrido (notificación) se configura en Android o iOS. En la web, usa «Compartir» y añade el evento a tu calendario o recordatorio manual.',
      );
      return;
    }
    if (!evento.id) {
      Alert.alert('Calendario', 'Falta el id del evento. Recarga e inténtalo de nuevo.');
      return;
    }
    if (rsvpEventIds.has(evento.id)) {
      await cancelEventoQuinceMinAntes(evento.id);
      const next = new Set(rsvpEventIds);
      next.delete(evento.id);
      setRsvpEventIds(next);
      await persistRsvpIds(next);
      Alert.alert('Recordatorio', 'Se canceló el aviso 15 minutos antes de la cita.');
      return;
    }
    const res = await scheduleEventoQuinceMinAntes(evento);
    if (res.ok) {
      const next = new Set(rsvpEventIds);
      next.add(evento.id);
      setRsvpEventIds(next);
      await persistRsvpIds(next);
      Alert.alert(
        '¡Prepárate para rodar! 🛼',
        'Te avisaremos 15 minutos antes de la hora de cita. Mantén activadas las notificaciones para la app.\n\nPulsa otra vez el mismo botón si quieres quitar el recordatorio.',
      );
    } else {
      Alert.alert('No se pudo programar', res.error);
    }
  };

  const handleEditarEvento = (evento: Evento) => {
    // Navegar al formulario con datos serializables
    const fechaSerializable =
      eventoFechaToYmd(evento.fecha) ||
      (typeof evento.fecha === 'string' ? evento.fecha : evento.fecha.toISOString());

    navigation.navigate('CrearEvento', {
      eventoParaEditar: {
        ...evento,
        fecha: fechaSerializable,
        createdAt:
          evento.createdAt instanceof Date
            ? evento.createdAt.toISOString()
            : evento.createdAt,
        updatedAt:
          evento.updatedAt instanceof Date
            ? evento.updatedAt.toISOString()
            : evento.updatedAt,
      },
      esEdicion: true,
    });
  };

  const handleCompartirEvento = async (evento: Evento) => {
    try {
      // Formatear la fecha de manera compatible con Android
      let fechaFormateada = 'Fecha no especificada';
      if (evento.fecha) {
        try {
          const ymd = eventoFechaToYmd(evento.fecha);
          const fecha =
            (ymd ? ymdToLocalDate(ymd) : null) || new Date(evento.fecha as any);
          // Usar formato más compatible para Android
          fechaFormateada = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch (e) {
          // Fallback si hay error con el formato
          fechaFormateada = evento.fecha.toString();
        }
      }

      // Construir el mensaje a compartir
      let mensaje = `🎯 ${evento.titulo || 'Evento Roller'}\n\n`;
      mensaje += `📅 Fecha: ${fechaFormateada}\n`;
      
      if (evento.hora) {
        mensaje += `🕐 Hora: ${evento.hora}\n`;
      }
      
      if (evento.salida) {
        mensaje += `🚀 Salida: ${evento.salida}\n`;
      }
      
      if (evento.nivel) {
        mensaje += `⭐ Nivel: ${evento.nivel}\n`;
      }
      
      if (evento.puntoSalida || evento.puntoEncuentroDireccion) {
        mensaje += `📍 Punto de salida: ${evento.puntoSalida || evento.puntoEncuentroDireccion}\n`;
      }
      
      if (evento.descripcion) {
        mensaje += `\n${evento.descripcion}\n`;
      }
      
      mensaje += `\n¡Únete a este recorrido en patines! 🛼`;

      // Configurar opciones de compartir según la plataforma
      const shareOptions = Platform.select({
        android: {
          message: mensaje,
          // En Android, el título se incluye en el mensaje si es necesario
        },
        ios: {
          message: mensaje,
          title: evento.titulo || 'Evento Roller',
        },
        default: {
          message: mensaje,
          title: evento.titulo || 'Evento Roller',
        },
      });

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Compartido con una actividad específica (iOS)
          console.log('Compartido con:', result.activityType);
        } else {
          // Compartido exitosamente
          console.log('Evento compartido exitosamente');
        }
      } else if (result.action === Share.dismissedAction) {
        // Usuario canceló el compartir
        console.log('Compartir cancelado');
      }
    } catch (error) {
      console.error('Error al compartir evento:', error);
      Alert.alert(
        'Error',
        'No se pudo compartir el evento. Por favor, intenta nuevamente.',
      );
    }
  };

  const handleEliminarEvento = (eventoId: string, titulo: string) => {
    // Validar que tenemos un ID válido
    if (!eventoId) {
      Alert.alert(
        '❌ Error',
        'No se pudo identificar el evento a eliminar.',
        [{text: 'OK', style: 'default'}]
      );
      return;
    }

    // Mostrar modal de confirmación
    setEventoAEliminar({id: eventoId, titulo});
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!eventoAEliminar) return;

    setDeleting(true);
    setShowDeleteModal(false);

    try {
      const response = await eventoService.eliminarEvento(eventoAEliminar.id);
      
      if (response.success) {
        // Agregar el ID del evento a la lista de eventos eliminados
        setEventosEliminados(prev => new Set([...prev, eventoAEliminar.id]));
        
        // Eliminar el evento del estado inmediatamente para feedback visual
        setEventos(prevEventos => 
          prevEventos.filter(evento => evento.id !== eventoAEliminar.id)
        );
        
        // Mostrar modal de éxito
        setShowSuccessModal(true);
        
        // Recargar eventos desde el almacenamiento después de un breve delay
        // para asegurar que el almacenamiento se haya actualizado
        setTimeout(async () => {
          await loadEventos();
        }, 300);
      } else {
        // Mensajes de error específicos
        let errorMessage = 'No se pudo eliminar el evento.';
        
        if (response.error) {
          if (response.error.includes('no encontrado')) {
            errorMessage = `El evento "${eventoAEliminar.titulo}" no se encontró. Puede que ya haya sido eliminado.`;
          } else if (response.error.includes('almacenamiento') || response.error.includes('quota')) {
            errorMessage = 'Error de almacenamiento. Por favor, intenta nuevamente.';
          } else {
            errorMessage = response.error;
          }
        }

        Alert.alert(
          '❌ Error al Eliminar',
          errorMessage,
          [
            {
              text: 'Reintentar',
              onPress: () => {
                setEventoAEliminar({id: eventoAEliminar.id, titulo: eventoAEliminar.titulo});
                setShowDeleteModal(true);
              },
              style: 'default',
            },
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => setEventoAEliminar(null),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      
      let errorMessage = 'Ocurrió un error inesperado al eliminar el evento.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'La operación tardó demasiado. Por favor, intenta nuevamente.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      Alert.alert(
        '❌ Error de Conexión',
        errorMessage,
        [
          {
            text: 'Reintentar',
            onPress: () => {
              if (eventoAEliminar) {
                setShowDeleteModal(true);
              }
            },
            style: 'default',
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setEventoAEliminar(null),
          },
        ]
      );
    } finally {
      setDeleting(false);
    }
  };

  const cerrarModalEliminar = () => {
    setShowDeleteModal(false);
    setEventoAEliminar(null);
  };

  const cerrarModalExito = () => {
    setShowSuccessModal(false);
    setEventoAEliminar(null);
    // Los eventos ya fueron actualizados después de eliminar
    // No es necesario recargar nuevamente
  };

  // Funciones para el mini calendario
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const   getMonthName = (date: Date) => {
    try {
      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } catch (e) {
      // Fallback para Android si hay problemas con el formato
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `${meses[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    return eventos.filter(evento => {
      const fechaYmd = eventoFechaToYmd(evento.fecha);
      return fechaYmd === ymd;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  /** En web móvil, fila + calendario al 100% de ancho dejaba la lista de eventos sin espacio (pantalla “vacía”). */
  const calendarWideWeb = Platform.OS === 'web' && windowWidth >= 900;

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        {/* Imagen de fondo */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/patines-fondo-nuevo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          {/* Overlay oscuro para mejorar legibilidad */}
          <View style={styles.overlay} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            Platform.OS === 'web' ? undefined : (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            )
          }>
          <LaunchPhaseBanner
            screenRouteName="Calendario"
            emphasizeCoreInBeta
          />
          {/* Header mejorado */}
          <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 16}]}>
            <AvatarCircle
              avatar={currentUser?.avatar}
              fotoPerfil={currentUser?.fotoPerfil}
              size={45}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.pageTitle}>📅 Calendario</Text>
              <Text style={styles.pageSubtitle}>Eventos y rodadas programadas</Text>
            </View>
            <TouchableOpacity
              style={styles.addEventButton}
              onPress={() => navigation.navigate('CrearEvento')}
              activeOpacity={0.8}>
              <Text style={styles.addEventButtonIcon}>+</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.calendarGrid,
              {flexDirection: calendarWideWeb ? 'row' : 'column'},
            ]}>
            {/* Mini Calendario */}
            <View
              style={[
                styles.calendarContainer,
                calendarWideWeb && styles.calendarContainerRowWeb,
              ]}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => navigateMonth('prev')}
                  activeOpacity={0.7}>
                  <Text style={styles.calendarNavIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.calendarMonthText}>
                  {getMonthName(currentMonth).charAt(0).toUpperCase() + getMonthName(currentMonth).slice(1)}
                </Text>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => navigateMonth('next')}
                  activeOpacity={0.7}>
                  <Text style={styles.calendarNavIcon}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Días de la semana */}
              <View style={styles.calendarWeekDays}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
                  <View key={index} style={styles.weekDay}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Días del mes */}
              <View style={styles.calendarDays}>
                {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                  <View key={`empty-${i}`} style={styles.calendarDay} />
                ))}
                {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const hasEvents = dayEvents.length > 0;
                  const today = isToday(day);
                  const past = isPastDate(day);

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calendarDay,
                        today && styles.calendarDayToday,
                        hasEvents && styles.calendarDayWithEvents,
                      ]}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.calendarDayText,
                          today && styles.calendarDayTextToday,
                          past && styles.calendarDayTextPast,
                          hasEvents && styles.calendarDayTextWithEvents,
                        ]}>
                        {day}
                      </Text>
                      {hasEvents && <View style={styles.calendarDayDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Eventos */}
            <View style={styles.eventsColumn}>
              {eventos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay eventos programados</Text>
                </View>
              ) : (
                eventos.map((evento, eventIndex) => (
                  <View
                    key={evento.id != null ? String(evento.id) : `ev-${eventIndex}`}
                    style={styles.eventCard}>
                {/* Imagen principal del evento */}
                {evento.lugarDestino ? (
                  <View style={styles.eventImageWrapper}>
                    <Image
                      source={{uri: evento.lugarDestino}}
                      style={styles.eventMainImage}
                      resizeMode="contain"
                    />
                    {/* Overlay oscuro para mejor legibilidad */}
                    <View style={styles.imageOverlay} />
                    
                    {/* Logo del grupo en esquina superior izquierda */}
                    {evento.logoGrupo && (
                      <View style={styles.logoContainer}>
                        <Image
                          source={{uri: evento.logoGrupo}}
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    
                    {/* Botón eliminar en esquina superior derecha */}
                    {evento.id && (
                      <TouchableOpacity
                        style={styles.deleteButtonOverlay}
                        onPress={() => handleEliminarEvento(evento.id!, evento.tituloRuta || evento.titulo)}
                        activeOpacity={0.8}>
                        <Text style={styles.deleteButtonIcon}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.eventImageWrapper}>
                    <View style={styles.placeholderImage}>
                      <Text style={styles.placeholderText}>📅</Text>
                    </View>
                    {/* Logo del grupo si no hay imagen principal */}
                    {evento.logoGrupo && (
                      <View style={styles.logoContainer}>
                        <Image
                          source={{uri: evento.logoGrupo}}
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    {/* Botón eliminar */}
                    {evento.id && (
                      <TouchableOpacity
                        style={styles.deleteButtonOverlay}
                        onPress={() => handleEliminarEvento(evento.id!, evento.tituloRuta || evento.titulo)}
                        activeOpacity={0.8}>
                        <Text style={styles.deleteButtonIcon}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Contenido del evento */}
                <View style={styles.eventContent}>
                  {/* Título principal - Grande y destacado */}
                  <View style={styles.titleRow}>
                    <Text style={styles.titleIcon}>📅</Text>
                    <View style={styles.titleTextBlock}>
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {evento.tituloRuta || evento.titulo}
                      </Text>
                      <Text style={styles.dateText}>
                        {formatFechaRango(evento.fecha)} {evento.hora ? `• ${evento.hora}` : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Información de horarios */}
                  <View style={styles.infoSection}>
                    {evento.cita && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cita:</Text>
                        <Text style={styles.infoValue}>{evento.cita}</Text>
                      </View>
                    )}
                    {evento.salida && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Salida:</Text>
                        <Text style={styles.infoValue}>{evento.salida}</Text>
                      </View>
                    )}
                    {!evento.cita && !evento.salida && evento.hora && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Hora:</Text>
                        <Text style={styles.infoValue}>{evento.hora}</Text>
                      </View>
                    )}
                  </View>

                  {/* Nivel con badge */}
                  {evento.nivel && (
                    <View style={styles.levelBadgeContainer}>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>{evento.nivel}</Text>
                      </View>
                    </View>
                  )}

                  {/* Punto de salida */}
                  {evento.puntoSalida && (
                    <View style={styles.locationSection}>
                      <Text style={styles.locationLabel}>📍 Punto de salida:</Text>
                      <Text style={styles.locationText}>{evento.puntoSalida}</Text>
                    </View>
                  )}

                  {/* Descripción/Comentarios extras */}
                  {evento.descripcion && (
                    <View style={styles.descriptionSection}>
                      <Text style={styles.descriptionText}>{evento.descripcion}</Text>
                    </View>
                  )}

                  {/* Botones de acción */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditarEvento(evento)}
                      activeOpacity={0.8}>
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.registerButton,
                        rsvpEventIds.has(String(evento.id)) && styles.registerButtonActive,
                      ]}
                      onPress={() => {
                        void handleRegistrarse(evento);
                      }}
                      activeOpacity={0.8}>
                      <Text style={styles.registerButtonText}>
                        {rsvpEventIds.has(String(evento.id))
                          ? 'Me apunto · aviso 15 min ✓'
                          : 'Me apunto · aviso 15 min'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleCompartirEvento(evento)}
                      activeOpacity={0.8}>
                      <Text style={styles.shareButtonText}>Compartir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Modal de Confirmación de Eliminación */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
          onRequestClose={cerrarModalEliminar}
          presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIcon}>🗑️</Text>
                <Text style={styles.modalTitle}>Eliminar Evento</Text>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalMessage}>
                  ¿Estás seguro de que deseas eliminar el evento
                </Text>
                <Text style={styles.modalEventName}>
                  "{eventoAEliminar?.titulo}"
                </Text>
                <Text style={styles.modalWarning}>
                  Esta acción no se puede deshacer.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={cerrarModalEliminar}
                  activeOpacity={0.8}>
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDelete]}
                  onPress={confirmarEliminacion}
                  activeOpacity={0.8}
                  disabled={deleting}>
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonDeleteText}>Eliminar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Éxito */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
          onRequestClose={cerrarModalExito}
          presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIconSuccess}>✅</Text>
                <Text style={styles.modalTitleSuccess}>Evento Eliminado</Text>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalSuccessMessage}>
                  El evento
                </Text>
                <Text style={styles.modalEventNameSuccess}>
                  "{eventoAEliminar?.titulo}"
                </Text>
                <Text style={styles.modalSuccessMessage}>
                  ha sido eliminado exitosamente.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSuccess]}
                  onPress={cerrarModalExito}
                  activeOpacity={0.8}>
                  <Text style={styles.modalButtonSuccessText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </WithBottomTabBar>
  );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E', // Fondo oscuro moderno
    position: 'relative',
  },
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
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 12, 24, 0.55)', // Overlay suave para dejar ver el fondo
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  calendarGrid: {
    gap: 18,
    paddingHorizontal: 16,
  },
  /** Sin flex:1 dentro de ScrollView (en iOS suele colapsar a altura 0). */
  eventsColumn: {
    width: '100%',
    alignSelf: 'stretch',
  },
  /** Solo con `calendarWideWeb`: ancho fijo para no empujar la columna de eventos fuera. */
  calendarContainerRowWeb: {
    width: 380,
    maxWidth: '100%',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingTop: Platform.select({
      ios: 16, // Se ajustará dinámicamente con SafeAreaInsets
      web: 16,
      default: 60,
    }),
    paddingBottom: 12,
    backgroundColor: 'rgba(14, 16, 32, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 165, 255, 0.25)',
    ...Platform.select({
      ios: {
        // Mejoras visuales para iOS
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  headerTextContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      ios: {
        fontFamily: 'System',
        fontWeight: '700',
      },
    }),
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#8B9DC3',
    ...Platform.select({
      web: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  addEventButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 99, 255, 0.25)',
    borderWidth: 2,
    borderColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  addEventButtonIcon: {
    fontSize: 28,
    color: '#CFCBFF',
    fontWeight: '300',
    lineHeight: 28,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8B9DC3',
    textAlign: 'center',
  },
  eventCard: {
    marginBottom: 18,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 20, 40, 0.95)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(108, 99, 255, 0.5)',
  },
  eventImageWrapper: {
    width: '100%',
    height: 520,
    position: 'relative',
    backgroundColor: '#1A1D2F',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
      },
      default: {
        backgroundColor: 'rgba(0,0,0,0.35)',
      },
    }),
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
    opacity: 0.5,
  },
  logoContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 140,
    height: 140,
    backgroundColor: 'transparent',
    borderRadius: 18,
    padding: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  deleteButtonOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  deleteButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  eventContent: {
    padding: 16,
    backgroundColor: 'rgba(18, 20, 40, 0.95)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  titleIcon: {
    fontSize: 22,
    color: '#22E6FF',
  },
  titleTextBlock: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    lineHeight: 26,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
    textTransform: 'uppercase',
  },
  dateSection: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#AEB5D6',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  infoSection: {
    marginBottom: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B9DC3',
    minWidth: 55,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  levelBadgeContainer: {
    marginBottom: 10,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#8A7FFF',
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  locationSection: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#00D9FF',
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B9DC3',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  descriptionSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#D4DFF7',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    ...Platform.select({
      web: {
        gap: 10,
      },
      default: {
        // Para Android e iOS, usar margin en lugar de gap
        marginHorizontal: -5,
      },
    }),
  },
  editButton: {
    flex: 1,
    backgroundColor: '#7A5CFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A5CFF',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#A38CFF',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #7A5CFF 0%, #A38CFF 100%)',
      },
      default: {
        marginHorizontal: 5,
      },
    }),
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#22E6FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22E6FF',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)',
      },
      default: {
        marginHorizontal: 5,
      },
    }),
  },
  registerButtonActive: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: '#0D9488',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
      },
    }),
  },
  registerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#8F6BFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8F6BFF',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #7A5CFF 0%, #22E6FF 50%, #8F6BFF 100%)',
      },
      default: {
        marginHorizontal: 5,
      },
    }),
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  // Estilos para modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      android: {
        // Asegurar que el overlay cubra toda la pantalla en Android
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      ios: {
        // Mejoras para iOS - backdrop blur effect
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
      },
    }),
  },
  modalContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    ...Platform.select({
      android: {
        // Asegurar que el modal tenga el ancho correcto en Android
        marginHorizontal: 20,
        maxWidth: Platform.OS === 'android' ? Dimensions.get('window').width - 40 : 400,
      },
      ios: {
        // Mejoras visuales para iOS
        borderRadius: 16,
        shadowOpacity: 0.6,
        shadowRadius: 20,
        // Asegurar que el modal tenga el ancho correcto en iOS
        marginHorizontal: 20,
        maxWidth: Platform.OS === 'ios' ? Dimensions.get('window').width - 40 : 400,
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  modalIconSuccess: {
    fontSize: 64,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF3B30',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalTitleSuccess: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalContent: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalEventName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00D9FF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalEventNameSuccess: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalWarning: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalSuccessMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        gap: 12,
      },
      default: {
        marginHorizontal: -6,
      },
    }),
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...Platform.select({
      default: {
        marginHorizontal: 6,
      },
    }),
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtonCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalButtonDelete: {
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonDeleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalButtonSuccess: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#66BB6A',
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
      },
    }),
  },
  modalButtonSuccessText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  // Estilos del mini calendario (compacto)
  calendarContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(14, 16, 32, 0.85)',
    borderRadius: 22,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(108, 99, 255, 0.65)',
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    alignSelf: 'flex-start',
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 380,
      },
      default: {
        maxWidth: 320,
      },
    }),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(108, 99, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.55)',
  },
  calendarNavIcon: {
    fontSize: 20,
    color: '#B9B4FF',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  calendarMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingVertical: 6,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AEB5D6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 2,
    borderRadius: 8,
  },
  calendarDayToday: {
    backgroundColor: 'rgba(108, 99, 255, 0.28)',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  calendarDayWithEvents: {
    backgroundColor: 'rgba(50, 213, 131, 0.18)',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  calendarDayTextToday: {
    color: '#CFCBFF',
    fontWeight: '800',
    fontSize: 13,
  },
  calendarDayTextPast: {
    color: '#666',
    opacity: 0.4,
  },
  calendarDayTextWithEvents: {
    color: '#32D583',
    fontWeight: '700',
  },
  calendarDayDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32D583',
  },
});
