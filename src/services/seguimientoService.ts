import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';

export interface Seguimiento {
  id: string;
  usuario_id: string; // UUID
  origen: string;
  destino: string;
  activo: boolean;
  creado_en: string;
  finalizado_en?: string;
  puntos?: LocationPoint[];
  ultimoPunto?: LocationPoint;
  stats?: SeguimientoStats;
}

export interface SeguimientoStats {
  distanciaTotal: number; // en metros
  velocidadPromedio: number; // en m/s
  velocidadMaxima: number; // en m/s
  duracion: number; // en segundos
  numPuntos: number;
}

export interface UserStats {
  totalRecorridos: number;
  totalKilometros: number;
  velocidadPromedioGeneral: number; // en m/s
  duracionTotal: number; // en segundos
  recorridosSemana: number;
  recorridosMes: number;
}

export interface LocationPoint {
  latitud: number;
  longitud: number;
  precision?: number;
  velocidad?: number;
  timestamp?: number;
  creado_en: string;
}

class SeguimientoService {
  /**
   * Crea una nueva sesión de seguimiento
   */
  async createSeguimiento(origen: string, destino: string): Promise<Seguimiento> {
    const response = await apiService.post<{success: boolean; data: Seguimiento}>(
      API_ENDPOINTS.SEGUIMIENTO.CREATE,
      {origen, destino},
    );
    return response.data;
  }

  /**
   * Obtiene una sesión de seguimiento por ID (público)
   */
  async getSeguimiento(id: string): Promise<Seguimiento> {
    const response = await apiService.get<{success: boolean; data: Seguimiento}>(
      API_ENDPOINTS.SEGUIMIENTO.GET(id),
    );
    return response.data;
  }

  /**
   * Obtiene seguimientos activos del usuario
   */
  async getActiveSeguimientos(): Promise<Seguimiento[]> {
    const response = await apiService.get<{success: boolean; data: Seguimiento[]}>(
      API_ENDPOINTS.SEGUIMIENTO.ACTIVE,
    );
    return response.data || [];
  }

  /**
   * Finaliza un seguimiento
   */
  async finishSeguimiento(id: string): Promise<Seguimiento> {
    const response = await apiService.post<{success: boolean; data: Seguimiento}>(
      API_ENDPOINTS.SEGUIMIENTO.FINISH(id),
    );
    return response.data;
  }

  /**
   * Agrega un punto de ubicación a un seguimiento
   */
  async addLocationPoint(
    seguimientoId: string,
    latitude: number,
    longitude: number,
    accuracy?: number,
    speed?: number,
    timestamp?: number,
  ): Promise<LocationPoint> {
    const response = await apiService.post<{success: boolean; data: LocationPoint}>(
      API_ENDPOINTS.SEGUIMIENTO.ADD_LOCATION_POINT,
      {
        seguimientoId,
        latitude,
        longitude,
        accuracy,
        speed,
        timestamp: timestamp || Date.now(),
      },
    );
    return response.data;
  }

  /**
   * Obtiene el historial de seguimientos finalizados del usuario
   */
  async getHistory(period: 'week' | 'month' | 'year' | 'all' = 'all'): Promise<Seguimiento[]> {
    const response = await apiService.get<{success: boolean; data: Seguimiento[]}>(
      `${API_ENDPOINTS.SEGUIMIENTO.HISTORY}?period=${period}`,
    );
    return response.data || [];
  }

  /**
   * Obtiene estadísticas de un seguimiento específico
   */
  async getStats(seguimientoId: string): Promise<SeguimientoStats> {
    const response = await apiService.get<{success: boolean; data: SeguimientoStats}>(
      API_ENDPOINTS.SEGUIMIENTO.STATS(seguimientoId),
    );
    return response.data;
  }

  /**
   * Obtiene estadísticas agregadas del usuario
   */
  async getUserStats(period: 'week' | 'month' | 'year' | 'all' = 'all'): Promise<UserStats> {
    const response = await apiService.get<{success: boolean; data: UserStats}>(
      `${API_ENDPOINTS.SEGUIMIENTO.USER_STATS}?period=${period}`,
    );
    return response.data;
  }
}

export default new SeguimientoService();

