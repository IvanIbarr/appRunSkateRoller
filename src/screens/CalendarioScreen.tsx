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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import eventoService from '../services/eventoService';
import {Usuario, Evento} from '../types';
import {useFocusEffect} from '@react-navigation/native';

interface CalendarioScreenProps {
  navigation: any;
}

// Datos de ejemplo para eventos (en producción vendría del backend)
const eventosEjemplo: Evento[] = [];

export const CalendarioScreen: React.FC<CalendarioScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [eventos, setEventos] = useState<Evento[]>(eventosEjemplo);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [eventoAEliminar, setEventoAEliminar] = useState<{id: string; titulo: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [eventosEliminados, setEventosEliminados] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
        // Filtrar eventos de ejemplo que hayan sido eliminados
        const eventosEjemploFiltrados = eventosEjemplo.filter(
          evento => evento.id && !eventosEliminados.has(evento.id)
        );
        
        // Combinar eventos guardados con eventos de ejemplo filtrados
        const todosEventos = [...eventosEjemploFiltrados, ...response.eventos];
        
        // Filtrar eventos eliminados
        const eventosSinEliminados = todosEventos.filter(
          evento => !evento.id || !eventosEliminados.has(evento.id)
        );
        
        // Eliminar eventos vencidos (más de 2 días)
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);
        const eventosSinVencidos = eventosSinEliminados.filter(evento => {
          const fechaEvento = typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha;
          fechaEvento.setHours(0, 0, 0, 0);
          const diasDiferencia = Math.floor((ahora.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24));
          // Mantener solo eventos que no tengan más de 2 días de vencidos
          return diasDiferencia <= 2;
        });
        
        // Eliminar automáticamente eventos vencidos del almacenamiento
        const eventosVencidos = eventosSinEliminados.filter(evento => {
          const fechaEvento = typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha;
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
          const fecha = typeof evento.fecha === 'string' ? evento.fecha : evento.fecha.toISOString().split('T')[0];
          return index === self.findIndex(e => {
            const eTitulo = e.tituloRuta || e.titulo;
            const eFecha = typeof e.fecha === 'string' ? e.fecha : e.fecha.toISOString().split('T')[0];
            return eTitulo === titulo && eFecha === fecha;
          });
        });
        
        // Ordenar por fecha (más antiguos primero)
        eventosUnicos.sort((a, b) => {
          const fechaA = typeof a.fecha === 'string' ? new Date(a.fecha) : a.fecha;
          const fechaB = typeof b.fecha === 'string' ? new Date(b.fecha) : b.fecha;
          return fechaA.getTime() - fechaB.getTime();
        });
        setEventos(eventosUnicos);
      } else {
        // Si no hay eventos guardados, mostrar solo los de ejemplo que no hayan sido eliminados
        const eventosEjemploFiltrados = eventosEjemplo.filter(
          evento => !evento.id || !eventosEliminados.has(evento.id)
        );
        setEventos(eventosEjemploFiltrados);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
      // En caso de error, mostrar solo eventos de ejemplo que no hayan sido eliminados
      const eventosEjemploFiltrados = eventosEjemplo.filter(
        evento => !evento.id || !eventosEliminados.has(evento.id)
      );
      setEventos(eventosEjemploFiltrados);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  // Recargar eventos cuando la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      loadEventos();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEventos();
    setRefreshing(false);
  };

  const formatFecha = (fecha: string | Date): string => {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatFechaRango = (fecha: string | Date): string => {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', {month: 'long'});
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  const handleRegistrarse = (eventoId: string) => {
    // TODO: Implementar registro al evento
    console.log('Registrarse al evento:', eventoId);
  };

  const handleEditarEvento = (evento: Evento) => {
    // Navegar al formulario de creación/edición con los datos del evento
    navigation.navigate('CrearEvento', {
      eventoParaEditar: evento,
      esEdicion: true,
    });
  };

  const handleCompartirEvento = async (evento: Evento) => {
    try {
      // Formatear la fecha de manera compatible con Android
      let fechaFormateada = 'Fecha no especificada';
      if (evento.fecha) {
        try {
          const fecha = new Date(evento.fecha);
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
    return eventos.filter(evento => {
      const fechaEvento = typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha;
      return (
        fechaEvento.getDate() === date.getDate() &&
        fechaEvento.getMonth() === date.getMonth() &&
        fechaEvento.getFullYear() === date.getFullYear()
      );
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

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        {/* Imagen de fondo */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/IMG_2675.jpeg')}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Header mejorado */}
          <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 16}]}>
            <AvatarCircle avatar={currentUser?.avatar} size={45} />
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

          {/* Mini Calendario */}
          <View style={styles.calendarContainer}>
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
          {eventos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay eventos programados</Text>
            </View>
          ) : (
            eventos.map((evento) => (
              <View key={evento.id} style={styles.eventCard}>
                {/* Imagen principal del evento */}
                {evento.lugarDestino ? (
                  <View style={styles.eventImageWrapper}>
                    <Image
                      source={{uri: evento.lugarDestino}}
                      style={styles.eventMainImage}
                      resizeMode="cover"
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
                  <View style={styles.titleSection}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {evento.tituloRuta || evento.titulo}
                    </Text>
                  </View>

                  {/* Fecha destacada */}
                  <View style={styles.dateSection}>
                    <Text style={styles.dateText}>
                      {formatFechaRango(evento.fecha)}
                    </Text>
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
                      <Text style={styles.editButtonText}>✏️ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={() => handleRegistrarse(evento.id)}
                      activeOpacity={0.8}>
                      <Text style={styles.registerButtonText}>Registrarse</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleCompartirEvento(evento)}
                      activeOpacity={0.8}>
                      <Text style={styles.shareButtonText}>📤 Compartir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
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
    opacity: 0.3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 30, 0.85)', // Overlay oscuro para mejor contraste
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.2)',
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
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  addEventButtonIcon: {
    fontSize: 28,
    color: '#00D9FF',
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
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.1)',
  },
  eventImageWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#2A2A3E',
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
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
      },
      default: {
        backgroundColor: 'rgba(0,0,0,0.3)',
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
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#1A1A2E',
  },
  titleSection: {
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 28,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
    textTransform: 'uppercase',
  },
  dateSection: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFD700',
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
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF8C5A',
    shadowColor: '#FF6B35',
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
    marginTop: 6,
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
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFA500',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#FFB84D',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #FFA500 0%, #FFB84D 100%)',
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
    backgroundColor: '#00D9FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)',
      },
      default: {
        marginHorizontal: 5,
      },
    }),
  },
  registerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#9C27B0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
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
        background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
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
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.4)',
    shadowColor: '#00D9FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 217, 255, 0.5)',
  },
  calendarNavIcon: {
    fontSize: 20,
    color: '#00D9FF',
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
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B9DC3',
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
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 2,
    minHeight: 32,
    maxHeight: 36,
  },
  calendarDayToday: {
    backgroundColor: 'rgba(0, 217, 255, 0.25)',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00D9FF',
  },
  calendarDayWithEvents: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 4,
  },
  calendarDayText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  calendarDayTextToday: {
    color: '#00D9FF',
    fontWeight: '800',
    fontSize: 13,
  },
  calendarDayTextPast: {
    color: '#666',
    opacity: 0.4,
  },
  calendarDayTextWithEvents: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  calendarDayDot: {
    position: 'absolute',
    bottom: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#4CAF50',
  },
});
