import AsyncStorage from '@react-native-async-storage/async-storage';
import {Evento} from '../types';
import apiService from './apiService';
import {API_ENDPOINTS} from '../config/api';
import {eventoFechaToYmd, userDateToYmd, ymdToLocalDate} from '../utils/dateOnly';

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

/** Fila devuelta por GET /api/evento (camelCase desde el backend). */
function mapApiRowToEvento(row: Record<string, unknown>): Evento {
  const fechaRaw = row.fecha ?? row.fechaInicio;
  const fechaYmd =
    (typeof fechaRaw === 'string' ? eventoFechaToYmd(fechaRaw) : null) ||
    (typeof row.fechaInicio === 'string' ? userDateToYmd(row.fechaInicio) : null);

  // Guardar como YYYY-MM-DD (date-only) para evitar desfase por zona horaria.
  const fecha: string | Date = fechaYmd || new Date();

  const tituloRuta = (row.tituloRuta as string) || (row.titulo as string) || '';

  return {
    id: String(row.id),
    titulo: (row.titulo as string) || tituloRuta,
    fecha,
    hora: (row.hora as string) || (row.cita as string) || '',
    puntoEncuentroLat: Number(row.puntoEncuentroLat) || 0,
    puntoEncuentroLng: Number(row.puntoEncuentroLng) || 0,
    puntoEncuentroDireccion: (row.puntoEncuentroDireccion as string) || undefined,
    organizadorId: (row.organizadorId as string) || undefined,
    tituloRuta,
    puntoSalida: (row.puntoSalida as string) || undefined,
    fechaInicio: (row.fechaInicio as string) || undefined,
    cita: (row.cita as string) || undefined,
    salida: (row.salida as string) || undefined,
    nivel: (row.nivel as string) || undefined,
    logoGrupo: (row.logoGrupo as string) || null,
    lugarDestino: (row.lugarDestino as string) || null,
    createdAt: row.createdAt
      ? new Date(row.createdAt as string)
      : undefined,
    updatedAt: row.updatedAt
      ? new Date(row.updatedAt as string)
      : undefined,
  };
}

async function tryFetchEventosFromApi(): Promise<Evento[] | null> {
  try {
    const res = await apiService.get<{
      success?: boolean;
      eventos?: Record<string, unknown>[];
    }>(API_ENDPOINTS.EVENTO.LIST);
    if (res?.success && Array.isArray(res.eventos)) {
      return res.eventos.map((r) => mapApiRowToEvento(r));
    }
    return null;
  } catch {
    return null;
  }
}

