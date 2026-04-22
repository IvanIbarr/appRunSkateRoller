import AsyncStorage from '@react-native-async-storage/async-storage';
import type {SupportTicket, SupportTicketStatus} from '../types/supportTicket';

const STORAGE_KEY = '@support:tickets:v1';

type Stored = {tickets: SupportTicket[]};

function safeParse(raw: string | null): Stored {
  if (!raw) {
    return {tickets: []};
  }
  try {
    const obj = JSON.parse(raw) as Partial<Stored>;
    if (obj && Array.isArray(obj.tickets)) {
      return {tickets: obj.tickets as SupportTicket[]};
    }
  } catch {
    // ignore
  }
  return {tickets: []};
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

class SupportService {
  async listTickets(): Promise<SupportTicket[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {tickets} = safeParse(raw);
    // más nuevos primero
    return [...tickets].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async createTicket(
    draft: Omit<SupportTicket, 'id' | 'createdAt' | 'status'> & {status?: SupportTicketStatus},
  ): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: makeId(),
      createdAt: nowIso(),
      status: draft.status ?? 'nuevo',
      area: draft.area,
      title: draft.title,
      description: draft.description,
      fromEmail: draft.fromEmail ?? null,
      fromUserId: draft.fromUserId ?? null,
    };

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {tickets} = safeParse(raw);
    const next = {tickets: [ticket, ...tickets].slice(0, 200)};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return ticket;
  }

  async updateStatus(id: string, status: SupportTicketStatus): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {tickets} = safeParse(raw);
    const nextTickets = tickets.map((t) => (t.id === id ? {...t, status} : t));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({tickets: nextTickets}));
  }

  async deleteTicket(id: string): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {tickets} = safeParse(raw);
    const nextTickets = tickets.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({tickets: nextTickets}));
  }
}

export default new SupportService();

