import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';

// Importación condicional de react-native-video para móvil
let Video: any = null;
if (Platform.OS !== 'web') {
  try {
    Video = require('react-native-video').default;
  } catch (e) {
    console.warn('react-native-video no está disponible');
  }
}

// Para React Native Web
declare global {
  namespace JSX {
    interface IntrinsicElements {
      video: React.DetailedHTMLProps<
        React.VideoHTMLAttributes<HTMLVideoElement>,
        HTMLVideoElement
      >;
    }
  }
}

interface ChatAttachmentProps {
  attachmentUrl: string;
  attachmentType: 'image' | 'video';
  compact?: boolean;
}

export const ChatAttachment: React.FC<ChatAttachmentProps> = ({
  attachmentUrl,
  attachmentType,
  compact = false,
}) => {
  const [showFullscreen, setShowFullscreen] = React.useState(false);

  if (attachmentType === 'image') {
    return (
      <>
        <TouchableOpacity
          onPress={() => setShowFullscreen(true)}
          activeOpacity={0.9}>
          <Image
            source={{uri: attachmentUrl}}
            style={[styles.image, compact && styles.imageCompact]}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {showFullscreen && (
          <Modal
            visible={showFullscreen}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFullscreen(false)}>
            <TouchableOpacity
              style={styles.fullscreenContainer}
              activeOpacity={1}
              onPress={() => setShowFullscreen(false)}>
              <View style={styles.fullscreenContent}>
                <Image
                  source={{uri: attachmentUrl}}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowFullscreen(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </>
    );
  }

  if (attachmentType === 'video') {
    const [videoError, setVideoError] = React.useState(false);

    return (
      <View style={[styles.videoContainer, compact && styles.videoContainerCompact]}>
        {Platform.OS === 'web' ? (
          <>
            <video
              src={attachmentUrl}
              controls
              style={{
                width: '100%',
                maxWidth: compact ? 200 : 300,
                borderRadius: 12,
                marginTop: 8,
              }}
            />
            <Text style={styles.videoLabel}>Video adjunto</Text>
          </>
        ) : Video && !videoError ? (
          <View style={styles.nativeVideoContainer}>
            <Video
              source={{uri: attachmentUrl}}
              style={styles.nativeVideo}
              controls
              resizeMode="contain"
              onError={(error: any) => {
                console.error('Error al reproducir video:', error);
                setVideoError(true);
              }}
            />
            <Text style={styles.videoLabel}>Video adjunto</Text>
          </View>
        ) : (
          <>
            <Text style={styles.videoIcon}>🎥</Text>
            <Text style={styles.videoLabel}>Video adjunto</Text>
            {videoError && (
              <Text style={styles.videoPlaceholder}>
                Error al cargar el video
              </Text>
            )}
          </>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  image: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  imageCompact: {
    width: 200,
    height: 200,
  },
  videoContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    minWidth: 200,
  },
  videoContainerCompact: {
    padding: 12,
    minWidth: 150,
  },
  videoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  videoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  videoPlaceholder: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContent: {
    width: '90%',
    height: '90%',
    position: 'relative',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  nativeVideoContainer: {
    width: '100%',
    maxWidth: compact ? 200 : 300,
    marginTop: 8,
  },
  nativeVideo: {
    width: '100%',
    height: compact ? 150 : 200,
    borderRadius: 12,
    backgroundColor: '#000',
  },
});