class EventoService {
  private async saveEventos(eventos: Evento[]): Promise<void> {
    try {
      const eventosLimitados = eventos.slice(-20);
      await AsyncStorage.setItem(
        EVENTOS_STORAGE_KEY,
        JSON.stringify(eventosLimitados),
      );
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      if (error instanceof Error && error.message.includes('quota')) {
        try {
          const eventosSinImagenes = eventos.slice(-10).map((evento) => ({
            ...evento,
            logoGrupo: null,
            lugarDestino: null,
          }));
          await AsyncStorage.setItem(
            EVENTOS_STORAGE_KEY,
            JSON.stringify(eventosSinImagenes),
          );
          console.warn(
            'Eventos guardados sin imágenes debido a límite de almacenamiento',
          );
        } catch (fallbackError) {
          console.error('Error al guardar eventos (fallback):', fallbackError);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  private eliminarDuplicados(eventos: Evento[]): Evento[] {
    const eventosUnicos: Evento[] = [];
    const vistos = new Set<string>();

    for (const evento of eventos) {
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

  private async getEventosFromStorage(): Promise<Evento[]> {
    try {
      const eventosJson = await AsyncStorage.getItem(EVENTOS_STORAGE_KEY);
      if (eventosJson) {
        const eventos = JSON.parse(eventosJson);
        return this.eliminarDuplicados(eventos);
      }
      return [];
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      return [];
    }
  }

  private buildApiPayloadFromCrear(
    data: CrearEventoData,
    id: string,
    fechaYmd: string,
  ): Record<string, unknown> {
    return {
      id,
      titulo: data.tituloRuta,
      tituloRuta: data.tituloRuta,
      puntoSalida: data.puntoSalida,
      fechaInicio: data.fechaInicio,
      fecha: fechaYmd,
      cita: data.cita,
      salida: data.salida,
      nivel: data.nivel,
      logoGrupo: data.logoGrupo ?? null,
      lugarDestino: data.lugarDestino ?? null,
      organizadorId: data.organizadorId,
      hora: data.cita,
      puntoEncuentroLat: 0,
      puntoEncuentroLng: 0,
      puntoEncuentroDireccion: data.puntoSalida,
    };
  }

  async crearEvento(data: CrearEventoData): Promise<CrearEventoResponse> {
    const fechaYmd = userDateToYmd(data.fechaInicio);
    if (!fechaYmd) {
      return {
        success: false,
        error: 'Formato de fecha inválido. Usa DD/MM/AAAA o AAAA-MM-DD (ej. 22/04/2026).',
      };
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const res = await apiService.post<{
        success?: boolean;
        evento?: Record<string, unknown>;
        error?: string;
      }>(API_ENDPOINTS.EVENTO.LIST, this.buildApiPayloadFromCrear(data, id, fechaYmd));

      if (res?.evento && res.success !== false) {
        const evento = mapApiRowToEvento(res.evento);
        const locales = await this.getEventosFromStorage();
        const sinEste = locales.filter((e) => e.id !== evento.id);
        sinEste.push(evento);
        await this.saveEventos(this.eliminarDuplicados(sinEste));
        return {success: true, evento};
      }
      if (res && res.success === false && res.error) {
        return {success: false, error: res.error};
      }
    } catch (e) {
      console.warn('crearEvento: falló publicación en servidor:', e);
      // Fallback: guardar localmente (útil en web móvil vía túnel / sin backend accesible).
      const eventoLocal: Evento = {
        id,
        titulo: data.tituloRuta,
        tituloRuta: data.tituloRuta,
        fecha: fechaYmd,
        hora: data.cita,
        puntoEncuentroLat: 0,
        puntoEncuentroLng: 0,
        puntoEncuentroDireccion: data.puntoSalida,
        organizadorId: data.organizadorId,
        puntoSalida: data.puntoSalida,
        fechaInicio: data.fechaInicio,
        cita: data.cita,
        salida: data.salida,
        nivel: data.nivel,
        logoGrupo: data.logoGrupo ?? null,
        lugarDestino: data.lugarDestino ?? null,
      };
      try {
        const locales = await this.getEventosFromStorage();
        const sinEste = locales.filter((ev) => ev.id !== eventoLocal.id);
        sinEste.push(eventoLocal);
        await this.saveEventos(this.eliminarDuplicados(sinEste));
        return {success: true, evento: eventoLocal};
      } catch (storageError) {
        return {
          success: false,
          error:
            e instanceof Error
              ? `No se pudo publicar en el servidor: ${e.message}`
              : 'No se pudo publicar en el servidor',
        };
      }
    }

    return {success: false, error: 'No se pudo publicar en el servidor'};
  }

  async getEventos(): Promise<GetEventosResponse> {
    try {
      const remotos = await tryFetchEventosFromApi();
      if (remotos !== null) {
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);
        const eventosFiltrados = remotos.filter((evento) => {
          const ymd = eventoFechaToYmd(evento.fecha);
          const fechaEvento =
            (ymd ? ymdToLocalDate(ymd) : null) ||
            (typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha);
          fechaEvento.setHours(0, 0, 0, 0);
          const diasDiferencia = Math.floor(
            (ahora.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24),
          );
          return diasDiferencia < 30;
        });

        await this.saveEventos(eventosFiltrados);

        const eventosConFechas = eventosFiltrados.map((evento) => ({
          ...evento,
          fecha: evento.fecha,
        }));

        return {
          success: true,
          eventos: eventosConFechas,
        };
      }
    } catch (e) {
      console.warn('getEventos: API falló, usando almacenamiento local', e);
    }

    try {
      const eventos = await this.getEventosFromStorage();
      const eventosSinDuplicados = this.eliminarDuplicados(eventos);

      const ahora = new Date();
      const eventosFiltrados = eventosSinDuplicados.filter((evento) => {
        const ymd = eventoFechaToYmd(evento.fecha);
        const fechaEvento =
          (ymd ? ymdToLocalDate(ymd) : null) ||
          (typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha);
        fechaEvento.setHours(0, 0, 0, 0);
        const diasDiferencia = Math.floor(
          (ahora.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diasDiferencia < 30;
      });

      if (eventosFiltrados.length < eventos.length) {
        await this.saveEventos(eventosFiltrados);
      }

      const eventosConFechas = eventosFiltrados.map((evento) => ({
        ...evento,
        fecha: evento.fecha,
      }));

      return {
        success: true,
        eventos: eventosConFechas,
      };
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      if (error instanceof Error && error.message.includes('quota')) {
        try {
          const eventos = await this.getEventosFromStorage();
          const eventosLimitados = eventos.slice(-10);
          await this.saveEventos(eventosLimitados);
          return this.getEventos();
        } catch (cleanupError) {
          console.error('Error al limpiar eventos:', cleanupError);
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener eventos',
      };
    }
  }

  async eliminarEvento(eventoId: string): Promise<EliminarEventoResponse> {
    let eliminadoEnServidor = false;
    try {
      await apiService.delete(API_ENDPOINTS.EVENTO.BY_ID(eventoId));
      eliminadoEnServidor = true;
    } catch (e) {
      console.warn('eliminarEvento API:', e);
    }

    try {
      const eventos = await this.getEventosFromStorage();
      const eventosFiltrados = eventos.filter((e) => e.id !== eventoId);
      const habiaEnLocal = eventosFiltrados.length < eventos.length;

      if (habiaEnLocal) {
        await this.saveEventos(eventosFiltrados);
      }

      if (eliminadoEnServidor || habiaEnLocal) {
        return {
          success: true,
          message: 'Evento eliminado exitosamente',
        };
      }

      return {
        success: false,
        error: 'Evento no encontrado',
      };
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar evento',
      };
    }
  }

  async actualizarEvento(data: ActualizarEventoData): Promise<ActualizarEventoResponse> {
    const fechaYmd = userDateToYmd(data.fechaInicio);
    if (!fechaYmd) {
      return {success: false, error: 'Formato de fecha inválido. Usa DD/MM/AAAA o AAAA-MM-DD.'};
    }

    const cuerpo = {
      titulo: data.tituloRuta,
      tituloRuta: data.tituloRuta,
      puntoSalida: data.puntoSalida,
      fechaInicio: data.fechaInicio,
      fecha: fechaYmd,
      cita: data.cita,
      salida: data.salida,
      nivel: data.nivel,
      logoGrupo: data.logoGrupo ?? null,
      lugarDestino: data.lugarDestino ?? null,
      hora: data.cita,
      puntoEncuentroDireccion: data.puntoSalida,
    };

    try {
      const res = await apiService.put<{
        success?: boolean;
        evento?: Record<string, unknown>;
      }>(API_ENDPOINTS.EVENTO.BY_ID(data.id), cuerpo);

      if (res?.success && res.evento) {
        const evento = mapApiRowToEvento(res.evento);
        const eventos = await this.getEventosFromStorage();
        const idx = eventos.findIndex((e) => e.id === data.id);
        if (idx >= 0) {
          eventos[idx] = evento;
        } else {
          eventos.push(evento);
        }
        await this.saveEventos(this.eliminarDuplicados(eventos));
        return {success: true, evento};
      }
    } catch (e) {
      console.warn('actualizarEvento API:', e);
    }

    try {
      const eventos = await this.getEventosFromStorage();
      const eventoIndex = eventos.findIndex((e) => e.id === data.id);

      const eventoActualizado: Evento = {
        ...(eventoIndex >= 0 ? eventos[eventoIndex] : ({} as Evento)),
        id: data.id,
        titulo: data.tituloRuta,
        tituloRuta: data.tituloRuta,
        puntoSalida: data.puntoSalida,
        puntoEncuentroDireccion: data.puntoSalida,
        fechaInicio: data.fechaInicio,
        fecha: fechaYmd,
        cita: data.cita,
        salida: data.salida,
        hora: data.cita,
        nivel: data.nivel,
        logoGrupo: data.logoGrupo,
        lugarDestino: data.lugarDestino,
        updatedAt: new Date(),
        organizadorId:
          eventoIndex >= 0
            ? eventos[eventoIndex].organizadorId
            : 'local',
        puntoEncuentroLat:
          eventoIndex >= 0 ? eventos[eventoIndex].puntoEncuentroLat : 0,
        puntoEncuentroLng:
          eventoIndex >= 0 ? eventos[eventoIndex].puntoEncuentroLng : 0,
      };

      if (eventoIndex === -1) {
        eventos.push(eventoActualizado);
      } else {
        eventos[eventoIndex] = eventoActualizado;
      }

      await this.saveEventos(eventos);
      return {success: true, evento: eventoActualizado};
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar evento',
      };
    }
  }

  async limpiarEventosAntiguos(): Promise<EliminarEventoResponse> {
    try {
      const eventos = await this.getEventosFromStorage();

      if (eventos.length <= 2) {
        return {
          success: true,
          message: 'Ya hay 2 o menos eventos',
        };
      }

      const eventosOrdenados = [...eventos].sort((a, b) => {
        const fechaA = typeof a.fecha === 'string' ? new Date(a.fecha) : a.fecha;
        const fechaB = typeof b.fecha === 'string' ? new Date(b.fecha) : b.fecha;
        return fechaB.getTime() - fechaA.getTime();
      });

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
