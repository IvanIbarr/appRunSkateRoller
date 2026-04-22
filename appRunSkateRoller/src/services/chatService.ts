import {Platform} from 'react-native';
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
  /** Presente en POST /chat al crear mensaje */
  message?: Message;
  error?: string;
}

export interface ChatUploadResponse {
  success: boolean;
  url?: string;
  mediaType?: 'image' | 'video';
  error?: string;
}

class ChatService {
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
   * Sube imagen o video para un mensaje de chat (multipart, campo `file`).
   */
  async uploadMedia(
    file: Blob | {uri: string; name: string; type: string},
  ): Promise<ChatUploadResponse> {
    try {
      const formData = new FormData();
      if (Platform.OS === 'web' && typeof Blob !== 'undefined' && file instanceof Blob) {
        const name =
          file.type.startsWith('video') ? 'chat-video.mp4' : 'chat-image.jpg';
        formData.append('file', file, name);
      } else {
        formData.append('file', file as any);
      }
      return await apiService.postFormData<ChatUploadResponse>(
        API_ENDPOINTS.CHAT.UPLOAD,
        formData,
      );
    } catch (error) {
      console.error('Error al subir adjunto de chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir archivo',
      };
    }
  }

  /**
   * Crea mensaje. Texto puede ir vacío si hay adjunto.
   */
  async createMessage(
    chatType: 'general' | 'staff',
    text: string,
    media?: {url: string; type: 'image' | 'video'},
  ): Promise<ChatResponse> {
    try {
      const body: Record<string, unknown> = {
        chatType,
        text: text ?? '',
      };
      if (media?.url) {
        body.mediaUrl = media.url;
        body.mediaType = media.type;
      }
      const response = await apiService.post<ChatResponse>(
        API_ENDPOINTS.CHAT.CREATE_MESSAGE,
        body,
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
