import apiService from './apiService';
import {getApiBaseUrl} from '../config/api';

export interface SeguimientoStats {
  distanciaTotal: number;
  velocidadPromedio: number;
  velocidadMaxima: number;
  duracion: number;
  numPuntos: number;
}

export interface SeguimientoHistoryItem {
  id: string;
  usuario_id: string;
  origen: string | null;
  destino: string | null;
  activo: boolean;
  creado_en: string;
  finalizado_en: string | null;
  stats?: SeguimientoStats;
}

export interface HistoryResponse {
  success: boolean;
  data: SeguimientoHistoryItem[];
  error?: string;
}

export interface LeaderboardItem {
  userId: string;
  email: string;
  alias: string | null;
  /** Emoji o icono breve (legacy) */
  avatar: string | null;
  /** Ruta `/uploads/...` o URL absoluta; prioridad en UI sobre `avatar` */
  fotoPerfil?: string | null;
  totalKilometros: number;
  totalRecorridos: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardItem[];
  error?: string;
}

class SeguimientoService {
  async getHistory(period: 'week' | 'month' | 'year' | 'all' = 'all') {
    return apiService.get<HistoryResponse>(
      `${getApiBaseUrl()}/seguimiento/history?period=${period}`,
    );
  }

  async getLeaderboard(period: 'week' | 'month' | 'year' = 'month', limit = 10) {
    return apiService.get<LeaderboardResponse>(
      `${getApiBaseUrl()}/seguimiento/leaderboard?period=${period}&limit=${limit}`,
    );
  }
}

export default new SeguimientoService();
