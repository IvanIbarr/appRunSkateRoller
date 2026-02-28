import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface AvatarCircleProps {
  avatar?: string | null;
  size?: number;
}

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  avatar,
  size = 50,
}) => {
  if (!avatar) {
    // Si no hay avatar, mostrar un círculo gris con inicial
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
        <Text style={[styles.placeholderText, {fontSize: size * 0.4}]}>
          👤
        </Text>
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
      <Text style={[styles.avatarEmoji, {fontSize: size * 0.6}]}>
        {avatar}
      </Text>
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

