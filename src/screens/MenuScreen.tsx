import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarSelector} from '../components/AvatarSelector';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import grupoService from '../services/grupoService';
import {Usuario, TipoPerfil} from '../types';

interface MenuScreenProps {
  navigation: any;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  navigation,
}) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [liderId, setLiderId] = useState<string | null>(null);
  const [avatarSelectorVisible, setAvatarSelectorVisible] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      // Si el usuario tiene perfil de líder, cargar el liderId del grupo
      if (user && (user.tipoPerfil === 'liderGrupo' || user.tipoPerfil === 'administrador')) {
        await loadLiderId();
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const loadLiderId = async () => {
    try {
      const response = await grupoService.getIntegrantesGrupo();
      if (response.success && response.liderId) {
        setLiderId(response.liderId);
      }
    } catch (error) {
      console.error('Error cargando liderId:', error);
      setLiderId(null);
    }
  };

  const canManageStaff = (): boolean => {
    // Solo el líder principal del grupo puede gestionar staff
    // No importa el nombramiento, solo importa si es el líder principal
    if (!currentUser) {
      return false;
    }
    
    // Solo administradores y líderes de grupo pueden gestionar staff
    const isLeaderProfile = currentUser.tipoPerfil === 'liderGrupo' || currentUser.tipoPerfil === 'administrador';
    if (!isLeaderProfile) {
      return false;
    }
    
    // Solo el líder principal del grupo (el que creó el grupo) puede gestionar staff
    // Si no hay liderId o el usuario no es el líder principal, no puede gestionar
    if (!liderId || currentUser.id !== liderId) {
      return false;
    }
    
    return true;
  };
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('MenuScreen: Iniciando logout...');
              
              // Cerrar sesión: limpiar token y usuario del almacenamiento
              await authService.logout();
              console.log('MenuScreen: Logout completado, datos limpiados');
              
              // Resetear completamente el stack de navegación y redirigir a Login
              // Esto limpia todo el historial de navegación y permite un inicio limpio
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{name: 'Login'}],
                }),
              );
              
              console.log('MenuScreen: Navegación reseteada a Login');
            } catch (error) {
              console.error('MenuScreen: Error al cerrar sesión:', error);
              // Aun así, intentar resetear la navegación
              try {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{name: 'Login'}],
                  }),
                );
              } catch (navError) {
                console.error('MenuScreen: Error al resetear navegación:', navError);
                // Último recurso: usar replace
                try {
                  navigation.replace('Login');
                } catch (replaceError) {
                  console.error('MenuScreen: Error al usar replace:', replaceError);
                }
              }
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleSelectAvatar = async (avatar: string) => {
    setUpdatingAvatar(true);
    setAvatarMessage(null);
    
    try {
      const result = await authService.updateAvatar(avatar);
      
      if (result.success && result.usuario) {
        setCurrentUser(result.usuario);
        setAvatarMessage('✓ Avatar actualizado exitosamente');
        setAvatarSelectorVisible(false);
        
        // Limpiar mensaje después de 2 segundos
        setTimeout(() => {
          setAvatarMessage(null);
        }, 2000);
      } else {
        setAvatarMessage('⚠️ Error al actualizar avatar');
      }
    } catch (error) {
      console.error('Error al actualizar avatar:', error);
      setAvatarMessage('⚠️ Error al actualizar avatar');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        {/* Imagen de fondo a pantalla completa */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/menu-fondo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        {/* Contenido sobre el fondo */}
        <ScrollView 
          style={styles.contentScroll}
          contentContainerStyle={styles.content}>
          <Text style={styles.title}>Menú</Text>
          <Text style={styles.subtitle}>
            Configuración y opciones de la aplicación
          </Text>
          
          {currentUser?.email && (
            <Text style={styles.userEmail}>{currentUser.email}</Text>
          )}

          {/* Avatar en la parte superior izquierda */}
          <View style={styles.avatarContainer}>
            <AvatarCircle avatar={currentUser?.avatar} size={60} />
            <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={() => setAvatarSelectorVisible(true)}>
              <Text style={styles.changeAvatarButtonText}>
                {currentUser?.avatar ? '✏️ Modificar Avatar' : '➕ Agregar Avatar'}
              </Text>
            </TouchableOpacity>
            {avatarMessage && (
              <Text style={styles.avatarMessage}>{avatarMessage}</Text>
            )}
          </View>

          <View style={styles.menuSection}>
            {/* Botones de Alias - visibles para todos los perfiles */}
            {!currentUser?.alias ? (
              <TouchableOpacity
                style={styles.aliasButton}
                onPress={() => navigation.navigate('AgregarAlias')}>
                <Text style={styles.aliasButtonText}>➕ Agregar Alias</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.aliasButton}
                onPress={() => navigation.navigate('CambiarAlias')}>
                <Text style={styles.aliasButtonText}>✏️ Cambiar de Alias</Text>
              </TouchableOpacity>
            )}
            {canManageStaff() && (
              <>
                <TouchableOpacity
                  style={styles.addStaffButton}
                  onPress={() => navigation.navigate('AgregarStaff')}>
                  <Text style={styles.addStaffButtonText}>➕ Agregar Staff</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nombreGrupoButton}
                  onPress={() => navigation.navigate('NombreGrupo')}>
                  <Text style={styles.nombreGrupoButtonText}>📝 Nombre del Grupo</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Botón de Integrantes del Grupo - visible para líderes y miembros del grupo */}
            {(canManageStaff() || 
              (currentUser?.tipoPerfil === 'liderGrupo' && currentUser?.grupoId) ||
              (currentUser?.tipoPerfil === 'roller' && currentUser?.grupoId)) && (
              <TouchableOpacity
                style={styles.integrantesButton}
                onPress={() => navigation.navigate('IntegrantesGrupo')}>
                <Text style={styles.integrantesButtonText}>👥 Integrantes del Grupo</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Modal de Selección de Avatar */}
      <AvatarSelector
        visible={avatarSelectorVisible}
        onClose={() => setAvatarSelectorVisible(false)}
        onSelectAvatar={handleSelectAvatar}
        selectedAvatar={currentUser?.avatar || null}
      />
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
  contentScroll: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 31,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 21,
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.9,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  menuSection: {
    marginTop: 20,
  },
  addStaffButton: {
    backgroundColor: '#34C759',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#34C759',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
  },
  addStaffButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  nombreGrupoButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
  },
  nombreGrupoButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  aliasButton: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
  },
  aliasButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  integrantesButton: {
    backgroundColor: '#9B59B6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#9B59B6',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
  },
  integrantesButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  changeAvatarButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  changeAvatarButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  avatarMessage: {
    marginTop: 8,
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
});
