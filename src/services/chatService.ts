import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';

export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: Date | string;
  chatType?: string;
  attachmentUrl?: string | null;
  attachmentType?: 'image' | 'video' | null;
}

export interface ChatResponse {
  success: boolean;
  messages?: Message[];
  message?: Message;
  error?: string;
}

class ChatService {
  /**
   * Obtiene mensajes de un chat específico
   */
  async getMessages(chatType: 'general' | 'staff'): Promise<ChatResponse> {
    try {
      const response = await apiService.get<ChatResponse>(
        API_ENDPOINTS.CHAT.GET_MESSAGES(chatType),
      );
      return response;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener mensajes',
      };
    }
  }

  /**
   * Crea un nuevo mensaje
   */
  async createMessage(
    chatType: 'general' | 'staff',
    text: string,
    attachment?: {uri: string; type: 'image' | 'video'},
  ): Promise<ChatResponse> {
    try {
      const payload: any = {
        chatType,
        text: text || '',
      };

      // Si hay adjunto, incluir la información
      if (attachment) {
        payload.attachment = attachment.uri; // Base64 o URL
        payload.attachmentType = attachment.type;
      }

      const response = await apiService.post<ChatResponse>(
        API_ENDPOINTS.CHAT.CREATE_MESSAGE,
        payload,
      );
      return response;
    } catch (error) {
      console.error('Error al crear mensaje:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear mensaje',
      };
    }
  }
}

export default new ChatService();

