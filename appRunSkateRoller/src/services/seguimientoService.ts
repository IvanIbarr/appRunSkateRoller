import apiService from './apiService';
import API_BASE_URL from '../config/api';

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
  avatar: string | null;
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
      `${API_BASE_URL}/seguimiento/history?period=${period}`,
    );
  }

  async getLeaderboard(period: 'week' | 'month' | 'year' = 'month', limit = 10) {
    return apiService.get<LeaderboardResponse>(
      `${API_BASE_URL}/seguimiento/leaderboard?period=${period}&limit=${limit}`,
    );
  }
}

export default new SeguimientoService();
