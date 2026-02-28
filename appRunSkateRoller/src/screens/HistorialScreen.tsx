import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import {Usuario} from '../types';
import seguimientoService, {
  SeguimientoHistoryItem,
  LeaderboardItem,
} from '../services/seguimientoService';

interface HistorialScreenProps {
  navigation: any;
}

export const HistorialScreen: React.FC<HistorialScreenProps> = ({
  navigation,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 380;
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [history, setHistory] = useState<SeguimientoHistoryItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        const [historyResponse, leaderboardResponse] = await Promise.all([
          seguimientoService.getHistory('all'),
          seguimientoService.getLeaderboard('year', 10),
        ]);

        if (historyResponse.success) {
          setHistory(historyResponse.data || []);
        } else {
          setError(historyResponse.error || 'No se pudo cargar el historial');
        }

        if (leaderboardResponse.success) {
          setLeaderboard(leaderboardResponse.data || []);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
        setError('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const januaryHistory = useMemo(() => {
    return history.filter(item => {
      const created = new Date(item.creado_en);
      return created.getFullYear() === 2026 && created.getMonth() === 0;
    });
  }, [history]);

  const januaryStats = useMemo(() => {
    const totalRecorridos = januaryHistory.length;
    let totalKm = 0;
    let totalDuracion = 0;
    const velocidades = [];

    for (const item of januaryHistory) {
      const stats = item.stats;
      if (stats) {
        totalKm += stats.distanciaTotal / 1000;
        totalDuracion += stats.duracion;
        if (stats.velocidadPromedio > 0) {
          velocidades.push(stats.velocidadPromedio);
        }
      }
    }

    const velocidadPromedio =
      velocidades.length > 0
        ? velocidades.reduce((sum, v) => sum + v, 0) / velocidades.length
        : 0;

    return {
      totalRecorridos,
      totalKm,
      totalDuracion,
      velocidadPromedio,
    };
  }, [januaryHistory]);

  const formatDuration = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) {
      return '0 min';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return `${hours} h ${rem} min`;
  };

  const getCaloriesEstimate = (totalKm: number) => {
    if (!totalKm || Number.isNaN(totalKm)) {
      return 0;
    }
    return Math.round(totalKm * 50);
  };

  const getDisplayName = (item: LeaderboardItem) => {
    if (item.alias && item.alias.trim()) {
      return item.alias;
    }
    return item.email.split('@')[0];
  };

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  const topThree = leaderboard.slice(0, 3);
  const topTen = leaderboard.slice(0, 10);

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        {/* Imagen de fondo a pantalla completa */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/comunidad-fondo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.contentContainer}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <AvatarCircle avatar={currentUser?.avatar} size={50} />
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Historial</Text>
                <Text style={styles.subtitle}>Resumen mensual</Text>
              </View>
            </View>
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Cargando historial...</Text>
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Rating Roller</Text>
                  {leaderboard.length === 0 ? (
                    <Text style={styles.emptyText}>
                      Aún no hay datos suficientes para el ranking.
                    </Text>
                  ) : (
                    <View style={styles.honorContent}>
                      <View style={styles.podiumContainer}>
                        <View style={styles.podiumColumn}>
                          <View style={[styles.podiumMedalWrapper, styles.podiumMedalSilver]}>
                            <Text style={styles.podiumRibbon}>🎖️</Text>
                          <View style={[styles.podiumAvatarRing, styles.podiumAvatarRingSilver]}>
                              <AvatarCircle
                                avatar={topThree[1]?.avatar || undefined}
                                size={44}
                              />
                            </View>
                          </View>
                          <Text style={styles.podiumName}>
                            {topThree[1] ? getDisplayName(topThree[1]) : '—'}
                          </Text>
                          <View
                            style={[
                              styles.podiumBlock,
                              styles.podiumSecond,
                              isSmallScreen && styles.podiumSecondSmall,
                            ]}>
                            <Text style={styles.podiumPlace}>2</Text>
                          </View>
                        </View>
                        <View style={styles.podiumColumn}>
                          <View style={[styles.podiumMedalWrapper, styles.podiumMedalGold]}>
                            <Text style={styles.podiumRibbon}>🎖️</Text>
                          <View style={[styles.podiumAvatarRing, styles.podiumAvatarRingGold]}>
                              <AvatarCircle
                                avatar={topThree[0]?.avatar || undefined}
                                size={48}
                              />
                            </View>
                          </View>
                          <Text style={styles.podiumName}>
                            {topThree[0] ? getDisplayName(topThree[0]) : '—'}
                          </Text>
                          <View
                            style={[
                              styles.podiumBlock,
                              styles.podiumFirst,
                              isSmallScreen && styles.podiumFirstSmall,
                            ]}>
                            <Text style={styles.podiumPlace}>1</Text>
                          </View>
                        </View>
                        <View style={styles.podiumColumn}>
                          <View style={[styles.podiumMedalWrapper, styles.podiumMedalBronze]}>
                            <Text style={styles.podiumRibbon}>🎖️</Text>
                          <View style={[styles.podiumAvatarRing, styles.podiumAvatarRingBronze]}>
                              <AvatarCircle
                                avatar={topThree[2]?.avatar || undefined}
                                size={44}
                              />
                            </View>
                          </View>
                          <Text style={styles.podiumName}>
                            {topThree[2] ? getDisplayName(topThree[2]) : '—'}
                          </Text>
                          <View
                            style={[
                              styles.podiumBlock,
                              styles.podiumThird,
                              isSmallScreen && styles.podiumThirdSmall,
                            ]}>
                            <Text style={styles.podiumPlace}>3</Text>
                          </View>
                        </View>
                      </View>

                      <View style={[styles.leaderList, isSmallScreen && styles.leaderListSmall]}>
                        <Text style={styles.leaderListTitle}>Top 10</Text>
                        <ScrollView
                          contentContainerStyle={styles.leaderListContent}
                          showsVerticalScrollIndicator
                          indicatorStyle="white">
                          {topTen.map((item, index) => (
                            <View
                              key={item.userId}
                              style={[styles.leaderRow, isSmallScreen && styles.leaderRowSmall]}>
                              <Text style={styles.leaderMedal}>{getMedal(index)}</Text>
                              <AvatarCircle
                                avatar={item.avatar || undefined}
                                size={isSmallScreen ? 26 : 30}
                              />
                              <View style={styles.leaderInfo}>
                                <Text style={styles.leaderName}>{getDisplayName(item)}</Text>
                                <Text style={styles.leaderMeta}>
                                  {item.totalKilometros.toFixed(2)} km
                                </Text>
                              </View>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Resumen mensual</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                      <View style={styles.summaryHeader}>
                        <Text style={styles.summaryLabel}>KM</Text>
                        <Text style={styles.summaryIcon}>🛼</Text>
                      </View>
                      <Text style={styles.summaryValue}>
                        {januaryStats.totalKm.toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <View style={styles.summaryHeader}>
                        <Text style={styles.summaryLabel}>Tiempo</Text>
                        <Text style={styles.summaryIcon}>⏱️</Text>
                      </View>
                      <Text style={styles.summaryValue}>
                        {formatDuration(januaryStats.totalDuracion)}
                      </Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <View style={styles.summaryHeader}>
                        <Text style={styles.summaryLabel}>Calorías</Text>
                        <Text style={styles.summaryIcon}>🔥</Text>
                      </View>
                      <Text style={styles.summaryValue}>
                        {getCaloriesEstimate(januaryStats.totalKm)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Recorridos</Text>
                  {januaryHistory.length === 0 ? (
                    <Text style={styles.emptyText}>No hay recorridos para enero 2026.</Text>
                  ) : (
                    januaryHistory.map(item => (
                      <View key={item.id} style={styles.card}>
                        <Text style={styles.cardTitle}>
                          {item.origen || 'Origen'} → {item.destino || 'Destino'}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          {new Date(item.creado_en).toLocaleString('es-ES')}
                        </Text>
                        <View style={styles.cardStatsRow}>
                          <Text style={styles.cardStat}>
                            {(item.stats?.distanciaTotal ? item.stats.distanciaTotal / 1000 : 0).toFixed(2)} km
                          </Text>
                          <Text style={styles.cardStat}>
                            {formatDuration(item.stats?.duracion || 0)}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 10},
    elevation: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  subtitle: {
    fontSize: 16,
    color: '#67E8F9',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  sectionBlock: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#CBD5F5',
    marginBottom: 8,
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardStat: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  honorContent: {
    flexDirection: 'row',
    gap: 12,
  },
  podiumContainer: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },
  podiumMedalWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podiumRibbon: {
    fontSize: 18,
    marginBottom: -6,
    zIndex: 2,
  },
  podiumAvatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  podiumAvatarRingGold: {
    borderColor: '#FBBF24',
  },
  podiumAvatarRingSilver: {
    borderColor: '#CBD5E1',
  },
  podiumAvatarRingBronze: {
    borderColor: '#D9A25F',
  },
  podiumMedalGold: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  podiumMedalSilver: {
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  podiumMedalBronze: {
    shadowColor: '#D9A25F',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  podiumName: {
    fontSize: 15,
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  podiumBlock: {
    width: '90%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumFirst: {
    height: 120,
    backgroundColor: '#FBBF24',
  },
  podiumSecond: {
    height: 95,
    backgroundColor: '#CBD5E1',
  },
  podiumThird: {
    height: 85,
    backgroundColor: '#D9A25F',
  },
  podiumFirstSmall: {
    height: 100,
  },
  podiumSecondSmall: {
    height: 80,
  },
  podiumThirdSmall: {
    height: 72,
  },
  podiumPlace: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  leaderList: {
    flex: 0.8,
    maxHeight: 240,
    borderRadius: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  leaderListSmall: {
    maxHeight: 210,
  },
  leaderListTitle: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  leaderListContent: {
    paddingBottom: 6,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  leaderRowSmall: {
    gap: 8,
    paddingVertical: 3,
  },
  leaderMedal: {
    width: 26,
    textAlign: 'center',
    fontSize: 18,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  leaderMeta: {
    color: '#CBD5F5',
    fontSize: 12,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  errorText: {
    color: '#FFCDD2',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  emptyText: {
    color: '#F2F2F2',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
});

