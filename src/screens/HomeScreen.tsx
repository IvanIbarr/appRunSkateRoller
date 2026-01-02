import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import authService from '../services/authService';
import {Usuario} from '../types';
import {Button} from '../components/Button';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    loadUsuario();
  }, []);

  const loadUsuario = async () => {
    const currentUser = await authService.getCurrentUser();
    setUsuario(currentUser);
  };

  const handleLogout = async () => {
    // Función para ejecutar el logout
    const performLogout = async () => {
      try {
        // Cerrar sesión
        await authService.logout();
        
        // Resetear la navegación para ir a Login y limpiar el stack
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Aun así, intentar navegar a Login
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      }
    };

    // En web, usar confirm nativo del navegador
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (confirmed) {
        await performLogout();
      }
    } else {
      // En móvil, usar Alert
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
      );
    }
  };

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>{usuario.email}</Text>
        </View>

        <View style={styles.profileCard}>
          {usuario.logo && (
            <Image
              source={require('../../assets/logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {usuario.tipoPerfil === 'administrador'
                ? 'Administrador'
                : usuario.tipoPerfil === 'liderGrupo'
                ? 'Líder de Grupo'
                : 'Roller'}
            </Text>
            <Text style={styles.profileDetail}>Edad: {usuario.edad} años</Text>
            <Text style={styles.profileDetail}>
              Sexo: {usuario.sexo.charAt(0).toUpperCase() + usuario.sexo.slice(1)}
            </Text>
            <Text style={styles.profileDetail}>
              Nacionalidad: {usuario.nacionalidad.charAt(0).toUpperCase() + usuario.nacionalidad.slice(1)}
            </Text>
            <Text style={styles.profileDetail}>
              Registrado: {new Date(usuario.fechaRegistro).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  profileDetail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 16,
  },
});

