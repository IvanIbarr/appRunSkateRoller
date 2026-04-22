import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Platform, Linking} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
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
import {ForgotPasswordScreen} from '../screens/ForgotPasswordScreen';
import {ResetPasswordScreen} from '../screens/ResetPasswordScreen';
import {RollerTipsScreen} from '../screens/RollerTipsScreen';
import {RollerTipsProfileScreen} from '../screens/RollerTipsProfileScreen';
import {RollerTipsArchiveScreen} from '../screens/RollerTipsArchiveScreen';
import {MarketingScreen} from '../screens/MarketingScreen';
import {MarketingSellSkatesScreen} from '../screens/MarketingSellSkatesScreen';
import {MarketingSellSkatesStep3Screen} from '../screens/MarketingSellSkatesStep3Screen';
import {MarketingSellSkatesStep4Screen} from '../screens/MarketingSellSkatesStep4Screen';
import {MenuVentasScreen} from '../screens/MenuVentasScreen';
import {CrearRecapScreen} from '../screens/RecapTestScreen';
import {RecapCheckoutPlanScreen} from '../screens/recap/RecapCheckoutPlanScreen';
import {RecapCheckoutDatosScreen} from '../screens/recap/RecapCheckoutDatosScreen';
import {RecapCheckoutRevisionScreen} from '../screens/recap/RecapCheckoutRevisionScreen';
import {RecapCheckoutPagoScreen} from '../screens/recap/RecapCheckoutPagoScreen';
import {SupportHelpScreen} from '../screens/SupportHelpScreen';
import {AdminBuzonScreen} from '../screens/AdminBuzonScreen';
import {AdminUsuariosScreen} from '../screens/AdminUsuariosScreen';
import {AdminChatsScreen} from '../screens/AdminChatsScreen';
import {AdminResetPasswordScreen} from '../screens/AdminResetPasswordScreen';
import {AdminVentasGeneralesScreen} from '../screens/AdminVentasGeneralesScreen';
import {MySubscriptionsScreen} from '../screens/MySubscriptionsScreen';
import {LanguageProvider} from '../contexts/LanguageContext';
import authService from '../services/authService';
import type {RootStackParamList} from './types';
import {navigationLinking} from './linking';
import {MarketingComprarEnvioScreen} from '../screens/MarketingComprarEnvioScreen';
import {MarketingComprarRevisionScreen} from '../screens/MarketingComprarRevisionScreen';
import {MarketingComprarPagoScreen} from '../screens/MarketingComprarPagoScreen';

export type {RootStackParamList};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

