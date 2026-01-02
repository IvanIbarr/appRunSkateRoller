import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_ENDPOINTS} from '../config/api';

const TOKEN_KEY = '@auth:token';

class ApiService {
  /**
   * Obtiene el token de autenticación
   */
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Guarda el token de autenticación
   */
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error al guardar token:', error);
    }
  }

  /**
   * Elimina el token de autenticación
   */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error al eliminar token:', error);
    }
  }

  /**
   * Realiza una petición HTTP
   */
  private async request<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Error en la petición',
        }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión');
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, {method: 'GET'});
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, {method: 'DELETE'});
  }
}

export default new ApiService();

