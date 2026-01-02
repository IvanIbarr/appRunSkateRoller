import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';
import {Usuario, AuthResponse} from '../types';

export interface CreateStaffData {
  email: string;
}

export interface CreateStaffResponse {
  success: boolean;
  usuario?: Usuario;
  message?: string;
  error?: string;
}

export interface RemoveStaffData {
  email: string;
}

export interface RemoveStaffResponse {
  success: boolean;
  usuario?: Usuario;
  message?: string;
  error?: string;
}

class StaffService {
  /**
   * Crea un nuevo miembro del staff (solo para líderes y administradores)
   */
  async createStaff(data: CreateStaffData): Promise<CreateStaffResponse> {
    try {
      const response = await apiService.post<CreateStaffResponse>(
        API_ENDPOINTS.STAFF.CREATE,
        data,
      );
      return response;
    } catch (error) {
      console.error('Error al crear staff:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear miembro del staff',
      };
    }
  }

  /**
   * Elimina un miembro del staff (solo para líderes y administradores)
   */
  async removeStaff(data: RemoveStaffData): Promise<RemoveStaffResponse> {
    try {
      const response = await apiService.post<RemoveStaffResponse>(
        API_ENDPOINTS.STAFF.REMOVE,
        data,
      );
      return response;
    } catch (error) {
      console.error('Error al eliminar staff:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar miembro del staff',
      };
    }
  }
}

export default new StaffService();

