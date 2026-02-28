import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import grupoService from '../services/grupoService';
import authService from '../services/authService';
import staffService from '../services/staffService';
import {Usuario, TipoPerfil} from '../types';

interface IntegrantesGrupoScreenProps {
  navigation: any;
}

export const IntegrantesGrupoScreen: React.FC<IntegrantesGrupoScreenProps> = ({
  navigation,
}) => {
  const [integrantes, setIntegrantes] = useState<Usuario[]>([]);
  const [nombreGrupo, setNombreGrupo] = useState<string | null>(null);
  const [liderId, setLiderId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIntegrante, setSelectedIntegrante] = useState<Usuario | null>(null);
  const [updatingNombramiento, setUpdatingNombramiento] = useState(false);
  const [removingIntegrante, setRemovingIntegrante] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUser();
    loadIntegrantes();
    loadNombreGrupo();
  }, []);

  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const loadIntegrantes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await grupoService.getIntegrantesGrupo();

      if (response.success && response.integrantes) {
        setIntegrantes(response.integrantes);
        setLiderId(response.liderId || null);
        if (response.mensaje && response.integrantes.length === 0) {
          setError(response.mensaje);
        }
      } else {
        const errorMessage = response.error || 'No se pudieron cargar los integrantes';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error al cargar integrantes:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cargar los integrantes';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadNombreGrupo = async () => {
    try {
      console.log('[IntegrantesGrupoScreen] Cargando nombre del grupo...');
      const response = await grupoService.getNombreGrupo();
      console.log('[IntegrantesGrupoScreen] Respuesta completa:', JSON.stringify(response, null, 2));
      console.log('[IntegrantesGrupoScreen] response.success:', response.success);
      console.log('[IntegrantesGrupoScreen] response.nombreGrupo:', response.nombreGrupo);
      
      if (response.success) {
        const nombre = response.nombreGrupo;
        console.log('[IntegrantesGrupoScreen] Nombre del grupo a mostrar:', nombre);
        // Mostrar el nombre del grupo incluso si es null o string vacío
        // para que el usuario sepa que está en un grupo sin nombre
        setNombreGrupo(nombre || null);
        console.log('[IntegrantesGrupoScreen] Estado nombreGrupo actualizado a:', nombre || null);
      } else {
        console.warn('[IntegrantesGrupoScreen] getNombreGrupo no fue exitoso:', response.error);
        setNombreGrupo(null);
      }
    } catch (error) {
      console.error('[IntegrantesGrupoScreen] Error al cargar nombre del grupo:', error);
      console.error('[IntegrantesGrupoScreen] Detalles del error:', error instanceof Error ? error.message : String(error));
      // Si hay error, no mostrar nombre del grupo
      setNombreGrupo(null);
    }
  };

  const isLeader = (): boolean => {
    return currentUser?.tipoPerfil === 'liderGrupo' || currentUser?.tipoPerfil === 'administrador';
  };

  const canEditNombramientos = (): boolean => {
    // Solo el líder principal del grupo (el que creó el grupo) puede editar nombramientos
    // Los usuarios con nombramiento "nuevo" o sin nombramiento solo pueden ver en modo lectura
    if (!currentUser || !liderId) {
      return false;
    }
    // Solo el líder principal (el que creó el grupo) puede editar
    // Verificar si el usuario actual es el líder del grupo
    if (currentUser.id !== liderId) {
      return false;
    }
    // Verificar que tenga perfil de líder o administrador
    if (!isLeader()) {
      return false;
    }
    return true;
  };

  const getNombramientoLabel = (nombramiento?: string | null): string => {
    switch (nombramiento) {
      case 'colider':
        return 'Colíder';
      case 'veterano':
        return 'Veterano';
      case 'nuevo':
        return 'Nuevo';
      default:
        return '';
    }
  };

  const handleOpenModal = (integrante: Usuario) => {
    // Solo permitir abrir el modal si el usuario puede editar nombramientos
    if (!canEditNombramientos()) {
      return;
    }
    setSelectedIntegrante(integrante);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedIntegrante(null);
    setSuccessMessage('');
  };

  const handleSelectNombramiento = async (nombramiento: 'colider' | 'veterano' | 'nuevo' | null) => {
    if (!selectedIntegrante) return;

    setUpdatingNombramiento(true);
    setSuccessMessage('');
    try {
      const response = await grupoService.updateNombramiento(selectedIntegrante.id, nombramiento);
      
      if (response.success) {
        setSuccessMessage('✓ Nombramiento actualizado exitosamente');
        // Recargar integrantes para actualizar la lista
        await loadIntegrantes();
        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        Alert.alert('Error', response.error || 'Error al actualizar nombramiento');
      }
    } catch (error) {
      console.error('Error al actualizar nombramiento:', error);
      Alert.alert('Error', 'Error al actualizar nombramiento');
    } finally {
      setUpdatingNombramiento(false);
    }
  };

  const handleEliminarIntegrante = () => {
    if (!selectedIntegrante) return;

    Alert.alert(
      'Eliminar Integrante',
      `¿Estás seguro que deseas eliminar a ${selectedIntegrante.alias || selectedIntegrante.email} del grupo?\n\nYa no tendrá acceso al Chat Staff, solo al Chat General y será removido del listado del grupo.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setRemovingIntegrante(true);
            setSuccessMessage('');
            try {
              const response = await staffService.removeStaff({
                email: selectedIntegrante.email,
              });

              if (response.success) {
                setSuccessMessage('✓ Integrante eliminado exitosamente');
                // Recargar integrantes para actualizar la lista
                await loadIntegrantes();
                // Cerrar modal después de 1.5 segundos
                setTimeout(() => {
                  handleCloseModal();
                }, 1500);
              } else {
                Alert.alert('Error', response.error || 'Error al eliminar integrante');
              }
            } catch (error) {
              console.error('Error al eliminar integrante:', error);
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Error al eliminar integrante',
              );
            } finally {
              setRemovingIntegrante(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <WithBottomTabBar>
        <View style={styles.container}>
          <View style={styles.backgroundImageContainer}>
            <Image
              source={require('../../assets/menu-fondo.jpeg')}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Cargando integrantes...</Text>
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
            source={require('../../assets/menu-fondo.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        {/* Contenido sobre el fondo */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {nombreGrupo 
              ? `Integrantes del Grupo ${nombreGrupo}`
              : 'Integrantes del Grupo'}
          </Text>
          <Text style={styles.subtitle}>
            {nombreGrupo 
              ? `Lista de miembros del grupo ${nombreGrupo}`
              : 'Lista de miembros del grupo'}
          </Text>

          {error && integrantes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : integrantes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay integrantes en el grupo</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {integrantes.map((integrante) => (
                <View key={integrante.id} style={styles.integranteCard}>
                  <View style={styles.integranteHeader}>
                    <View style={styles.integranteInfo}>
                      {integrante.alias ? (
                        <View style={styles.aliasContainer}>
                          <Text style={styles.patinesIcon}>⛸️</Text>
                          <View style={styles.nameContainer}>
                            <Text style={styles.integranteAlias}>{integrante.alias}</Text>
                            {integrante.id === liderId && (
                              <Text style={styles.liderText}>Líder</Text>
                            )}
                            {integrante.nombramiento && (
                              <Text style={styles.nombramientoText}>
                                {getNombramientoLabel(integrante.nombramiento)}
                              </Text>
                            )}
                          </View>
                        </View>
                      ) : (
                        <View style={styles.nameContainer}>
                          <Text style={styles.integranteEmail}>{integrante.email}</Text>
                          {integrante.id === liderId && (
                            <Text style={styles.liderText}>Líder</Text>
                          )}
                          {integrante.nombramiento && (
                            <Text style={styles.nombramientoText}>
                              {getNombramientoLabel(integrante.nombramiento)}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    {canEditNombramientos() && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleOpenModal(integrante)}>
                        <Text style={styles.editButtonText}>📝</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate('Menu')}>
              <Text style={styles.menuButtonText}>Volver al Menú</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal para seleccionar nombramiento */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Asignar Nombramiento
                </Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedIntegrante && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalSubtitle}>
                    {selectedIntegrante.alias || selectedIntegrante.email}
                  </Text>
                  <Text style={styles.modalDescription}>
                    Selecciona un nombramiento para este integrante:
                  </Text>

                  <View style={styles.nombramientoOptions}>
                    <TouchableOpacity
                      style={[
                        styles.nombramientoOption,
                        selectedIntegrante.nombramiento === 'colider' && styles.nombramientoOptionActive,
                      ]}
                      onPress={() => handleSelectNombramiento('colider')}
                      disabled={updatingNombramiento || removingIntegrante}>
                      <Text style={styles.nombramientoOptionText}>Colíder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.nombramientoOption,
                        selectedIntegrante.nombramiento === 'veterano' && styles.nombramientoOptionActive,
                      ]}
                      onPress={() => handleSelectNombramiento('veterano')}
                      disabled={updatingNombramiento || removingIntegrante}>
                      <Text style={styles.nombramientoOptionText}>Veterano</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.nombramientoOption,
                        selectedIntegrante.nombramiento === 'nuevo' && styles.nombramientoOptionActive,
                      ]}
                      onPress={() => handleSelectNombramiento('nuevo')}
                      disabled={updatingNombramiento || removingIntegrante}>
                      <Text style={styles.nombramientoOptionText}>Nuevo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.nombramientoOption,
                        styles.nombramientoOptionRemove,
                        !selectedIntegrante.nombramiento && styles.nombramientoOptionActive,
                      ]}
                      onPress={() => handleSelectNombramiento(null)}
                      disabled={updatingNombramiento || removingIntegrante}>
                      <Text style={styles.nombramientoOptionTextRemove}>
                        Quitar Nombramiento
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botón para eliminar integrante - Solo mostrar si no es el líder */}
                  {isLeader() && selectedIntegrante.id !== liderId && (
                    <View style={styles.eliminarContainer}>
                      <TouchableOpacity
                        style={[
                          styles.eliminarIntegranteButton,
                          (updatingNombramiento || removingIntegrante) && styles.eliminarIntegranteButtonDisabled,
                        ]}
                        onPress={handleEliminarIntegrante}
                        disabled={updatingNombramiento || removingIntegrante}>
                        {removingIntegrante ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.eliminarIntegranteButtonText}>
                            🗑️ Eliminar del Grupo
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {successMessage ? (
                    <Text style={styles.successMessage}>{successMessage}</Text>
                  ) : null}

                  {(updatingNombramiento || removingIntegrante) && !successMessage && (
                    <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
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
  contentScroll: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
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
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  listContainer: {
    marginTop: 20,
  },
  integranteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  integranteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  integranteInfo: {
    flex: 1,
  },
  aliasContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flex: 1,
  },
  patinesIcon: {
    fontSize: 24,
    marginRight: 8,
    marginTop: 2,
  },
  integranteAlias: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  integranteEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  liderText: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nombramientoText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
  editButton: {
    padding: 8,
    marginLeft: 12,
  },
  editButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  nombramientoOptions: {
    gap: 12,
  },
  nombramientoOption: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  nombramientoOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  nombramientoOptionRemove: {
    backgroundColor: '#FFF5F5',
  },
  nombramientoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nombramientoOptionTextRemove: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  eliminarContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  eliminarIntegranteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliminarIntegranteButtonDisabled: {
    opacity: 0.6,
  },
  eliminarIntegranteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    marginTop: 16,
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
  },
  menuButton: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  menuButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
