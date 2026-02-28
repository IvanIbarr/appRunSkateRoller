import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
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

  // Verificar si el usuario puede ver el chat de staff
  const canViewStaffChat = (tipoPerfil: TipoPerfil): boolean => {
    return tipoPerfil === 'administrador' || tipoPerfil === 'liderGrupo';
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

  const canViewStaff = canViewStaffChat(currentUser.tipoPerfil);
  const userName = currentUser.email.split('@')[0]; // Usar parte del email como nombre temporal
  
  // Construir el texto del tab de staff con el nombre del grupo
  const staffTabText = nombreGrupo 
    ? `Chat Staff ${nombreGrupo}`
    : 'Chat Staff';

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

        {/* Contenido sobre el fondo */}
        <View style={styles.contentContainer}>
          {/* Tabs de navegación */}
          <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'general' && styles.activeTab]}
            onPress={() => setActiveTab('general')}>
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
              style={[styles.tab, activeTab === 'staff' && styles.activeTab]}
              onPress={() => setActiveTab('staff')}>
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
          <View style={styles.chatContainer}>
            {activeTab === 'general' ? (
              <ChatGeneral
                currentUserId={currentUser.id}
                currentUserName={userName}
              />
            ) : (
              <ChatStaff
                currentUserId={currentUser.id}
                currentUserName={userName}
              />
            )}
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
  contentContainer: {
    flex: 1,
    zIndex: 1,
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
    // Sin fondo para que resalte la imagen de atrás
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFF',
  },
  tabSeparator: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 19, // 20% más grande (16 * 1.20 = 19.2, redondeado a 19)
    color: '#FFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  chatContainer: {
    flex: 1,
    // Sin fondo para que la imagen de fondo se vea completamente
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

