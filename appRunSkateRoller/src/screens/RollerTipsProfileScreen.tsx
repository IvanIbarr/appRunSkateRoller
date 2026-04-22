import React, {useEffect, useMemo, useState} from 'react';
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
import {API_ENDPOINTS, resolveApiUrl, resolveMediaUrl} from '../config/api';

interface RollerTipsProfileScreenProps {
  navigation: any;
  route: {params: {userId: string; displayName: string}};
}

const FOLLOWS_KEY = '@rollertips:follows';

export const RollerTipsProfileScreen: React.FC<RollerTipsProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const {userId, displayName} = route.params;
  const [tips, setTips] = useState<Array<{id: string; url: string; description?: string}>>([]);

  const getTipPlayableUrl = (rawUrl: string) =>
    Platform.OS === 'web' ? resolveApiUrl(rawUrl) : resolveMediaUrl(rawUrl);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadTips = async () => {
      try {
        const response = await fetch(
          resolveApiUrl(`${API_ENDPOINTS.ROLLERTIPS.USER(userId)}?scope=active`),
        );
        const data = await response.json();
        if (data?.success && Array.isArray(data.data)) {
          setTips(data.data);
        }
      } catch (error) {
        Alert.alert('RollerTips', 'No se pudieron cargar los videos.');
      }
    };
    loadTips();
  }, [userId]);

  useEffect(() => {
    const loadFollow = async () => {
      const raw = await AsyncStorage.getItem(FOLLOWS_KEY);
      const map = raw ? JSON.parse(raw) : {};
      setIsFollowing(Boolean(map[userId]));
    };
    loadFollow();
  }, [userId]);

  const toggleFollow = async () => {
    const raw = await AsyncStorage.getItem(FOLLOWS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (map[userId]) {
      delete map[userId];
      setIsFollowing(false);
    } else {
      map[userId] = true;
      setIsFollowing(true);
    }
    await AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(map));
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
              <Text style={styles.title}>{displayName}</Text>
              <Text style={styles.subtitle}>Videos activos</Text>
              <TouchableOpacity style={styles.followButton} onPress={toggleFollow}>
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Regresar</Text>
              </TouchableOpacity>
            </View>

            {tips.length === 0 ? (
              <Text style={styles.emptyText}>No hay videos activos.</Text>
            ) : (
              tips.map((tip) => (
                <View key={tip.id} style={styles.reelCard}>
                  <View style={styles.reelVideo}>
                    {Platform.OS === 'web' ? (
                      <video
                        src={getTipPlayableUrl(tip.url)}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        controls
                      />
                    ) : (
                      <Video
                        source={{uri: getTipPlayableUrl(tip.url)}}
                        style={styles.videoPlayer}
                        resizeMode="cover"
                        controls
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
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    marginBottom: 10,
  },
  followButtonText: {
    color: '#7DD3FC',
    fontWeight: '600',
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
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
});
