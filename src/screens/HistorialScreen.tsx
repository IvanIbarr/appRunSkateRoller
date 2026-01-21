import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import seguimientoService, {
  Seguimiento,
  UserStats,
  LeaderboardEntry,
} from '../services/seguimientoService';
import {Usuario} from '../types';

interface HistorialScreenProps {
  navigation: any;
}

type PeriodFilter = 'all' | 'week' | 'month' | 'year';
type LeaderboardPeriod = 'week' | 'month' | 'year';

export const HistorialScreen: React.FC<HistorialScreenProps> = ({
  navigation,
}) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [recorridos, setRecorridos] = useState<Seguimiento[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        await loadHistorial();
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    loadHistorial();
  }, [selectedPeriod]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await seguimientoService.getLeaderboard(leaderboardPeriod, 10);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error cargando leaderboard:', error);
      }
    };
    loadLeaderboard();
  }, [leaderboardPeriod]);

  const loadHistorial = async () => {
    try {
      setLoading(true);
      const [historial, stats] = await Promise.all([
        seguimientoService.getHistory(selectedPeriod),
        seguimientoService.getUserStats(selectedPeriod),
      ]);
      setRecorridos(historial);
      setUserStats(stats);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatSpeed = (mps: number): string => {
    const kmh = mps * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  const getSpeedKmh = (mps: number): number => {
    return mps * 3.6;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const periodLabels: Record<PeriodFilter, string> = {
    all: 'Todos',
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
  };

  const leaderboardLabels: Record<LeaderboardPeriod, string> = {
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
  };

  const getDisplayName = (entry: LeaderboardEntry): string => {
    return entry.alias || entry.email;
  };

  if (loading && !userStats) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        </View>
      </WithBottomTabBar>
    );
  }

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
          <View style={styles.overlay} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <AvatarCircle avatar={currentUser?.avatar} size={50} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Historial</Text>
              <Text style={styles.subtitle}>Tus recorridos anteriores</Text>
            </View>
          </View>

          {/* Dashboard de Métricas */}
          {userStats && (
            <>
              {/* Métricas principales mejoradas */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardPrimary]}>
                  <View style={styles.statCardHeader}>
                    <Text style={styles.statCardIcon}>📍</Text>
                    <Text style={styles.statCardLabel}>Kilómetros</Text>
                  </View>
                  <Text style={styles.statCardValue}>
                    {userStats.totalKilometros.toFixed(1)}
                  </Text>
                  <Text style={styles.statCardUnit}>km</Text>
                </View>

                <View style={[styles.statCard, styles.statCardSecondary]}>
                  <View style={styles.statCardHeader}>
                    <Text style={styles.statCardIcon}>🛼</Text>
                    <Text style={styles.statCardLabel}>Recorridos</Text>
                  </View>
                  <Text style={styles.statCardValue}>{userStats.totalRecorridos}</Text>
                  <Text style={styles.statCardUnit}>viajes</Text>
                </View>

                <View style={[styles.statCard, styles.statCardAccent]}>
                  <View style={styles.statCardHeader}>
                    <Text style={styles.statCardIcon}>⚡</Text>
                    <Text style={styles.statCardLabel}>Velocidad</Text>
                  </View>
                  <Text style={styles.statCardValue}>
                    {getSpeedKmh(userStats.velocidadPromedioGeneral).toFixed(1)}
                  </Text>
                  <Text style={styles.statCardUnit}>km/h</Text>
                </View>

                <View style={[styles.statCard, styles.statCardInfo]}>
                  <View style={styles.statCardHeader}>
                    <Text style={styles.statCardIcon}>⏱️</Text>
                    <Text style={styles.statCardLabel}>Tiempo Total</Text>
                  </View>
                  <Text style={styles.statCardValue}>
                    {formatDuration(userStats.duracionTotal)}
                  </Text>
                  <Text style={styles.statCardUnit}>activo</Text>
                </View>
              </View>

              {/* Métricas Adicionales Mejoradas */}
              <View style={styles.additionalStats}>
                <View style={styles.additionalStatsHeader}>
                  <Text style={styles.additionalStatsTitle}>📊 Resumen Periódico</Text>
                </View>
                <View style={styles.statRow}>
                  <View style={[styles.statIconContainer, styles.statIconWeek]}>
                    <Text style={styles.statIcon}>📅</Text>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statLabel}>Recorridos esta semana</Text>
                    <Text style={styles.statValue}>{userStats.recorridosSemana}</Text>
                  </View>
                </View>
                <View style={styles.statRow}>
                  <View style={[styles.statIconContainer, styles.statIconMonth]}>
                    <Text style={styles.statIcon}>📊</Text>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statLabel}>Recorridos este mes</Text>
                    <Text style={styles.statValue}>{userStats.recorridosMes}</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Leaderboard */}
          <View style={styles.leaderboardContainer}>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardTitle}>🏆 Top 10 por kilómetros</Text>
              <Text style={styles.leaderboardSubtitle}>
                Compite y motívate con otros usuarios
              </Text>
            </View>
            <View style={styles.leaderboardFilters}>
              {(Object.keys(leaderboardLabels) as LeaderboardPeriod[]).map(period => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.leaderboardFilterButton,
                    leaderboardPeriod === period && styles.leaderboardFilterButtonActive,
                  ]}
                  onPress={() => setLeaderboardPeriod(period)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.leaderboardFilterText,
                      leaderboardPeriod === period && styles.leaderboardFilterTextActive,
                    ]}>
                    {leaderboardLabels[period]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {leaderboard.length === 0 ? (
              <View style={styles.leaderboardEmpty}>
                <Text style={styles.leaderboardEmptyText}>
                  No hay datos para este período
                </Text>
              </View>
            ) : (
              <View style={styles.leaderboardList}>
                {leaderboard.map((entry, index) => (
                  <View
                    key={entry.userId}
                    style={[
                      styles.leaderboardItem,
                      index === 0 && styles.leaderboardItemFirst,
                    ]}>
                    <View style={styles.leaderboardRank}>
                      <Text style={styles.leaderboardRankText}>
                        {index + 1}
                      </Text>
                    </View>
                    <AvatarCircle avatar={entry.avatar} size={40} />
                    <View style={styles.leaderboardInfo}>
                      <Text style={styles.leaderboardName} numberOfLines={1}>
                        {getDisplayName(entry)}
                      </Text>
                      <Text style={styles.leaderboardMeta}>
                        {entry.totalRecorridos} recorridos
                      </Text>
                    </View>
                    <View style={styles.leaderboardKm}>
                      <Text style={styles.leaderboardKmValue}>
                        {entry.totalKilometros.toFixed(1)}
                      </Text>
                      <Text style={styles.leaderboardKmLabel}>km</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Filtros Mejorados */}
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>🔍 Filtrar por período</Text>
            </View>
            <View style={styles.filtersRow}>
              {(Object.keys(periodLabels) as PeriodFilter[]).map(period => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.filterButton,
                    selectedPeriod === period && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedPeriod === period && styles.filterButtonTextActive,
                    ]}>
                    {periodLabels[period]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Lista de Recorridos Mejorada */}
          <View style={styles.recorridosContainer}>
            <View style={styles.recorridosHeader}>
              <Text style={styles.recorridosTitle}>
                🗺️ Mis Recorridos
              </Text>
              <View style={styles.recorridosBadge}>
                <Text style={styles.recorridosBadgeText}>{recorridos.length}</Text>
              </View>
            </View>

            {recorridos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛤️</Text>
                <Text style={styles.emptyText}>
                  No hay recorridos en este período
                </Text>
                <Text style={styles.emptySubtext}>
                  Inicia un recorrido desde la pantalla de Navegación
                </Text>
              </View>
            ) : (
              recorridos.map((recorrido, index) => (
                <TouchableOpacity
                  key={recorrido.id}
                  style={[
                    styles.recorridoCard,
                    index === 0 && styles.recorridoCardHighlight,
                  ]}
                  onPress={() => {
                    navigation.navigate('SeguimientoCompartido', {
                      seguimientoId: recorrido.id,
                    });
                  }}
                  activeOpacity={0.8}>
                  {/* Header de la tarjeta */}
                  <View style={styles.recorridoCardHeader}>
                    <View style={styles.recorridoDateContainer}>
                      <Text style={styles.recorridoDateIcon}>📅</Text>
                      <Text style={styles.recorridoDate}>
                        {formatDate(recorrido.creado_en)}
                      </Text>
                    </View>
                    <View style={styles.recorridoArrow}>
                      <Text style={styles.arrowText}>→</Text>
                    </View>
                  </View>

                  {/* Ruta */}
                  <View style={styles.recorridoRouteContainer}>
                    <View style={styles.routePoint}>
                      <View style={styles.routeDot} />
                      <Text style={styles.recorridoRoute} numberOfLines={1}>
                        {recorrido.origen}
                      </Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, styles.routeDotDest]} />
                      <Text style={[styles.recorridoRoute, styles.recorridoRouteDest]} numberOfLines={1}>
                        {recorrido.destino}
                      </Text>
                    </View>
                  </View>

                  {/* Estadísticas mejoradas */}
                  {recorrido.stats && (
                    <View style={styles.recorridoStats}>
                      <View style={styles.recorridoStatItem}>
                        <View style={styles.recorridoStatIconContainer}>
                          <Text style={styles.recorridoStatIcon}>📏</Text>
                        </View>
                        <View style={styles.recorridoStatContent}>
                          <Text style={styles.recorridoStatLabel}>Distancia</Text>
                          <Text style={styles.recorridoStatValue}>
                            {formatDistance(recorrido.stats.distanciaTotal)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.recorridoStatItem}>
                        <View style={styles.recorridoStatIconContainer}>
                          <Text style={styles.recorridoStatIcon}>⚡</Text>
                        </View>
                        <View style={styles.recorridoStatContent}>
                          <Text style={styles.recorridoStatLabel}>Vel. Prom.</Text>
                          <Text style={styles.recorridoStatValue}>
                            {formatSpeed(recorrido.stats.velocidadPromedio)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.recorridoStatItem}>
                        <View style={styles.recorridoStatIconContainer}>
                          <Text style={styles.recorridoStatIcon}>⏱️</Text>
                        </View>
                        <View style={styles.recorridoStatContent}>
                          <Text style={styles.recorridoStatLabel}>Duración</Text>
                          <Text style={styles.recorridoStatValue}>
                            {formatDuration(recorrido.stats.duracion)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.recorridoStatItem}>
                        <View style={styles.recorridoStatIconContainer}>
                          <Text style={styles.recorridoStatIcon}>📍</Text>
                        </View>
                        <View style={styles.recorridoStatContent}>
                          <Text style={styles.recorridoStatLabel}>Puntos</Text>
                          <Text style={styles.recorridoStatValue}>
                            {recorrido.stats.numPuntos}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
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
    opacity: 0.45,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 30, 0.6)',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 31,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 21,
    color: '#FFF',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
  },
  statCardPrimary: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  statCardSecondary: {
    borderColor: '#34C759',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  statCardAccent: {
    borderColor: '#FF9500',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  statCardInfo: {
    borderColor: '#5856D6',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statCardIcon: {
    fontSize: 20,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  statCardUnit: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  additionalStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  additionalStatsHeader: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  additionalStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statIconWeek: {
    backgroundColor: '#E3F2FD',
  },
  statIconMonth: {
    backgroundColor: '#E8F5E9',
  },
  statIcon: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  filtersContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filtersHeader: {
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  filterButtonTextActive: {
    color: '#FFF',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  recorridosContainer: {
    marginBottom: 20,
  },
  leaderboardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  leaderboardHeader: {
    padding: 16,
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 149, 0, 0.3)',
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardFilters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  leaderboardFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  leaderboardFilterButtonActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  leaderboardFilterText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardFilterTextActive: {
    color: '#FFF',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  leaderboardItemFirst: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  leaderboardRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardRankText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardMeta: {
    fontSize: 11,
    color: '#666',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardKm: {
    alignItems: 'flex-end',
  },
  leaderboardKmValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF9500',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardKmLabel: {
    fontSize: 10,
    color: '#666',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderboardEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  leaderboardEmptyText: {
    fontSize: 13,
    color: '#666',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  recorridosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recorridosTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  recorridosBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  recorridosBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  recorridoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  recorridoCardHighlight: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  recorridoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recorridoDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recorridoDateIcon: {
    fontSize: 16,
  },
  recorridoDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  recorridoArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  arrowText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  recorridoRouteContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#34C759',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  routeDotDest: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#007AFF',
    marginLeft: 5,
    opacity: 0.5,
  },
  recorridoRoute: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  recorridoRouteDest: {
    color: '#FF3B30',
  },
  recorridoStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
  },
  recorridoStatItem: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  recorridoStatIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recorridoStatIcon: {
    fontSize: 18,
  },
  recorridoStatContent: {
    flex: 1,
  },
  recorridoStatLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  recorridoStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
});
