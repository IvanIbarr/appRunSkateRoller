import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';
import Video from 'react-native-video';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {Button} from '../components/Button';
import {API_ENDPOINTS} from '../config/api';
import authService from '../services/authService';
import {Usuario} from '../types';
import {useNavigation} from '@react-navigation/native';

interface RollerTipsScreenProps {
  navigation: any;
}

export const RollerTipsScreen: React.FC<RollerTipsScreenProps> = () => {
  const navigation = useNavigation<any>();
  const [tipText, setTipText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    uri: string;
    name?: string;
    fileSize?: number;
    duration?: number;
    type?: string;
  } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [webVideoFile, setWebVideoFile] = useState<File | null>(null);
  const [webVideoUrl, setWebVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tips, setTips] = useState<Array<{
    id: string;
    url: string;
    description?: string;
    createdAt?: string;
    expiresAt?: string;
    status?: string;
    reactions?: Record<string, number>;
    uploadedBy?: string | null;
    uploaderName?: string | null;
    uploaderEmail?: string | null;
    uploaderAlias?: string | null;
  }>>([]);
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [creatorQuery, setCreatorQuery] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreators, setShowCreators] = useState(false);

  const remainingChars = useMemo(() => 1024 - tipText.length, [tipText]);
  const shouldTruncate = tipText.length > 125;
  const previewText =
    !shouldTruncate || isExpanded ? tipText : `${tipText.slice(0, 125)}…`;

  useEffect(() => {
    if (webVideoUrl) {
      return () => {
        URL.revokeObjectURL(webVideoUrl);
      };
    }
    return undefined;
  }, [webVideoUrl]);

  useEffect(() => {
    const loadTips = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.ROLLERTIPS.LIST}?scope=active`);
        const data = await response.json();
        if (data?.success && Array.isArray(data.data)) {
          setTips(data.data);
        }
      } catch (error) {
        // Silenciar errores de red en dev
      }
    };
    loadTips();
  }, []);

  useEffect(() => {
    const loadRulesPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem('@rollertips:show_rules');
        setShowRules(stored !== 'false');
      } catch (error) {
        setShowRules(true);
      }
    };
    loadRulesPreference();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  const reactionItems = [
    {id: 'like', label: '👍'},
    {id: 'corazon', label: '❤️'},
    {id: 'asombro', label: '😲'},
    {id: 'tristeza', label: '😢'},
    {id: 'risa', label: '😂'},
    {id: 'me_encanta', label: '😍'},
  ];

  const handleReaction = async (tipId: string, reaction: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.ROLLERTIPS.REACTIONS(tipId), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({reaction}),
      });
      const data = await response.json();
      if (data?.success && data.data) {
        setTips((prev) =>
          prev.map((tip) => (tip.id === tipId ? data.data : tip)),
        );
      }
    } catch (error) {
      Alert.alert('RollerTips', 'No se pudo registrar la reacción.');
    }
  };

  const handleDelete = async (tipId: string) => {
    Alert.alert('Eliminar video', '¿Deseas eliminar este video?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('@auth:token');
            const response = await fetch(API_ENDPOINTS.ROLLERTIPS.DELETE(tipId), {
              method: 'DELETE',
              headers: token ? {Authorization: `Bearer ${token}`} : undefined,
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) {
              throw new Error(data?.error || 'No se pudo eliminar el video');
            }
            setTips((prev) => prev.filter((tip) => tip.id !== tipId));
            Alert.alert('RollerTips', 'Video eliminado correctamente.');
          } catch (error) {
            Alert.alert(
              'RollerTips',
              error instanceof Error ? error.message : 'Error al eliminar el video.',
            );
          }
        },
      },
    ]);
  };

  const handleSelectVideo = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
      videoQuality: 'high',
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert('RollerTips', 'No se pudo seleccionar el video.');
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('RollerTips', 'No se encontró el archivo de video.');
      return;
    }

    const fileSize = asset.fileSize ?? 0;
    const duration = asset.duration ?? 0;

    if (fileSize > 1024 * 1024 * 1024) {
      Alert.alert('RollerTips', 'El video supera 1 GB.');
      return;
    }

    if (duration > 90) {
      Alert.alert('RollerTips', 'La duración máxima es 1 minuto 30 segundos.');
      return;
    }

    setSelectedVideo({
      uri: asset.uri,
      name: asset.fileName,
      fileSize: asset.fileSize,
      duration: asset.duration,
      type: asset.type,
    });
  };

  const handlePublish = async () => {
    if (!selectedVideo) {
      Alert.alert('RollerTips', 'Primero selecciona un video.');
      return;
    }

    setIsPublishing(true);
    setUploadProgress(0);
    try {
      const token = await AsyncStorage.getItem('@auth:token');
      const formData = new FormData();
      formData.append('description', tipText.trim());
      if (currentUser?.id) {
        formData.append('uploaderName', currentUser.email || '');
        formData.append('uploaderEmail', currentUser.email || '');
        if (currentUser.alias) {
          formData.append('uploaderAlias', currentUser.alias);
        }
      }
      if (Platform.OS === 'web') {
        if (!webVideoFile) {
          throw new Error('Primero selecciona un video.');
        }
        formData.append('video', webVideoFile);
      } else {
        formData.append('video', {
          uri: selectedVideo.uri,
          name: selectedVideo.name || `rollertip-${Date.now()}.mp4`,
          type: selectedVideo.type || 'video/mp4',
        } as any);
      }

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_ENDPOINTS.ROLLERTIPS.CREATE);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };
        xhr.onload = () => {
          try {
            const response = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300 && response?.success) {
              resolve(response);
            } else {
              reject(new Error(response?.error || 'No se pudo publicar el video'));
            }
          } catch (err) {
            reject(new Error('Respuesta inválida del servidor'));
          }
        };
        xhr.onerror = () => reject(new Error('Error al subir el video'));
        xhr.send(formData as any);
      });

      Alert.alert('RollerTips', 'Video publicado correctamente.');
      if (data?.data) {
        setTips((prev) => [data.data, ...prev]);
      }
      try {
        await AsyncStorage.setItem('@rollertips:show_rules', 'false');
        setShowRules(false);
      } catch (error) {
        // ignore
      }
      setSelectedVideo(null);
      setTipText('');
      setIsExpanded(false);
      setWebVideoFile(null);
      setWebVideoUrl(null);
      setUploadProgress(0);
    } catch (error) {
      Alert.alert(
        'RollerTips',
        error instanceof Error ? error.message : 'Error al publicar el video.',
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const getDisplayName = (tip: (typeof tips)[number]) => {
    return (
      tip.uploaderAlias ||
      tip.uploaderName ||
      tip.uploaderEmail ||
      'Usuario'
    );
  };

  const getTimeLeft = (tip: (typeof tips)[number]) => {
    if (!tip.expiresAt) {
      return '';
    }
    const diff = new Date(tip.expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      return 'Expirado';
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `Expira en ${hours}h ${minutes}m`;
    }
    return `Expira en ${minutes}m`;
  };

  const creators = useMemo(() => {
    const map = new Map<string, {id: string; name: string}>();
    tips.forEach((tip) => {
      if (tip.uploadedBy) {
        map.set(tip.uploadedBy, {
          id: tip.uploadedBy,
          name: getDisplayName(tip),
        });
      }
    });
    return Array.from(map.values()).filter((creator) =>
      creator.name.toLowerCase().includes(creatorQuery.trim().toLowerCase()),
    );
  }, [tips, creatorQuery]);

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/rollertips-bg.png')}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}>
          <View style={styles.backgroundOverlay} pointerEvents="none" />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Rollertips</Text>
                  <Text style={styles.subtitle}>
                    Comparte tips en video con la comunidad
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.rulesIconButton}
                  onPress={() => setShowRulesModal(true)}>
                  <Text style={styles.rulesIcon}>ℹ️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showRules && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Requisitos del video</Text>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Tamaño máximo</Text>
                  <Text style={styles.ruleValue}>1 GB</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Duración máxima</Text>
                  <Text style={styles.ruleValue}>1:30 min</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Formatos recomendados</Text>
                  <Text style={styles.ruleValue}>MP4 o MOV</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Orientación ideal</Text>
                  <Text style={styles.ruleValue}>Vertical o cuadrado</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Resolución sugerida</Text>
                  <Text style={styles.ruleValue}>1080x1920 (stories)</Text>
                </View>
                <View style={styles.ruleItemLast}>
                  <Text style={styles.ruleLabel}>Resolución sugerida</Text>
                  <Text style={styles.ruleValue}>1080x1080 (feed)</Text>
                </View>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Subir video</Text>
                <TouchableOpacity
                  style={styles.sectionIconButton}
                  onPress={() => setShowUpload((prev) => !prev)}>
                  <Text style={styles.sectionIcon}>{showUpload ? '▾' : '▸'}</Text>
                </TouchableOpacity>
              </View>
              {showUpload && (
                <>
                  <Text style={styles.helperText}>
                    Selecciona tu video y publícalo cuando esté listo.
                  </Text>
              <Button
                title="Seleccionar video"
                onPress={handleSelectVideo}
                textStyle={styles.buttonText}
                style={styles.primaryButton}
              />
              {Platform.OS === 'web' && (
                // @ts-ignore - input only exists on web
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/mov"
                  style={{display: 'none'}}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    if (file.size > 1024 * 1024 * 1024) {
                      Alert.alert('RollerTips', 'El video supera 1 GB.');
                      event.target.value = '';
                      return;
                    }
                    const objectUrl = URL.createObjectURL(file);
                    const tempVideo = document.createElement('video');
                    tempVideo.preload = 'metadata';
                    tempVideo.src = objectUrl;
                    tempVideo.onloadedmetadata = () => {
                      const duration = tempVideo.duration || 0;
                      if (duration > 90) {
                        Alert.alert(
                          'RollerTips',
                          'La duración máxima es 1 minuto 30 segundos.',
                        );
                        URL.revokeObjectURL(objectUrl);
                        event.target.value = '';
                        return;
                      }
                      setWebVideoFile(file);
                      setWebVideoUrl(objectUrl);
                      setSelectedVideo({
                        uri: objectUrl,
                        name: file.name,
                        fileSize: file.size,
                        duration: Math.round(duration),
                        type: file.type,
                      });
                    };
                  }}
                />
              )}
              {selectedVideo && (
                <View style={styles.videoInfo}>
                  <Text style={styles.videoInfoText}>
                    {selectedVideo.name || 'Video seleccionado'}
                  </Text>
                  <Text style={styles.videoInfoSubtext}>
                    Tamaño: {selectedVideo.fileSize ? (selectedVideo.fileSize / (1024 * 1024)).toFixed(2) : '0'} MB
                    {' • '}
                    Duración: {selectedVideo.duration ?? 0}s
                  </Text>
                </View>
              )}
              {selectedVideo && Platform.OS === 'web' && webVideoUrl && (
                <View style={styles.videoPreview}>
                  <video
                    src={webVideoUrl}
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    controls
                  />
                </View>
              )}
              {selectedVideo && Platform.OS !== 'web' && (
                <View style={styles.videoPreview}>
                  <Video
                    source={{uri: selectedVideo.uri}}
                    style={styles.videoPlayer}
                    resizeMode="cover"
                    controls
                    paused
                  />
                </View>
              )}
              <View style={styles.textAreaContainer}>
                <Text style={styles.textAreaLabel}>Descripción (máx. 1024)</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Escribe tu tip o descripción..."
                  placeholderTextColor="rgba(203, 213, 245, 0.7)"
                  value={tipText}
                  onChangeText={(value) => {
                    const trimmed = value.slice(0, 1024);
                    setTipText(trimmed);
                    if (trimmed.length <= 125) {
                      setIsExpanded(false);
                    }
                  }}
                  maxLength={1024}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.counterText}>
                  {remainingChars} caracteres restantes
                </Text>
              </View>

              {tipText.length > 0 && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>Vista previa</Text>
                  <Text style={styles.previewText}>{previewText}</Text>
                  {shouldTruncate && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setIsExpanded((prev) => !prev)}>
                      <Text style={styles.expandButtonText}>
                        {isExpanded ? 'Ver menos' : 'Ver más'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Button
                title="Publicar"
                onPress={handlePublish}
                variant="outline"
                textStyle={styles.buttonText}
                style={styles.secondaryButton}
                loading={isPublishing}
              />
              {isPublishing && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {width: `${uploadProgress}%`}]} />
                  </View>
                  <Text style={styles.progressText}>{uploadProgress}%</Text>
                </View>
              )}
                </>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Buscar creadores</Text>
                <TouchableOpacity
                  style={styles.sectionIconButton}
                  onPress={() => setShowCreators((prev) => !prev)}>
                  <Text style={styles.sectionIcon}>{showCreators ? '▾' : '▸'}</Text>
                </TouchableOpacity>
              </View>
              {showCreators && (
                <>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Busca por nombre o alias..."
                    placeholderTextColor="rgba(203, 213, 245, 0.7)"
                    value={creatorQuery}
                    onChangeText={setCreatorQuery}
                  />
                  <View style={styles.creatorsList}>
                    {creators.length === 0 ? (
                      <Text style={styles.emptyText}>Sin resultados.</Text>
                    ) : (
                      creators.map((creator) => (
                        <Text key={creator.id} style={styles.creatorNameOnly}>
                          {creator.name}
                        </Text>
                      ))
                    )}
                  </View>
                </>
              )}
            </View>

            <View style={styles.reelsSection}>
              <Text style={styles.sectionTitle}>RollerTips recientes</Text>
              {tips.length === 0 ? (
                <Text style={styles.emptyText}>
                  Aún no hay videos publicados.
                </Text>
              ) : (
                tips.map((tip) => {
                  const text = tip.description || '';
                  const isLong = text.length > 125;
                  const isItemExpanded = expandedTips[tip.id] === true;
                  const displayText =
                    !isLong || isItemExpanded ? text : `${text.slice(0, 125)}…`;
                  return (
                    <View key={tip.id} style={styles.reelCard}>
                      {currentUser?.id && tip.uploadedBy === currentUser.id && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(tip.id)}>
                          <Text style={styles.deleteButtonText}>🗑 Eliminar</Text>
                        </TouchableOpacity>
                      )}
                      <View style={styles.reelHeader}>
                        {tip.uploadedBy ? (
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('RollerTipsProfile', {
                                userId: tip.uploadedBy,
                                displayName: getDisplayName(tip),
                              })
                            }>
                            <Text style={styles.reelOwnerLink}>{getDisplayName(tip)}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.reelOwner}>{getDisplayName(tip)}</Text>
                        )}
                        <Text style={styles.reelExpires}>{getTimeLeft(tip)}</Text>
                      </View>
                      <View style={styles.reelVideo}>
                        {Platform.OS === 'web' ? (
                          <video
                            src={tip.url}
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            controls
                          />
                        ) : (
                          <Video
                            source={{uri: tip.url}}
                            style={styles.videoPlayer}
                            resizeMode="cover"
                            controls
                            paused
                          />
                        )}
                      </View>
                      {text.length > 0 && (
                        <>
                          <Text style={styles.reelDescription}>{displayText}</Text>
                          {isLong && (
                            <TouchableOpacity
                              style={styles.expandButton}
                              onPress={() =>
                                setExpandedTips((prev) => ({
                                  ...prev,
                                  [tip.id]: !isItemExpanded,
                                }))
                              }>
                              <Text style={styles.expandButtonText}>
                                {isItemExpanded ? 'Ver menos' : 'Ver más'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                      <View style={styles.reactionsRow}>
                        {reactionItems.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.reactionButton}
                            onPress={() => handleReaction(tip.id, item.id)}>
                            <Text style={styles.reactionIcon}>{item.label}</Text>
                            <Text style={styles.reactionCount}>
                              {tip.reactions?.[item.id] ?? 0}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
          <Modal
            visible={showRulesModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRulesModal(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Requisitos del video</Text>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Tamaño máximo</Text>
                  <Text style={styles.ruleValue}>1 GB</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Duración máxima</Text>
                  <Text style={styles.ruleValue}>1:30 min</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Formatos recomendados</Text>
                  <Text style={styles.ruleValue}>MP4 o MOV</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Orientación ideal</Text>
                  <Text style={styles.ruleValue}>Vertical o cuadrado</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleLabel}>Resolución sugerida</Text>
                  <Text style={styles.ruleValue}>1080x1920 (stories)</Text>
                </View>
                <View style={styles.ruleItemLast}>
                  <Text style={styles.ruleLabel}>Resolución sugerida</Text>
                  <Text style={styles.ruleValue}>1080x1080 (feed)</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowRulesModal(false)}>
                  <Text style={styles.modalCloseText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ImageBackground>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 12, 24, 0.55)',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 32,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerText: {
    flex: 1,
  },
  rulesIconButton: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  rulesIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  subtitle: {
    fontSize: 13,
    color: '#CBD5F5',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionIconButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sectionIcon: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  ruleItemLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ruleLabel: {
    fontSize: 13,
    color: '#CBD5F5',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  ruleValue: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  helperText: {
    fontSize: 13,
    color: '#CBD5F5',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  textAreaContainer: {
    marginTop: 12,
  },
  textAreaLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  descriptionInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    fontSize: 13,
  },
  counterText: {
    marginTop: 6,
    fontSize: 11,
    color: '#94A3B8',
  },
  previewCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewTitle: {
    fontSize: 12,
    color: '#E2E8F0',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  previewText: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  expandButtonText: {
    fontSize: 12,
    color: '#7DD3FC',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 4,
  },
  secondaryButton: {
    marginTop: 10,
  },
  buttonText: {
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  progressText: {
    marginTop: 6,
    fontSize: 11,
    color: '#E2E8F0',
    textAlign: 'right',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  modalCloseButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  modalCloseText: {
    color: '#7DD3FC',
    fontWeight: '600',
  },
  reelsSection: {
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#CBD5F5',
    textAlign: 'center',
  },
  creatorsList: {
    marginTop: 8,
    gap: 6,
  },
  creatorNameOnly: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    fontSize: 13,
  },
  reelCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  reelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reelOwner: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  reelOwnerLink: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  reelExpires: {
    fontSize: 11,
    color: '#94A3B8',
  },
  reelVideo: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 240,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  reelDescription: {
    marginTop: 10,
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  reactionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  reactionIcon: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.5)',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    marginBottom: 10,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
  },
  videoInfo: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  videoInfoText: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  videoInfoSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: '#94A3B8',
  },
  videoPreview: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    height: 220,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
});