function readSeguimientoIdFromUrl(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('seguimiento');
    return id && id.trim().length > 0 ? id.trim() : null;
  } catch {
    return null;
  }
}

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const deepLinkWebHandledRef = useRef(false);
  const nativeHttpsInitialHandledRef = useRef(false);

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

  // Enlaces https://...?seguimiento= mientras la app está abierta (Android / iOS).
  useEffect(() => {
    if (Platform.OS === 'web' || isAuthenticated === null) {
      return;
    }
    const sub = Linking.addEventListener('url', (e) => {
      const m = e.url.match(/[?&]seguimiento=([^&#]+)/);
      if (!m?.[1] || !navigationRef.isReady()) {
        return;
      }
      const seguimientoId = decodeURIComponent(m[1]);
      navigationRef.reset({
        index: 0,
        routes: [{name: 'Navegacion', params: {seguimientoId}}],
      });
    });
    return () => sub.remove();
  }, [isAuthenticated]);

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
        <NavigationContainer
          ref={navigationRef}
          linking={Platform.OS === 'web' ? undefined : navigationLinking}
          onReady={() => {
            if (Platform.OS === 'web') {
              const segId = readSeguimientoIdFromUrl();
              if (!segId || deepLinkWebHandledRef.current) {
                return;
              }
              deepLinkWebHandledRef.current = true;
              // Sin sesión no forzar Navegación con seguimiento: provoca tabs con usuario null y errores en Chat/Historial.
              if (!isAuthenticated) {
                if (typeof window !== 'undefined') {
                  const path = window.location.pathname || '/';
                  window.history.replaceState({}, '', path);
                }
                return;
              }
              navigationRef.reset({
                index: 0,
                routes: [{name: 'Navegacion', params: {seguimientoId: segId}}],
              });
              return;
            }
            void Linking.getInitialURL().then((url) => {
              if (!url || nativeHttpsInitialHandledRef.current) {
                return;
              }
              const m = url.match(/[?&]seguimiento=([^&#]+)/);
              if (!m?.[1]) {
                return;
              }
              nativeHttpsInitialHandledRef.current = true;
              const seguimientoId = decodeURIComponent(m[1]);
              navigationRef.reset({
                index: 0,
                routes: [{name: 'Navegacion', params: {seguimientoId}}],
              });
            });
          }}>
          <Stack.Navigator
            initialRouteName={isAuthenticated ? 'Navegacion' : 'Login'}
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="RollerTips" component={RollerTipsScreen} />
          <Stack.Screen name="RollerTipsProfile" component={RollerTipsProfileScreen} />
          <Stack.Screen name="RollerTipsArchive" component={RollerTipsArchiveScreen} />
          <Stack.Screen name="Marketing" component={MarketingScreen} />
          <Stack.Screen name="MarketingSellSkates" component={MarketingSellSkatesScreen} />
          <Stack.Screen
            name="MarketingSellSkatesStep3"
            component={MarketingSellSkatesStep3Screen}
          />
          <Stack.Screen
            name="MarketingSellSkatesStep4"
            component={MarketingSellSkatesStep4Screen}
          />
          <Stack.Screen
            name="MarketingComprarEnvio"
            component={MarketingComprarEnvioScreen}
          />
          <Stack.Screen
            name="MarketingComprarRevision"
            component={MarketingComprarRevisionScreen}
          />
          <Stack.Screen
            name="MarketingComprarPago"
            component={MarketingComprarPagoScreen}
          />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Navegacion" component={NavegacionScreen} />
            <Stack.Screen name="Comunidad" component={ComunidadScreen} />
            <Stack.Screen name="Historial" component={HistorialScreen} />
            <Stack.Screen name="Calendario" component={CalendarioScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="MenuVentas" component={MenuVentasScreen} />
            <Stack.Screen name="SupportHelp" component={SupportHelpScreen} />
            <Stack.Screen name="AdminBuzon" component={AdminBuzonScreen} />
            <Stack.Screen name="AdminUsuarios" component={AdminUsuariosScreen} />
            <Stack.Screen name="AdminChats" component={AdminChatsScreen} />
            <Stack.Screen name="AdminResetPassword" component={AdminResetPasswordScreen} />
            <Stack.Screen name="AdminVentasGenerales" component={AdminVentasGeneralesScreen} />
            <Stack.Screen name="MisSuscripciones" component={MySubscriptionsScreen} />
            <Stack.Screen name="CrearRecap" component={CrearRecapScreen} />
            <Stack.Screen name="RecapCheckoutPlan" component={RecapCheckoutPlanScreen} />
            <Stack.Screen name="RecapCheckoutDatos" component={RecapCheckoutDatosScreen} />
            <Stack.Screen name="RecapCheckoutRevision" component={RecapCheckoutRevisionScreen} />
            <Stack.Screen name="RecapCheckoutPago" component={RecapCheckoutPagoScreen} />
            <Stack.Screen name="AgregarStaff" component={AgregarStaffScreen} />
            <Stack.Screen name="NombreGrupo" component={NombreGrupoScreen} />
            <Stack.Screen name="AgregarAlias" component={AgregarAliasScreen} />
            <Stack.Screen name="CambiarAlias" component={CambiarAliasScreen} />
            <Stack.Screen name="IntegrantesGrupo" component={IntegrantesGrupoScreen} />
            <Stack.Screen name="CrearEvento" component={CrearEventoScreen} />
            <Stack.Screen name="VistaPreviaEvento" component={VistaPreviaEventoScreen} />
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
