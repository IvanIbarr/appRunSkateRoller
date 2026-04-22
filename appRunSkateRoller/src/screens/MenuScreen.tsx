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
  ActivityIndicator,
} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarSelector} from '../components/AvatarSelector';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import grupoService from '../services/grupoService';
import {Usuario, TipoPerfil} from '../types';
import adminGateService from '../services/adminGateService';
import {getLaunchPhaseLabel, LAUNCH_PHASE} from '../config/launchPhase';

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
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setAdminUnlocked(await adminGateService.isUnlocked());
      
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
  const performLogout = async () => {
    try {
      console.log('MenuScreen: Iniciando logout...');
      await authService.logout();
      console.log('MenuScreen: Logout completado, datos limpiados');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Login'}],
        }),
      );
      console.log('MenuScreen: Navegación reseteada a Login');
    } catch (error) {
      console.error('MenuScreen: Error al cerrar sesión:', error);
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Login'}],
          }),
        );
      } catch (navError) {
        console.error('MenuScreen: Error al resetear navegación:', navError);
        try {
          navigation.replace('Login');
        } catch (replaceError) {
          console.error('MenuScreen: Error al usar replace:', replaceError);
        }
      }
    }
  };

  const handleLogout = () => {
    // En web, Alert con varios botones a veces no despacha bien onPress; usamos confirm nativo.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('¿Cerrar sesión? Se limpiarán el token y los datos de sesión en este dispositivo.')) {
        void performLogout();
      }
      return;
    }
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => void performLogout(),
      },
    ], {cancelable: true});
  };

  // Admin MASTER de la app (solo este usuario ve el módulo administrativo).
  const isMasterAdminUser = currentUser?.email === 'admin@roller.com';

  const handleOpenAdminBuzon = async () => {
    if (!isMasterAdminUser) {
      Alert.alert('Acceso denegado', 'Esta sección es solo para administración.');
      return;
    }
    const ok = await adminGateService.ensureUnlocked();
    setAdminUnlocked(ok);
    if (ok) {
      navigation.navigate('AdminBuzon');
    }
  };

  const handleOpenAdminUsuarios = async () => {
    if (!isMasterAdminUser) {
      Alert.alert('Acceso denegado', 'Esta sección es solo para administración.');
      return;
    }
    const ok = await adminGateService.ensureUnlocked();
    setAdminUnlocked(ok);
    if (ok) {
      navigation.navigate('AdminUsuarios');
    }
  };

  const handleOpenAdminChats = async () => {
    if (!isMasterAdminUser) {
      Alert.alert('Acceso denegado', 'Esta sección es solo para administración.');
      return;
    }
    const ok = await adminGateService.ensureUnlocked();
    setAdminUnlocked(ok);
    if (ok) {
      navigation.navigate('AdminChats');
    }
  };

  const handleOpenAdminReset = async () => {
    if (!isMasterAdminUser) {
      Alert.alert('Acceso denegado', 'Esta sección es solo para administración.');
      return;
    }
    const ok = await adminGateService.ensureUnlocked();
    setAdminUnlocked(ok);
    if (ok) {
      navigation.navigate('AdminResetPassword');
    }
  };

  const handleOpenAdminVentas = async () => {
    if (!isMasterAdminUser) {
      Alert.alert('Acceso denegado', 'Esta sección es solo para administración.');
      return;
    }
    const ok = await adminGateService.ensureUnlocked();
    setAdminUnlocked(ok);
    if (ok) {
      navigation.navigate('AdminVentasGenerales');
    }
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

  const handleSelectFotoPerfil = async (dataUri: string) => {
    setUpdatingAvatar(true);
    setAvatarMessage('⏳ Subiendo foto…');
    try {
      const result = await authService.updateFotoPerfil(dataUri);
      if (result.success && result.usuario) {
        setCurrentUser(result.usuario);
        setAvatarMessage('✓ Foto de perfil guardada');
        setAvatarSelectorVisible(false);
        setTimeout(() => setAvatarMessage(null), 2500);
      } else {
        setAvatarMessage('⚠️ No se pudo guardar la foto');
      }
    } catch (error) {
      console.error('Error al subir foto de perfil:', error);
      setAvatarMessage('⚠️ No se pudo guardar la foto');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handlePhotoPickStart = () => setUpdatingAvatar(true);
  const handlePhotoPickCancel = () => setUpdatingAvatar(false);

  const handleClearFotoPerfil = async () => {
    setUpdatingAvatar(true);
    setAvatarMessage(null);
    try {
      const result = await authService.updateFotoPerfil(null);
      if (result.success && result.usuario) {
        setCurrentUser(result.usuario);
        setAvatarMessage('✓ Foto quitada');
        setAvatarSelectorVisible(false);
        setTimeout(() => setAvatarMessage(null), 2000);
      } else {
        setAvatarMessage('⚠️ No se pudo quitar la foto');
      }
    } catch (error) {
      console.error('Error al quitar foto de perfil:', error);
      setAvatarMessage('⚠️ No se pudo quitar la foto');
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
            <AvatarCircle
              avatar={currentUser?.avatar}
              fotoPerfil={currentUser?.fotoPerfil}
              size={60}
            />
            <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={() => setAvatarSelectorVisible(true)}>
              <Text style={styles.changeAvatarButtonText}>
                {currentUser?.fotoPerfil || currentUser?.avatar
                  ? '✏️ Modificar Avatar'
                  : '➕ Agregar Avatar'}
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
              style={styles.archivoButton}
              onPress={() => navigation.navigate('RollerTipsArchive')}>
              <Text style={styles.archivoButtonText}>📁 Mis archivos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => navigation.navigate('SupportHelp')}>
              <Text style={styles.helpButtonText}>🆘 Ayuda y Asistencia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subsButton}
              onPress={() => navigation.navigate('MisSuscripciones')}>
              <Text style={styles.subsButtonText}>🧾 Mis suscripciones</Text>
            </TouchableOpacity>

            {isMasterAdminUser && (
              <>
                <TouchableOpacity style={styles.adminButton} onPress={handleOpenAdminUsuarios}>
                  <Text style={styles.adminButtonText}>
                    👥 Usuarios (Admin){adminUnlocked ? '' : ' 🔒'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.adminButton} onPress={handleOpenAdminChats}>
                  <Text style={styles.adminButtonText}>
                    💬 Ver chats (Admin){adminUnlocked ? '' : ' 🔒'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.adminButton} onPress={handleOpenAdminReset}>
                  <Text style={styles.adminButtonText}>
                    🔑 Reset password (Admin){adminUnlocked ? '' : ' 🔒'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.adminButton} onPress={handleOpenAdminVentas}>
                  <Text style={styles.adminButtonText}>
                    📊 Ventas Generales (Admin){adminUnlocked ? '' : ' 🔒'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.adminButton} onPress={handleOpenAdminBuzon}>
                  <Text style={styles.adminButtonText}>
                    🧰 Buzón (Admin){adminUnlocked ? '' : ' 🔒'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.ventasButton}
              onPress={() => navigation.navigate('MenuVentas')}>
              <Text style={styles.ventasButtonText}>🛒 Ventas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            {typeof __DEV__ !== 'undefined' && __DEV__ && (
              <Text style={styles.launchPhaseDevHint} testID="launchPhaseDev">
                Fase {LAUNCH_PHASE} — {getLaunchPhaseLabel()}
                {'\n'}
                (Web: REACT_APP_LAUNCH_PHASE; nativo: NATIVE_… en config/launchPhase)
              </Text>
            )}
          </View>
        </ScrollView>

        {updatingAvatar && (
          <View style={styles.uploadingOverlay} pointerEvents="auto">
            <View style={styles.uploadingBox}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.uploadingText}>Preparando o subiendo foto…</Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal de Selección de Avatar */}
      <AvatarSelector
        visible={avatarSelectorVisible}
        onClose={() => setAvatarSelectorVisible(false)}
        onSelectAvatar={handleSelectAvatar}
        selectedAvatar={currentUser?.avatar || null}
        fotoPerfil={currentUser?.fotoPerfil || null}
        onSelectFotoPerfil={handleSelectFotoPerfil}
        onClearFotoPerfil={handleClearFotoPerfil}
        fotoBusy={updatingAvatar}
        onPhotoPickStart={handlePhotoPickStart}
        onPhotoPickCancel={handlePhotoPickCancel}
      />
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  // Tipografía de marca en web (en nativo usa fuente del sistema)
  // Nota: en estilos de RN no podemos referenciar constantes fuera de StyleSheet de forma directa sin duplicar;
  // aquí solo centralizamos el string para evitar divergencias entre botones.
  // (RN-web acepta fontFamily con comillas).
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
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
  },
  uploadingBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 280,
  },
  uploadingText: {
    marginTop: 14,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
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
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  addStaffButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addStaffButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  nombreGrupoButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nombreGrupoButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  aliasButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aliasButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  integrantesButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  integrantesButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  archivoButton: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  archivoButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  helpButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  subsButton: {
    backgroundColor: '#334155',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subsButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  adminButton: {
    backgroundColor: '#0B1220',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.26)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  adminButtonText: {
    color: '#E0F2FE',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  ventasButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ventasButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
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
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  avatarMessage: {
    marginTop: 8,
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  launchPhaseDevHint: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    maxWidth: 360,
    alignSelf: 'center',
  },
});
