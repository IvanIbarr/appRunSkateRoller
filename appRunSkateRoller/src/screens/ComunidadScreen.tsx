import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {LaunchPhaseBanner} from '../components/LaunchPhaseBanner';
import {ChatGeneral} from '../components/ChatGeneral';
import {ChatStaff} from '../components/ChatStaff';
import authService from '../services/authService';
import grupoService from '../services/grupoService';
import {Usuario, TipoPerfil} from '../types';

interface ComunidadScreenProps {
  navigation: any;
}

type ChatTab = 'general' | 'staff';

export const ComunidadScreen: React.FC<ComunidadScreenProps> = ({
  navigation,
}) => {
  const [activeTab, setActiveTab] = useState<ChatTab>('general');
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [nombreGrupo, setNombreGrupo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestGeneralTs, setLatestGeneralTs] = useState(0);
  const [latestStaffTs, setLatestStaffTs] = useState(0);
  const seenGeneralRef = useRef(0);
  const seenStaffRef = useRef(0);

  // Verificar si el usuario puede ver el chat de staff
  const canViewStaffChat = (tipoPerfil?: TipoPerfil): boolean => {
    return tipoPerfil === 'administrador' || tipoPerfil === 'liderGrupo';
  };

  const canViewStaff = canViewStaffChat(currentUser?.tipoPerfil);
  const userName = currentUser?.email ? currentUser.email.split('@')[0] : 'Usuario';

  // Construir el texto del tab de staff con el nombre del grupo
  const staffTabText = nombreGrupo ? `Chat Staff ${nombreGrupo}` : 'Chat Staff';

  const hasNewGeneral = latestGeneralTs > (seenGeneralRef.current || 0);
  const hasNewStaff = latestStaffTs > (seenStaffRef.current || 0);

  const setActiveTabAndMarkSeen = (next: ChatTab) => {
    setActiveTab(next);
    if (next === 'general') {
      seenGeneralRef.current = Math.max(seenGeneralRef.current, latestGeneralTs);
    } else {
      seenStaffRef.current = Math.max(seenStaffRef.current, latestStaffTs);
    }
  };

  const panResponder = useMemo(() => {
    if (!canViewStaff) {
      return null;
    }
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const {dx, dy} = gestureState;
        return Math.abs(dx) > 16 && Math.abs(dy) < 22;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const {dx, dy, vx} = gestureState;
        if (Math.abs(dy) > 28) {
          return;
        }
        const strongSwipe = Math.abs(dx) > 42 || Math.abs(vx) > 0.45;
        if (!strongSwipe) {
          return;
        }
        if (dx < 0) {
          // swipe izquierda -> staff
          setActiveTabAndMarkSeen('staff');
        } else {
          // swipe derecha -> general
          setActiveTabAndMarkSeen('general');
        }
      },
    });
  }, [canViewStaff, latestGeneralTs, latestStaffTs]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      // Si el usuario no puede ver staff, asegurar que esté en general
      if (user && !canViewStaffChat(user.tipoPerfil)) {
        setActiveTab('general');
      }

      // Cargar nombre del grupo si el usuario puede ver staff
      if (user && canViewStaffChat(user.tipoPerfil)) {
        await loadNombreGrupo();
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNombreGrupo = async () => {
    try {
      const response = await grupoService.getNombreGrupo();
      if (response.success && response.nombreGrupo) {
        setNombreGrupo(response.nombreGrupo);
      }
    } catch (error) {
      console.error('Error cargando nombre del grupo:', error);
      // Si hay error, no mostrar nombre del grupo
      setNombreGrupo(null);
    }
  };

  if (loading) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      </WithBottomTabBar>
    );
  }

  if (!currentUser) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No se pudo cargar la información del usuario</Text>
          </View>
        </View>
      </WithBottomTabBar>
    );
  }

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
          <View style={styles.backgroundOverlay} />
        </View>

        {/* Contenido sobre el fondo */}
        <View style={styles.contentContainer}>
          <LaunchPhaseBanner screenRouteName="Comunidad" />
          {/* Tabs de navegación */}
          <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'general' && styles.activeTab,
              hasNewGeneral && activeTab !== 'general' && styles.tabGlowGeneral,
            ]}
            onPress={() => setActiveTabAndMarkSeen('general')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'general' && styles.activeTabText,
              ]}>
              Chat General
            </Text>
          </TouchableOpacity>

          {/* Línea separadora entre los tabs */}
          {canViewStaff && (
            <View style={styles.tabSeparator} />
          )}

          {canViewStaff && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'staff' && styles.activeTab,
                hasNewStaff && activeTab !== 'staff' && styles.tabGlowStaff,
              ]}
              onPress={() => setActiveTabAndMarkSeen('staff')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'staff' && styles.activeTabText,
                ]}>
                {staffTabText}
              </Text>
            </TouchableOpacity>
          )}
          </View>

          {/* Contenido del chat activo */}
          <View
            style={styles.chatContainer}
            {...(panResponder ? panResponder.panHandlers : {})}>
            {/* Montamos ambos para poder mostrar indicador de “nuevos” en tabs */}
            <View
              pointerEvents={activeTab === 'general' ? 'auto' : 'none'}
              style={[
                styles.chatPane,
                activeTab === 'general' ? styles.chatPaneActive : styles.chatPaneHidden,
              ]}>
              <ChatGeneral
                currentUserId={currentUser.id}
                currentUserName={userName}
                onLatestTimestamp={(tsMs) => {
                  setLatestGeneralTs(prev => (tsMs > prev ? tsMs : prev));
                  if (activeTab === 'general') {
                    seenGeneralRef.current = Math.max(seenGeneralRef.current, tsMs);
                  }
                }}
              />
            </View>
            {canViewStaff ? (
              <View
                pointerEvents={activeTab === 'staff' ? 'auto' : 'none'}
                style={[
                  styles.chatPane,
                  activeTab === 'staff' ? styles.chatPaneActive : styles.chatPaneHidden,
                ]}>
                <ChatStaff
                  currentUserId={currentUser.id}
                  currentUserName={userName}
                  onLatestTimestamp={(tsMs) => {
                    setLatestStaffTs(prev => (tsMs > prev ? tsMs : prev));
                    if (activeTab === 'staff') {
                      seenStaffRef.current = Math.max(seenStaffRef.current, tsMs);
                    }
                  }}
                />
              </View>
            ) : null}
          </View>
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
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 12, 24, 0.55)',
  },
  contentContainer: {
    flex: 1,
    minHeight: 0,
    zIndex: 1,
    paddingTop: Platform.OS === 'web' ? 10 : 4,
    paddingBottom: 0,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    alignItems: 'center',
    // Sin fondo para que resalte la imagen de atrás
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 24, 38, 0.72)',
    borderRadius: 18,
    marginHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  activeTab: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  tabGlowGeneral: {
    shadowColor: '#38BDF8',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  tabGlowStaff: {
    shadowColor: '#34C759',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  tabSeparator: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6,
  },
  chatContainer: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'rgba(12, 16, 28, 0.78)',
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  chatPane: {
    ...StyleSheet.absoluteFillObject,
  },
  chatPaneActive: {
    opacity: 1,
  },
  chatPaneHidden: {
    opacity: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});

