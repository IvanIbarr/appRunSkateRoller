import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {resolveMediaUrl} from '../config/api';

interface AvatarCircleProps {
  /** Emoji o identificador corto */
  avatar?: string | null;
  /**
   * Imagen de perfil: data URL, https o ruta de API (`/uploads/...`) — prioridad sobre `avatar`.
   */
  fotoPerfil?: string | null;
  size?: number;
}

/** Convierte cualquier ruta almacenada en backend en URL cargable en Image. */
function resolveFotoPerfilUrl(raw: string): string {
  const v = raw.trim();
  if (!v) {
    return '';
  }
  if (
    v.startsWith('data:image/') ||
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('file://') ||
    v.startsWith('blob:')
  ) {
    return v;
  }
  return resolveMediaUrl(v);
}

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  avatar,
  fotoPerfil,
  size = 50,
}) => {
  const fp = fotoPerfil?.trim();
  if (fp) {
    const uri = resolveFotoPerfilUrl(fp);
    if (uri) {
      return (
        <View
          style={[
            styles.container,
            styles.photoWrapper,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}>
          <Image
            source={{uri}}
            style={{width: size, height: size}}
            resizeMode="cover"
          />
        </View>
      );
    }
  }

  if (!avatar) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}>
        <Text style={[styles.placeholderText, {fontSize: size * 0.4}]}>👤</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      <Text style={[styles.avatarEmoji, {fontSize: size * 0.6}]}>{avatar}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  photoWrapper: {
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  avatarContainer: {
    backgroundColor: '#F5F5F5',
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  placeholderText: {
    color: '#999',
  },
});
