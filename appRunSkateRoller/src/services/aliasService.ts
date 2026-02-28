import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';
import {Usuario} from '../types';

export interface AliasResponse {
  success: boolean;
  usuario?: Usuario;
  alias?: string | null;
  aliasCambios?: number;
  cambiosRestantes?: number | null;
  message?: string;
  error?: string;
}

class AliasService {
  /**
   * Obtiene la información del alias del usuario actual
   */
  async getAlias(): Promise<AliasResponse> {
    try {
      const response = await apiService.get<AliasResponse>(API_ENDPOINTS.ALIAS.GET);
      return response;
    } catch (error) {
      console.error('Error al obtener alias:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener alias',
      };
    }
  }

  /**
   * Agrega un alias al usuario (primera vez)
   */
  async agregarAlias(alias: string): Promise<AliasResponse> {
    try {
      const response = await apiService.post<AliasResponse>(
        API_ENDPOINTS.ALIAS.AGREGAR,
        {alias},
      );
      return response;
    } catch (error) {
      console.error('Error al agregar alias:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al agregar alias',
      };
    }
  }

  /**
   * Cambia el alias del usuario (máximo 3 cambios)
   */
  async cambiarAlias(alias: string): Promise<AliasResponse> {
    try {
      const response = await apiService.put<AliasResponse>(
        API_ENDPOINTS.ALIAS.CAMBIAR,
        {alias},
      );
      return response;
    } catch (error) {
      console.error('Error al cambiar alias:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al cambiar alias',
      };
    }
  }
}

export default new AliasService();
