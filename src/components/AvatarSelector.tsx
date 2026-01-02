import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';

interface AvatarSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatar: string) => void;
  selectedAvatar?: string | null;
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
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof AVATARS>('hombres');

  const handleAvatarSelect = (avatar: string) => {
    onSelectAvatar(avatar);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Avatar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

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
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
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

