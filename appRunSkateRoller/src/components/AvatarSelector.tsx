import React, {useState, Fragment} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  InteractionManager,
} from 'react-native';
import {
  pickAvatarImageFromLibrary,
  pickAvatarImageFromCamera,
} from '../utils/pickAvatarImage';
import AvatarCropModal from './AvatarCropModal';

interface AvatarSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatar: string) => void;
  selectedAvatar?: string | null;
  /** Si se pasan, se muestra bloque para subir foto (Menú / perfil). */
  fotoPerfil?: string | null;
  onSelectFotoPerfil?: (dataUri: string) => void | Promise<void>;
  onClearFotoPerfil?: () => void | Promise<void>;
  fotoBusy?: boolean;
  /** Al iniciar galería/cámara (p. ej. mostrar overlay en Menú mientras iOS cierra el modal). */
  onPhotoPickStart?: () => void;
  /** Si el usuario cancela o falla la lectura de la imagen. */
  onPhotoPickCancel?: () => void;
}

// Avatares organizados por categorías
const AVATARS = {
  hombres: ['👨', '👨‍💼', '👨‍🔬', '👨‍🎓', '👨‍🚀'],
  mujeres: ['👩', '👩‍💼', '👩‍🔬', '👩‍🎓', '👩‍🚀'],
  niños: ['👶', '🧒', '👦', '🧑', '👨‍🦱'],
  diversos: ['🧑‍🦰', '🧑‍🦱', '🧑‍🦳', '🧑‍🦲', '🧑‍⚕️'],
};

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  visible,
  onClose,
  onSelectAvatar,
  selectedAvatar,
  fotoPerfil,
  onSelectFotoPerfil,
  onClearFotoPerfil,
  fotoBusy,
  onPhotoPickStart,
  onPhotoPickCancel,
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof AVATARS>('hombres');
  const [localPicking, setLocalPicking] = useState(false);
  /** Solo web: imagen cruda antes de recorte / subida. */
  const [webCropUri, setWebCropUri] = useState<string | null>(null);

  const showPhotoBlock = Boolean(onSelectFotoPerfil);
  const busy = Boolean(fotoBusy) || localPicking;

  const handleAvatarSelect = (avatar: string) => {
    onSelectAvatar(avatar);
    onClose();
  };

  const handlePickLibrary = async () => {
    if (!onSelectFotoPerfil || busy) {
      return;
    }

    /** Web: sin await antes del file input; luego modal de recorte (AvatarCropModal.web). */
    if (Platform.OS === 'web') {
      setLocalPicking(true);
      try {
        const uri = await pickAvatarImageFromLibrary();
        if (uri) {
          onClose();
          setWebCropUri(uri);
        } else {
          onPhotoPickCancel?.();
        }
      } catch {
        onPhotoPickCancel?.();
      } finally {
        setLocalPicking(false);
      }
      return;
    }

    onPhotoPickStart?.();
    setLocalPicking(true);
    try {
      const waitAfterClose = (): Promise<void> =>
        new Promise((resolve) => {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(resolve, Platform.OS === 'ios' ? 480 : 0);
          });
        });

      if (Platform.OS === 'ios') {
        onClose();
        await waitAfterClose();
      } else {
        await waitAfterClose();
      }

      const uri = await pickAvatarImageFromLibrary();
      if (uri) {
        await Promise.resolve(onSelectFotoPerfil(uri));
      } else {
        onPhotoPickCancel?.();
      }
    } catch {
      onPhotoPickCancel?.();
    } finally {
      setLocalPicking(false);
    }
  };

  const handlePickCamera = async () => {
    if (!onSelectFotoPerfil || busy || Platform.OS === 'web') {
      return;
    }
    onPhotoPickStart?.();
    setLocalPicking(true);
    try {
      const waitAfterClose = (): Promise<void> =>
        new Promise((resolve) => {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(resolve, Platform.OS === 'ios' ? 480 : 0);
          });
        });

      if (Platform.OS === 'ios') {
        onClose();
        await waitAfterClose();
      } else {
        await waitAfterClose();
      }

      const uri = await pickAvatarImageFromCamera();
      if (uri) {
        await Promise.resolve(onSelectFotoPerfil(uri));
      } else {
        onPhotoPickCancel?.();
      }
    } catch {
      onPhotoPickCancel?.();
    } finally {
      setLocalPicking(false);
    }
  };

  const handleWebCropConfirm = async (jpegDataUri: string) => {
    setWebCropUri(null);
    if (!onSelectFotoPerfil) {
      return;
    }
    onPhotoPickStart?.();
    try {
      await Promise.resolve(onSelectFotoPerfil(jpegDataUri));
    } catch {
      onPhotoPickCancel?.();
    }
  };

  const handleWebCropCancel = () => {
    setWebCropUri(null);
  };

  const handleClearPhoto = async () => {
    if (!onClearFotoPerfil || busy) {
      return;
    }
    Alert.alert(
      'Quitar foto',
      '¿Quitar tu foto y volver al emoji si lo tienes?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => {
            void Promise.resolve(onClearFotoPerfil());
          },
        },
      ],
    );
  };

  return (
    <Fragment>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {busy && (
            <View style={styles.busyOverlay} pointerEvents="auto">
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.busyOverlayText}>Procesando…</Text>
            </View>
          )}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Avatar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {showPhotoBlock && (
            <View style={styles.photoSection}>
              <Text style={styles.photoSectionTitle}>Foto de perfil</Text>
              <Text style={styles.photoSectionHint}>
                {Platform.OS === 'web'
                  ? 'Elige una foto: podrás ajustar zoom y encuadre antes de guardar.'
                  : 'Sube una imagen; se recorta al círculo y se comprime automáticamente.'}
              </Text>
              <View style={styles.photoButtonsRow}>
                <TouchableOpacity
                  style={[styles.photoButton, busy && styles.photoButtonDisabled]}
                  onPress={handlePickLibrary}
                  disabled={busy}>
                  <Text style={styles.photoButtonText}>📷 Galería / archivos</Text>
                </TouchableOpacity>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={[styles.photoButton, busy && styles.photoButtonDisabled]}
                    onPress={handlePickCamera}
                    disabled={busy}>
                    <Text style={styles.photoButtonText}>🎥 Cámara</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!!fotoPerfil && onClearFotoPerfil && (
                <TouchableOpacity
                  style={styles.clearPhotoButton}
                  onPress={handleClearPhoto}
                  disabled={busy}>
                  <Text style={styles.clearPhotoText}>Quitar foto personalizada</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  activeCategory === 'hombres' && styles.categoryButtonActive,
                ]}
                onPress={() => setActiveCategory('hombres')}>
                <Text style={styles.categoryButtonText}>Hombres</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  activeCategory === 'mujeres' && styles.categoryButtonActive,
                ]}
                onPress={() => setActiveCategory('mujeres')}>
                <Text style={styles.categoryButtonText}>Mujeres</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  activeCategory === 'niños' && styles.categoryButtonActive,
                ]}
                onPress={() => setActiveCategory('niños')}>
                <Text style={styles.categoryButtonText}>Niños</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  activeCategory === 'diversos' && styles.categoryButtonActive,
                ]}
                onPress={() => setActiveCategory('diversos')}>
                <Text style={styles.categoryButtonText}>Diversos</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <Text style={styles.emojiSectionTitle}>Emoji</Text>

          <ScrollView style={styles.avatarsContainer}>
            <View style={styles.avatarsGrid}>
              {AVATARS[activeCategory].map((avatar, index) => (
                <TouchableOpacity
                  key={`${activeCategory}-${index}`}
                  style={[
                    styles.avatarButton,
                    selectedAvatar === avatar && styles.avatarButtonSelected,
                  ]}
                  onPress={() => handleAvatarSelect(avatar)}>
                  <Text style={styles.avatarEmoji}>{avatar}</Text>
                  {selectedAvatar === avatar && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
    <AvatarCropModal
      visible={!!webCropUri}
      imageUri={webCropUri}
      onCancel={handleWebCropCancel}
      onConfirm={handleWebCropConfirm}
    />
    </Fragment>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: 16,
  },
  busyOverlayText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  photoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  photoSectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoButton: {
    flexGrow: 1,
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  photoButtonDisabled: {
    opacity: 0.55,
  },
  photoButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  clearPhotoButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  clearPhotoText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
  emojiSectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonActiveText: {
    color: '#FFF',
  },
  avatarsContainer: {
    padding: 20,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  avatarButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

