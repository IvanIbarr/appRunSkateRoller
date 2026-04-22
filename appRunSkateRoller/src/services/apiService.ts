import AsyncStorage from '@react-native-async-storage/async-storage';
import {resolveApiUrl} from '../config/api';
import {appLog} from '../utils/clientLogger';

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
      const response = await fetch(resolveApiUrl(url), config);

      if (!response.ok) {
        const text = await response.text();
        let message = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(text) as {error?: string; details?: unknown};
          if (errorData.error) {
            message = errorData.error;
          } else if (Array.isArray(errorData.details) && errorData.details[0]) {
            const d = errorData.details[0] as {msg?: string};
            message = d.msg || message;
          }
        } catch {
          const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 120);
          if (snippet) {
            message = `${message}: ${snippet}`;
          } else {
            message = `${message}. ¿Backend en puerto 3001 y proxy de webpack activo?`;
          }
        }
        let pathHint = '';
        try {
          pathHint = new URL(resolveApiUrl(url)).pathname;
        } catch {
          pathHint = 'api';
        }
        appLog.error(`API HTTP ${response.status} ${String(config.method || 'GET')} ${pathHint}: ${message}`, {
          screen: 'apiService',
          context: {status: response.status, path: pathHint},
        });
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      let pathHint = '';
      try {
        pathHint = new URL(resolveApiUrl(url)).pathname;
      } catch {
        pathHint = 'api';
      }
      if (error instanceof Error) {
        if (!error.message.startsWith('HTTP ')) {
          appLog.error(`API red ${String(config.method || 'GET')} ${pathHint}: ${error.message}`, {
            screen: 'apiService',
            context: {path: pathHint},
          });
        }
        throw error;
      }
      appLog.error(`API conexión ${String(config.method || 'GET')} ${pathHint}`, {
        screen: 'apiService',
      });
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
   * POST multipart (sin Content-Type JSON; el boundary lo fija el runtime).
   */
  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    const token = await this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(resolveApiUrl(url), {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        let message = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(text) as {error?: string};
          if (errorData.error) {
            message = errorData.error;
          }
        } catch {
          const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 120);
          if (snippet) {
            message = `${message}: ${snippet}`;
          }
        }
        appLog.error(`API multipart HTTP ${response.status}`, {screen: 'apiService'});
        throw new Error(message);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && !error.message.startsWith('HTTP ')) {
        appLog.error(`API multipart: ${error.message}`, {screen: 'apiService'});
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión');
    }
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

