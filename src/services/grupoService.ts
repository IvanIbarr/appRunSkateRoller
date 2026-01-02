import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';
import {Usuario} from '../types';

export interface NombreGrupoResponse {
  success: boolean;
  nombreGrupo?: string | null;
  message?: string;
  error?: string;
}

export interface GetIntegrantesGrupoResponse {
  success: boolean;
  integrantes?: Usuario[];
  liderId?: string | null;
  mensaje?: string;
  error?: string;
}

class GrupoService {
  /**
   * Obtiene el nombre del grupo del usuario actual
   */
  async getNombreGrupo(): Promise<NombreGrupoResponse> {
    try {
      const response = await apiService.get<NombreGrupoResponse>(
        API_ENDPOINTS.GRUPO.GET_NOMBRE,
      );
      return response;
    } catch (error) {
      console.error('Error al obtener nombre del grupo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener nombre del grupo',
      };
    }
  }

  /**
   * Actualiza el nombre del grupo
   */
  async updateNombreGrupo(nombreGrupo: string): Promise<NombreGrupoResponse> {
    try {
      const response = await apiService.put<NombreGrupoResponse>(
        API_ENDPOINTS.GRUPO.UPDATE_NOMBRE,
        {nombreGrupo},
      );
      return response;
    } catch (error) {
      console.error('Error al actualizar nombre del grupo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar nombre del grupo',
      };
    }
  }

  /**
   * Obtiene los integrantes del grupo
   */
  async getIntegrantesGrupo(): Promise<GetIntegrantesGrupoResponse> {
    try {
      const response = await apiService.get<GetIntegrantesGrupoResponse>(
        API_ENDPOINTS.GRUPO.GET_INTEGRANTES,
      );
      return response;
    } catch (error) {
      console.error('Error al obtener integrantes del grupo:', error);
      return {
        success: false,
        integrantes: [],
        error: error instanceof Error ? error.message : 'Error al obtener integrantes del grupo',
      };
    }
  }

  /**
   * Actualiza el nombramiento de un integrante del grupo
   */
  async updateNombramiento(usuarioId: string, nombramiento: 'colider' | 'veterano' | 'nuevo' | null): Promise<NombreGrupoResponse> {
    try {
      const response = await apiService.put<NombreGrupoResponse>(
        API_ENDPOINTS.GRUPO.UPDATE_NOMBRAMIENTO,
        {usuarioId, nombramiento},
      );
      return response;
    } catch (error) {
      console.error('Error al actualizar nombramiento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar nombramiento',
      };
    }
  }
}

export default new GrupoService();

