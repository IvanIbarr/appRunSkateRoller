import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {WithBottomTabBar} from '../components/WithBottomTabBar';
import {AvatarCircle} from '../components/AvatarCircle';
import authService from '../services/authService';
import {Usuario} from '../types';

interface HistorialScreenProps {
  navigation: any;
}

export const HistorialScreen: React.FC<HistorialScreenProps> = ({
  navigation,
}) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };
    loadUser();
  }, []);

  return (
    <WithBottomTabBar>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <AvatarCircle avatar={currentUser?.avatar} size={50} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Historial</Text>
              <Text style={styles.subtitle}>Tus recorridos anteriores</Text>
            </View>
          </View>
          {/* Aquí irá el contenido del historial */}
        </ScrollView>
      </View>
    </WithBottomTabBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

