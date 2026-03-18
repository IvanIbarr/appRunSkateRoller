import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {API_ENDPOINTS} from '../config/api';
import authService from '../services/authService';

interface RollerTipsArchiveScreenProps {
  navigation: any;
}

export const RollerTipsArchiveScreen: React.FC<RollerTipsArchiveScreenProps> = ({
  navigation,
}) => {
  const [tips, setTips] = useState<Array<{id: string; url: string; description?: string}>>([]);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user?.id) {
          return;
        }
        const token = await AsyncStorage.getItem('@auth:token');
        const response = await fetch(
          `${API_ENDPOINTS.ROLLERTIPS.USER(user.id)}?scope=archived`,
          {headers: token ? {Authorization: `Bearer ${token}`} : undefined},
        );
        const data = await response.json();
        if (data?.success && Array.isArray(data.data)) {
          setTips(data.data);
        }
      } catch (error) {
        Alert.alert('RollerTips', 'No se pudieron cargar tus archivos.');
      }
    };
    loadArchive();
  }, []);

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
          } catch (error) {
            Alert.alert('RollerTips', 'Error al eliminar el video.');
          }
        },
      },
    ]);
  };

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
              <Text style={styles.title}>Mis archivos</Text>
              <Text style={styles.subtitle}>
                Tus videos después de 48 horas
              </Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Regresar</Text>
              </TouchableOpacity>
            </View>

            {tips.length === 0 ? (
              <Text style={styles.emptyText}>No hay videos archivados.</Text>
            ) : (
              tips.map((tip) => (
                <View key={tip.id} style={styles.reelCard}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(tip.id)}>
                    <Text style={styles.deleteButtonText}>🗑 Eliminar</Text>
                  </TouchableOpacity>
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
                  {tip.description ? (
                    <Text style={styles.reelDescription}>{tip.description}</Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
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
  },
  title: {
    fontSize: 24,
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
    marginBottom: 10,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backButtonText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: '#CBD5F5',
    textAlign: 'center',
  },
  reelCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
});
