import AsyncStorage from '@react-native-async-storage/async-storage';
import {Usuario, LoginCredentials, RegistroData, AuthResponse} from '../types';
import apiService from './apiService';
import {API_ENDPOINTS, AVATAR} from '../config/api';

const STORAGE_KEY = '@auth:usuario';

class AuthService {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
      );

      if (response.success && response.token && response.usuario) {
        // Guardar token
        await apiService.saveToken(response.token);

        // Guardar usuario en AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(response.usuario));

        return response;
      }

      return {
        success: false,
        error: response.error || 'Error al iniciar sesión',
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al iniciar sesión',
      };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async registro(data: RegistroData): Promise<AuthResponse> {
    try {
      // Preparar datos para el backend
      const registroData = {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        edad: data.edad,
        cumpleaños: data.cumpleaños.toISOString().split('T')[0], // Formato YYYY-MM-DD
        sexo: data.sexo,
        nacionalidad: data.nacionalidad,
        tipoPerfil: data.tipoPerfil,
        avatar: data.avatar || null,
      };

      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTRO,
        registroData,
      );

      if (response.success && response.token && response.usuario) {
        // Guardar token
        await apiService.saveToken(response.token);

        // Guardar usuario en AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(response.usuario));

        return response;
      }

      return {
        success: false,
        error: response.error || 'Error al registrar usuario',
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al registrar usuario',
      };
    }
  }

  /**
   * Obtiene el usuario actual desde la API
   */
  async getCurrentUser(): Promise<Usuario | null> {
    try {
      // Primero intentar obtener desde AsyncStorage (caché local)
      const cachedUser = await AsyncStorage.getItem(STORAGE_KEY);
      
      // Intentar obtener desde la API para datos actualizados
      try {
        const response = await apiService.get<{success: boolean; usuario: Usuario}>(
          API_ENDPOINTS.AUTH.ME,
        );

        if (response.success && response.usuario) {
          // Actualizar caché
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(response.usuario));
          return response.usuario;
        }
      } catch (apiError) {
        // Si falla la API, usar caché local si existe
        console.warn('Error al obtener usuario desde API, usando caché:', apiError);
        if (cachedUser) {
          return JSON.parse(cachedUser);
        }
      }

      // Si hay caché, usarlo
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      return null;
    } catch (error) {
      console.error('Error en getCurrentUser:', error);
      return null;
    }
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    try {
      console.log('AuthService: Iniciando logout, limpiando datos...');
      
      // Limpiar usuario y token del almacenamiento
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('AuthService: Usuario eliminado de AsyncStorage');
      
      await apiService.removeToken();
      console.log('AuthService: Token eliminado de AsyncStorage');
      
      // Verificar que se hayan eliminado correctamente
      const usuario = await AsyncStorage.getItem(STORAGE_KEY);
      const token = await AsyncStorage.getItem('@auth:token');
      
      if (usuario || token) {
        console.warn('AuthService: Advertencia - Algunos datos no se eliminaron correctamente');
      } else {
        console.log('AuthService: Logout completado exitosamente');
      }
    } catch (error) {
      console.error('AuthService: Error al cerrar sesión:', error);
      throw error; // Relanzar el error para que el componente pueda manejarlo
    }
  }

  /**
   * Verifica si hay una sesión activa
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Verificar si hay token y usuario en AsyncStorage primero
      const usuario = await AsyncStorage.getItem(STORAGE_KEY);
      const token = await AsyncStorage.getItem('@auth:token');
      
      // Si no hay usuario o token local, no está autenticado
      if (!usuario || !token) {
        return false;
      }

      // Verificar token con el backend con timeout
      // Si el backend no está disponible, asumir que no está autenticado
      try {
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 3000); // 3 segundos timeout, retornar false
        });

        const apiPromise = apiService.get<{success: boolean; usuario: Usuario}>(
          API_ENDPOINTS.AUTH.ME,
        ).then(response => response.success && response.usuario !== null).catch(() => false);

        return await Promise.race([apiPromise, timeoutPromise]);
      } catch (error) {
        // Si falla la verificación (timeout o error de red), 
        // no hacer logout para mantener la sesión local
        // Solo retornar false para mostrar login
        console.warn('Error verificando autenticación, mostrando login:', error);
        return false;
      }
    } catch (error) {
      console.error('Error en isAuthenticated:', error);
      return false;
    }
  }

  /**
   * Actualiza el avatar del usuario
   */
  async updateAvatar(avatar: string | null): Promise<{success: boolean; usuario?: Usuario; error?: string}> {
    try {
      const response = await apiService.put<{success: boolean; usuario: Usuario; message?: string}>(
        AVATAR.UPDATE,
        {avatar},
      );

      if (response.success && response.usuario) {
        // Actualizar usuario en AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(response.usuario));
        return {
          success: true,
          usuario: response.usuario,
        };
      }

      return {
        success: false,
        error: 'Error al actualizar avatar',
      };
    } catch (error) {
      console.error('Error en updateAvatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar avatar',
      };
    }
  }
}

export default new AuthService();

