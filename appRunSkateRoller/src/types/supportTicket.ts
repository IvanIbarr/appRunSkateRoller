export type SupportArea =
  | 'ruta'
  | 'chat'
  | 'historial'
  | 'calendario'
  | 'rollertips'
  | 'marketing'
  | 'compras'
  | 'juego'
  | 'mi_cuenta'
  | 'lenguaje_seguro'
  | 'otro';

export type SupportTicketStatus = 'nuevo' | 'visto' | 'resuelto';

export interface SupportTicket {
  id: string;
  createdAt: string; // ISO
  status: SupportTicketStatus;
  area: SupportArea;
  title: string;
  description: string;
  fromEmail?: string | null;
  fromUserId?: string | null;
}

