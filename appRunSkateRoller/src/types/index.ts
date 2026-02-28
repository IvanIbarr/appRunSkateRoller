export type TipoPerfil = 'administrador' | 'liderGrupo' | 'roller';
export type Sexo = 'masculino' | 'femenino' | 'ambos';
export type Nacionalidad = 'español' | 'inglés';

export interface Usuario {
  id: string;
  email: string;
  edad: number;
  cumpleaños: string | Date; // Puede venir como string desde la API
  sexo: Sexo;
  nacionalidad: Nacionalidad;
  tipoPerfil: TipoPerfil;
  fotoPerfil?: string;
  logo?: string;
  grupoId?: string | null;
  alias?: string | null;
  aliasCambios?: number;
  nombramiento?: 'colider' | 'veterano' | 'nuevo' | null;
  avatar?: string | null;
  fechaRegistro?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistroData {
  email: string;
  password: string;
  confirmPassword: string;
  edad: number;
  cumpleaños: Date;
  sexo: Sexo;
  nacionalidad: Nacionalidad;
  tipoPerfil: TipoPerfil;
  avatar?: string | null;
}

export interface AuthResponse {
  success: boolean;
  usuario?: Usuario;
  token?: string;
  error?: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string | Date;
  hora: string;
  puntoEncuentroLat: number;
  puntoEncuentroLng: number;
  puntoEncuentroDireccion?: string;
  organizadorId: string;
  // Nuevos campos del formulario
  tituloRuta?: string;
  puntoSalida?: string;
  fechaInicio?: string;
  cita?: string;
  salida?: string;
  nivel?: string;
  logoGrupo?: string | null;
  lugarDestino?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

