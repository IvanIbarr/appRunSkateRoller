import AsyncStorage from '@react-native-async-storage/async-storage';
import {Evento} from '../types';

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
        const fecha = typeof evento.fecha === 'string' 
          ? evento.fecha 
          : evento.fecha.toISOString().split('T')[0];
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

  /**
   * Crea un nuevo evento
   */
  async crearEvento(data: CrearEventoData): Promise<CrearEventoResponse> {
    try {
      const eventos = await this.getEventosFromStorage();
      
      // Verificar si ya existe un evento con el mismo título y fecha
      const fechaEvento = this.parseFecha(data.fechaInicio);
      const fechaEventoStr = fechaEvento.toISOString().split('T')[0];
      
      const eventoExistente = eventos.find(e => {
        const titulo = e.tituloRuta || e.titulo;
        const fecha = typeof e.fecha === 'string' ? new Date(e.fecha).toISOString().split('T')[0] : e.fecha.toISOString().split('T')[0];
        return titulo === data.tituloRuta && fecha === fechaEventoStr;
      });
      
      if (eventoExistente) {
        return {
          success: false,
          error: 'Ya existe un evento con este título y fecha',
        };
      }
      
      // Crear nuevo evento con ID único
      const nuevoEvento: Evento = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único
        titulo: data.tituloRuta,
        fecha: fechaEvento,
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
        createdAt: new Date(),
      };

      eventos.push(nuevoEvento);
      await this.saveEventos(eventos);

      return {
        success: true,
        evento: nuevoEvento,
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
      const eventos = await this.getEventosFromStorage();
      
      // Eliminar duplicados primero
      const eventosSinDuplicados = this.eliminarDuplicados(eventos);

      // Limpiar eventos antiguos (más de 30 días) para liberar espacio
      const ahora = new Date();
      const eventosFiltrados = eventosSinDuplicados.filter(evento => {
        const fechaEvento = typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha;
        const diasDiferencia = Math.floor((ahora.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24));
        return diasDiferencia < 30; // Mantener solo eventos de los últimos 30 días
      });

      // Si se eliminaron eventos o duplicados, guardar la lista filtrada
      if (eventosFiltrados.length < eventos.length) {
        await this.saveEventos(eventosFiltrados);
      }
      
      // Convertir strings de fecha a Date objects
      const eventosConFechas = eventosFiltrados.map(evento => ({
        ...evento,
        fecha: typeof evento.fecha === 'string' ? new Date(evento.fecha) : evento.fecha,
      }));

      return {
        success: true,
        eventos: eventosConFechas,
      };
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      // Si hay error de cuota, intentar limpiar eventos antiguos
      if (error instanceof Error && error.message.includes('quota')) {
        try {
          const eventos = await this.getEventosFromStorage();
          // Mantener solo los últimos 10 eventos
          const eventosLimitados = eventos.slice(-10);
          await this.saveEventos(eventosLimitados);
          // Reintentar obtener eventos
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

  /**
   * Elimina un evento por ID
   */
  async eliminarEvento(eventoId: string): Promise<EliminarEventoResponse> {
    try {
      const eventos = await this.getEventosFromStorage();
      const eventosFiltrados = eventos.filter(e => e.id !== eventoId);
      
      if (eventosFiltrados.length === eventos.length) {
        return {
          success: false,
          error: 'Evento no encontrado',
        };
      }

      await this.saveEventos(eventosFiltrados);

      return {
        success: true,
        message: 'Evento eliminado exitosamente',
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
      const eventos = await this.getEventosFromStorage();
      
      // Buscar el evento a actualizar
      const eventoIndex = eventos.findIndex(e => e.id === data.id);
      
      if (eventoIndex === -1) {
        return {
          success: false,
          error: 'Evento no encontrado',
        };
      }

      // Parsear la fecha
      const fechaEvento = this.parseFecha(data.fechaInicio);

      // Actualizar el evento
      const eventoActualizado: Evento = {
        ...eventos[eventoIndex],
        titulo: data.tituloRuta,
        tituloRuta: data.tituloRuta,
        puntoSalida: data.puntoSalida,
        puntoEncuentroDireccion: data.puntoSalida,
        fechaInicio: data.fechaInicio,
        fecha: fechaEvento,
        cita: data.cita,
        salida: data.salida,
        hora: data.cita,
        nivel: data.nivel,
        logoGrupo: data.logoGrupo,
        lugarDestino: data.lugarDestino,
        updatedAt: new Date(),
      };

      eventos[eventoIndex] = eventoActualizado;
      await this.saveEventos(eventos);

      return {
        success: true,
        evento: eventoActualizado,
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

