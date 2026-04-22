import AsyncStorage from '@react-native-async-storage/async-storage';
import {Evento} from '../types';
import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';
import {eventoFechaToYmd, ddmmyyyyToYmd, ymdToLocalDate} from '../utils/dateOnly';

const EVENTOS_STORAGE_KEY = '@app:eventos';

export interface CrearEventoData {
  tituloRuta: string;
  puntoSalida: string;
  fechaInicio: string;
  cita: string;
  salida: string;
  nivel: string;
  logoGrupo?: string | null;
  lugarDestino?: string | null;
  organizadorId: string;
}

export interface CrearEventoResponse {
  success: boolean;
  evento?: Evento;
  error?: string;
}

export interface GetEventosResponse {
  success: boolean;
  eventos?: Evento[];
  error?: string;
}

export interface EliminarEventoResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ActualizarEventoData {
  id: string;
  tituloRuta: string;
  puntoSalida: string;
  fechaInicio: string;
  cita: string;
  salida: string;
  nivel: string;
  logoGrupo?: string | null;
  lugarDestino?: string | null;
}

export interface ActualizarEventoResponse {
  success: boolean;
  evento?: Evento;
  error?: string;
}

class EventoService {
  /**
   * Guarda eventos en AsyncStorage (local)
   */
  private async saveEventos(eventos: Evento[]): Promise<void> {
    try {
      // Limitar a los últimos 20 eventos para evitar problemas de cuota
      const eventosLimitados = eventos.slice(-20);
      
      await AsyncStorage.setItem(EVENTOS_STORAGE_KEY, JSON.stringify(eventosLimitados));
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      // Si hay error de cuota, intentar guardar menos eventos
      if (error instanceof Error && error.message.includes('quota')) {
        try {
          // Intentar guardar solo los últimos 10 eventos sin imágenes
          const eventosSinImagenes = eventos.slice(-10).map(evento => ({
            ...evento,
            logoGrupo: null,
            lugarDestino: null,
          }));
          await AsyncStorage.setItem(EVENTOS_STORAGE_KEY, JSON.stringify(eventosSinImagenes));
          console.warn('Eventos guardados sin imágenes debido a límite de almacenamiento');
        } catch (fallbackError) {
          console.error('Error al guardar eventos (fallback):', fallbackError);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Elimina duplicados de eventos
   */
  private eliminarDuplicados(eventos: Evento[]): Evento[] {
    const eventosUnicos: Evento[] = [];
    const vistos = new Set<string>();

    for (const evento of eventos) {
      // Crear clave única basada en ID, o título+fecha
      let clave: string;
      if (evento.id) {
        clave = `id:${evento.id}`;
      } else {
        const titulo = evento.tituloRuta || evento.titulo || '';
        const fecha = eventoFechaToYmd(evento.fecha) || '';
        clave = `titulo:${titulo}:fecha:${fecha}`;
      }

      if (!vistos.has(clave)) {
        vistos.add(clave);
        eventosUnicos.push(evento);
      }
    }

    return eventosUnicos;
  }

  /**
   * Obtiene eventos desde AsyncStorage (local)
   */
  private async getEventosFromStorage(): Promise<Evento[]> {
    try {
      const eventosJson = await AsyncStorage.getItem(EVENTOS_STORAGE_KEY);
      if (eventosJson) {
        const eventos = JSON.parse(eventosJson);
        // Eliminar duplicados antes de devolver
        return this.eliminarDuplicados(eventos);
      }
      return [];
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      return [];
    }
  }

  /**
   * Convierte fecha de formato DD/MM/YYYY a Date
   */
  private parseFecha(fechaString: string): Date {
    const parts = fechaString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Meses son 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  }

  private normalizeEvento(evento: Evento): Evento {
    return {
      ...evento,
      // Mantener fecha como "date-only" (YYYY-MM-DD) para evitar desfase por zona horaria.
      // Si viene en ISO con hora, se recorta; si es Date, se convierte a YYYY-MM-DD local.
      fecha: (eventoFechaToYmd(evento.fecha) || (evento.fecha as any)) as any,
    };
  }

  private buildApiPayload(evento: Evento) {
    const ymd =
      eventoFechaToYmd(evento.fecha) ||
      (typeof evento.fechaInicio === 'string' ? ddmmyyyyToYmd(evento.fechaInicio) : null) ||
      (evento.fecha instanceof Date ? evento.fecha.toISOString().slice(0, 10) : null);

    return {
      id: evento.id,
      titulo: evento.titulo,
      // Enviar siempre YYYY-MM-DD (sin hora).
      fecha: ymd,
      hora: evento.hora,
      puntoEncuentroLat: evento.puntoEncuentroLat,
      puntoEncuentroLng: evento.puntoEncuentroLng,
      puntoEncuentroDireccion: evento.puntoEncuentroDireccion,
      organizadorId: evento.organizadorId,
      tituloRuta: evento.tituloRuta,
      puntoSalida: evento.puntoSalida,
      fechaInicio: evento.fechaInicio,
      cita: evento.cita,
      salida: evento.salida,
      nivel: evento.nivel,
      logoGrupo: evento.logoGrupo,
      lugarDestino: evento.lugarDestino,
    };
  }

  private async syncLocalEventosToApi(localEventos: Evento[], apiEventos: Evento[]): Promise<void> {
    const apiIds = new Set(apiEventos.map(evento => evento.id).filter(Boolean));
    const pendientes = localEventos.filter(evento => evento.id && !apiIds.has(evento.id));
    if (pendientes.length === 0) {
      return;
    }
    for (const evento of pendientes) {
      try {
        await apiService.post<{success: boolean; evento?: Evento; error?: string}>(
          API_ENDPOINTS.EVENTO.CREATE,
          this.buildApiPayload(evento),
        );
      } catch (error) {
        console.warn('No se pudo sincronizar evento con API:', error);
      }
    }
  }

  /**
   * Crea un nuevo evento
   */
  async crearEvento(data: CrearEventoData): Promise<CrearEventoResponse> {
    try {
      const ymd = ddmmyyyyToYmd(data.fechaInicio);
      if (!ymd) {
        return {success: false, error: 'Formato de fecha inválido (usa DD/MM/YYYY)'};
      }
      const fechaLocal = ymdToLocalDate(ymd) || new Date();
      const nuevoEvento: Evento = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único
        titulo: data.tituloRuta,
        // Guardar como date-only string para evitar desfase.
        fecha: ymd,
        hora: data.cita,
        puntoEncuentroLat: 0, // Por defecto
        puntoEncuentroLng: 0, // Por defecto
        puntoEncuentroDireccion: data.puntoSalida,
        organizadorId: data.organizadorId,
        // Nuevos campos
        tituloRuta: data.tituloRuta,
        puntoSalida: data.puntoSalida,
        fechaInicio: data.fechaInicio,
        cita: data.cita,
        salida: data.salida,
        nivel: data.nivel,
        logoGrupo: data.logoGrupo,
        lugarDestino: data.lugarDestino,
        createdAt: fechaLocal,
      };

      const response = await apiService.post<{success: boolean; evento?: Evento; error?: string}>(
        API_ENDPOINTS.EVENTO.CREATE,
        this.buildApiPayload(nuevoEvento),
      );

      if (response.success && response.evento) {
        const eventos = await this.getEventosFromStorage();
        const eventoGuardado = this.normalizeEvento(response.evento);
        eventos.push(eventoGuardado);
        await this.saveEventos(eventos);
        return {
          success: true,
          evento: eventoGuardado,
        };
      }

      return {
        success: false,
        error: response.error || 'No se pudo crear el evento en el servidor',
      };
    } catch (error) {
      console.error('Error al crear evento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear evento',
      };
    }
  }

  /**
   * Obtiene todos los eventos
   */
  async getEventos(): Promise<GetEventosResponse> {
    try {
      const response = await apiService.get<{success: boolean; eventos?: Evento[]; error?: string}>(
        API_ENDPOINTS.EVENTO.GET_ALL,
      );
      if (response.success && response.eventos) {
        const eventosNormalizados = response.eventos.map(evento => this.normalizeEvento(evento));
        const eventosLocales = await this.getEventosFromStorage();
        await this.syncLocalEventosToApi(eventosLocales, eventosNormalizados);
        const combinados = this.eliminarDuplicados([
          ...eventosLocales,
          ...eventosNormalizados,
        ]);
        await this.saveEventos(combinados);
        return {
          success: true,
          eventos: combinados,
        };
      }

      return {
        success: false,
        error: response.error || 'No se pudieron cargar eventos del servidor',
      };
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener eventos',
      };
    }
  }

  /**
   * Elimina un evento por ID
   */
  async eliminarEvento(eventoId: string): Promise<EliminarEventoResponse> {
    try {
      const response = await apiService.delete<{success: boolean; message?: string; error?: string}>(
        API_ENDPOINTS.EVENTO.DELETE(eventoId),
      );
      if (response.success) {
        const eventos = await this.getEventosFromStorage();
        const eventosFiltrados = eventos.filter(e => e.id !== eventoId);
        await this.saveEventos(eventosFiltrados);
        return {
          success: true,
          message: response.message || 'Evento eliminado exitosamente',
        };
      }

      return {
        success: false,
        error: response.error || 'No se pudo eliminar el evento en el servidor',
      };
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar evento',
      };
    }
  }

  /**
   * Actualiza un evento existente
   */
  async actualizarEvento(data: ActualizarEventoData): Promise<ActualizarEventoResponse> {
    try {
      const ymd = ddmmyyyyToYmd(data.fechaInicio);
      if (!ymd) {
        return {success: false, error: 'Formato de fecha inválido (usa DD/MM/YYYY)'};
      }
      const response = await apiService.put<{success: boolean; evento?: Evento; error?: string}>(
        API_ENDPOINTS.EVENTO.UPDATE(data.id),
        {
          titulo: data.tituloRuta,
          fecha: ymd,
          hora: data.cita,
          puntoEncuentroDireccion: data.puntoSalida,
          tituloRuta: data.tituloRuta,
          puntoSalida: data.puntoSalida,
          fechaInicio: data.fechaInicio,
          cita: data.cita,
          salida: data.salida,
          nivel: data.nivel,
          logoGrupo: data.logoGrupo,
          lugarDestino: data.lugarDestino,
        },
      );
      if (response.success && response.evento) {
        const eventos = await this.getEventosFromStorage();
        const eventoActualizado = this.normalizeEvento(response.evento);
        const index = eventos.findIndex(e => e.id === data.id);
        if (index >= 0) {
          eventos[index] = eventoActualizado;
        } else {
          eventos.push(eventoActualizado);
        }
        await this.saveEventos(eventos);
        return {
          success: true,
          evento: eventoActualizado,
        };
      }

      return {
        success: false,
        error: response.error || 'No se pudo actualizar el evento en el servidor',
      };
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar evento',
      };
    }
  }

  /**
   * Limpia todos los eventos excepto los dos más recientes
   */
  async limpiarEventosAntiguos(): Promise<EliminarEventoResponse> {
    try {
      const eventos = await this.getEventosFromStorage();
      
      if (eventos.length <= 2) {
        return {
          success: true,
          message: 'Ya hay 2 o menos eventos',
        };
      }

      // Ordenar por fecha (más recientes primero)
      const eventosOrdenados = [...eventos].sort((a, b) => {
        const fechaA = typeof a.fecha === 'string' ? new Date(a.fecha) : a.fecha;
        const fechaB = typeof b.fecha === 'string' ? new Date(b.fecha) : b.fecha;
        return fechaB.getTime() - fechaA.getTime(); // Más recientes primero
      });

      // Mantener solo los 2 más recientes
      const eventosAMantener = eventosOrdenados.slice(0, 2);
      await this.saveEventos(eventosAMantener);

      return {
        success: true,
        message: `Se eliminaron ${eventos.length - 2} eventos. Se mantuvieron los 2 más recientes.`,
      };
    } catch (error) {
      console.error('Error al limpiar eventos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al limpiar eventos',
      };
    }
  }
}

export default new EventoService();

