import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {Attachment} from './AttachmentPicker';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove: () => void;
  compact?: boolean;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  onRemove,
  compact = false,
}) => {
  if (attachment.type === 'image') {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Image
          source={{uri: attachment.uri}}
          style={[styles.image, compact && styles.imageCompact]}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          activeOpacity={0.8}>
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
        {attachment.name && !compact && (
          <View style={styles.nameContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {attachment.name}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (attachment.type === 'video') {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={[styles.videoContainer, compact && styles.videoContainerCompact]}>
          <Text style={styles.videoIcon}>🎥</Text>
          {!compact && <Text style={styles.videoLabel}>Video</Text>}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          activeOpacity={0.8}>
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
        {attachment.name && !compact && (
          <View style={styles.nameContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {attachment.name}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  containerCompact: {
    marginBottom: 4,
    marginTop: 4,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageCompact: {
    width: 150,
    height: 150,
  },
  videoContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainerCompact: {
    width: 150,
    height: 150,
  },
  videoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  nameText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
