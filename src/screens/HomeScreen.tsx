import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import authService from '../services/authService';
import {Usuario} from '../types';
import {Button} from '../components/Button';
import {AvatarCircle} from '../components/AvatarCircle';
import {WithBottomTabBar} from '../components/WithBottomTabBar';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    loadUsuario();
  }, []);

  const loadUsuario = async () => {
    const currentUser = await authService.getCurrentUser();
    setUsuario(currentUser);
  };

  const handleLogout = async () => {
    // Función para ejecutar el logout
    const performLogout = async () => {
      try {
        // Cerrar sesión
        await authService.logout();
        
        // Resetear la navegación para ir a Login y limpiar el stack
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Aun así, intentar navegar a Login
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      }
    };

    // En web, usar confirm nativo del navegador
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (confirmed) {
        await performLogout();
      }
    } else {
      // En móvil, usar Alert
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
      );
    }
  };

  if (!usuario) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      </WithBottomTabBar>
    );
  }

  const getProfileBadgeColor = () => {
    if (usuario.tipoPerfil === 'administrador') return '#FF3B30';
    if (usuario.tipoPerfil === 'liderGrupo') return '#007AFF';
    return '#34C759';
  };

  const getProfileBadgeText = () => {
    if (usuario.tipoPerfil === 'administrador') return 'Administrador';
    if (usuario.tipoPerfil === 'liderGrupo') return 'Líder de Grupo';
    return 'Roller';
  };

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
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header con gradiente */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <AvatarCircle avatar={usuario.avatar} size={70} />
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>¡Hola!</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {usuario.alias || usuario.email.split('@')[0]}
                </Text>
                <View style={[styles.badge, {backgroundColor: getProfileBadgeColor()}]}>
                  <Text style={styles.badgeText}>{getProfileBadgeText()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cards de información */}
          <View style={styles.cardsContainer}>
            {/* Card de perfil */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>👤</Text>
                <Text style={styles.cardTitle}>Información Personal</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Edad:</Text>
                  <Text style={styles.infoValue}>{usuario.edad} años</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sexo:</Text>
                  <Text style={styles.infoValue}>
                    {usuario.sexo.charAt(0).toUpperCase() + usuario.sexo.slice(1)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Idioma:</Text>
                  <Text style={styles.infoValue}>
                    {usuario.nacionalidad === 'español' ? 'Español' : 'English'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Registrado:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(usuario.fechaRegistro).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Accesos rápidos */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Navegacion')}>
                  <Text style={styles.quickActionIcon}>🗺️</Text>
                  <Text style={styles.quickActionText}>Navegación</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Historial')}>
                  <Text style={styles.quickActionIcon}>📊</Text>
                  <Text style={styles.quickActionText}>Historial</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Calendario')}>
                  <Text style={styles.quickActionIcon}>📅</Text>
                  <Text style={styles.quickActionText}>Eventos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Comunidad')}>
                  <Text style={styles.quickActionIcon}>💬</Text>
                  <Text style={styles.quickActionText}>Comunidad</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de cerrar sesión */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: (Dimensions.get('window').width - 60) / 2,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

