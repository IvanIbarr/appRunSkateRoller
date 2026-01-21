import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LoginScreen} from '../screens/LoginScreen';
import {RegistroScreen} from '../screens/RegistroScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {NavegacionScreen} from '../screens/NavegacionScreen';
import {ComunidadScreen} from '../screens/ComunidadScreen';
import {HistorialScreen} from '../screens/HistorialScreen';
import {CalendarioScreen} from '../screens/CalendarioScreen';
import {MenuScreen} from '../screens/MenuScreen';
import {AgregarStaffScreen} from '../screens/AgregarStaffScreen';
import {NombreGrupoScreen} from '../screens/NombreGrupoScreen';
import {AgregarAliasScreen} from '../screens/AgregarAliasScreen';
import {CambiarAliasScreen} from '../screens/CambiarAliasScreen';
import {IntegrantesGrupoScreen} from '../screens/IntegrantesGrupoScreen';
import {CrearEventoScreen} from '../screens/CrearEventoScreen';
import {VistaPreviaEventoScreen} from '../screens/VistaPreviaEventoScreen';
import {SeguimientoCompartidoScreen} from '../screens/SeguimientoCompartidoScreen';
import {EventoDetalleScreen} from '../screens/EventoDetalleScreen';
import {LanguageProvider} from '../contexts/LanguageContext';
import authService from '../services/authService';

export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Home: undefined;
  Navegacion: undefined;
  Comunidad: undefined;
  Historial: undefined;
  Calendario: undefined;
  Menu: undefined;
  AgregarStaff: undefined;
  NombreGrupo: undefined;
  AgregarAlias: undefined;
  CambiarAlias: undefined;
  IntegrantesGrupo: undefined;
  CrearEvento: undefined;
  VistaPreviaEvento: {
    tituloRuta: string;
    puntoSalida: string;
    fechaInicio: string;
    cita: string;
    salida: string;
    nivel: string;
    logoGrupo: string | null;
    lugarDestino: string | null;
  };
  SeguimientoCompartido: {
    seguimientoId: string;
  };
  EventoDetalle: {
    id: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const linking = {
    prefixes: [
      'runskateroller://',
      'https://app.runskateroller.com',
      'http://localhost:3000',
    ],
    config: {
      screens: {
        EventoDetalle: 'evento/:id',
        SeguimientoCompartido: 'seguimiento/:seguimientoId',
      },
    },
  };

  useEffect(() => {
    console.log('AppNavigator: Iniciando verificación de autenticación...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('AppNavigator: Verificando autenticación...');
      // Agregar timeout para que no se quede colgado
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.log('AppNavigator: Timeout alcanzado, mostrando login');
          resolve(false);
        }, 5000); // 5 segundos máximo, mostrar login
      });

      const authPromise = authService.isAuthenticated().then(result => {
        console.log('AppNavigator: Resultado de autenticación:', result);
        return result;
      });

      const authenticated = await Promise.race([authPromise, timeoutPromise]);
      console.log('AppNavigator: Estableciendo autenticación:', authenticated);
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('AppNavigator: Error al verificar autenticación:', error);
      // En caso de error o timeout, mostrar login
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    // Mostrar splash screen o loading
    console.log('AppNavigator: Mostrando pantalla de carga');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  console.log('AppNavigator: Renderizando navegación, isAuthenticated:', isAuthenticated);

  try {
    return (
      <LanguageProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator
            initialRouteName={isAuthenticated ? 'Navegacion' : 'Login'}
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Navegacion" component={NavegacionScreen} />
            <Stack.Screen name="Comunidad" component={ComunidadScreen} />
            <Stack.Screen name="Historial" component={HistorialScreen} />
            <Stack.Screen name="Calendario" component={CalendarioScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="AgregarStaff" component={AgregarStaffScreen} />
            <Stack.Screen name="NombreGrupo" component={NombreGrupoScreen} />
            <Stack.Screen name="AgregarAlias" component={AgregarAliasScreen} />
            <Stack.Screen name="CambiarAlias" component={CambiarAliasScreen} />
            <Stack.Screen name="IntegrantesGrupo" component={IntegrantesGrupoScreen} />
            <Stack.Screen name="CrearEvento" component={CrearEventoScreen} />
            <Stack.Screen name="VistaPreviaEvento" component={VistaPreviaEventoScreen} />
            <Stack.Screen name="SeguimientoCompartido" component={SeguimientoCompartidoScreen} />
            <Stack.Screen name="EventoDetalle" component={EventoDetalleScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    );
  } catch (error) {
    console.error('AppNavigator: Error al renderizar navegación:', error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error al cargar la navegación</Text>
        <Text style={styles.errorDetail}>{error instanceof Error ? error.message : String(error)}</Text>
        <ActivityIndicator size="large" color="#FF3B30" style={{marginTop: 20}} />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});
