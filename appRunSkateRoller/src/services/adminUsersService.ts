import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Usuario} from '../types';
import supportService from './supportService';
import eventoService from './eventoService';

export interface AdminUserRow {
  id: string;
  email: string;
  tipoPerfil: Usuario['tipoPerfil'];
  createdAtIso: string; // ISO
}

const STORAGE_KEY = '@admin:users:v1';

type Stored = {users: AdminUserRow[]};

function safeParse(raw: string | null): Stored {
  if (!raw) {
    return {users: []};
  }
  try {
    const obj = JSON.parse(raw) as Partial<Stored>;
    if (obj && Array.isArray(obj.users)) {
      return {users: obj.users as AdminUserRow[]};
    }
  } catch {
    // ignore
  }
  return {users: []};
}

function nowIso(): string {
  return new Date().toISOString();
}

function ymd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 10);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

class AdminUsersService {
  async list(): Promise<AdminUserRow[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {users} = safeParse(raw);
    return [...users].sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
  }

  async upsertFromAuthUser(user: Usuario | null | undefined): Promise<void> {
    if (!user?.id || !user.email) {
      return;
    }
    const createdAt =
      (typeof user.createdAt === 'string' ? user.createdAt : null) ||
      (user.createdAt instanceof Date ? user.createdAt.toISOString() : null) ||
      (typeof user.fechaRegistro === 'string' ? user.fechaRegistro : null) ||
      (user.fechaRegistro instanceof Date ? user.fechaRegistro.toISOString() : null) ||
      nowIso();

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {users} = safeParse(raw);
    const next: AdminUserRow = {
      id: String(user.id),
      email: String(user.email).trim().toLowerCase(),
      tipoPerfil: user.tipoPerfil,
      createdAtIso: createdAt,
    };
    const idx = users.findIndex((u) => u.id === next.id || u.email === next.email);
    const out = [...users];
    if (idx >= 0) {
      out[idx] = {...out[idx], ...next};
    } else {
      out.unshift(next);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({users: out.slice(0, 500)}));
  }

  async seedIfEmpty(seed: AdminUserRow[]): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {users} = safeParse(raw);
    if (users.length > 0) {
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({users: seed}));
  }

  async deleteUserHard(row: AdminUserRow): Promise<void> {
    // 1) Remover del registro de usuarios
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {users} = safeParse(raw);
    const nextUsers = users.filter((u) => u.id !== row.id && u.email !== row.email);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({users: nextUsers}));

    // 2) Best-effort: borrar tickets de soporte del usuario
    try {
      const tickets = await supportService.listTickets();
      const mine = tickets.filter((t) => t.fromUserId === row.id || t.fromEmail === row.email);
      for (const t of mine) {
        await supportService.deleteTicket(t.id);
      }
    } catch {
      // ignore
    }

    // 3) Best-effort: borrar eventos publicados por ese organizador (local storage)
    try {
      const res = await eventoService.getEventos();
      if (res.success && res.eventos) {
        const mine = res.eventos.filter((e) => String(e.organizadorId || '') === row.id);
        for (const ev of mine) {
          if (ev.id) {
            await eventoService.eliminarEvento(ev.id);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  async countsByDay(days: number): Promise<Array<{day: string; count: number}>> {
    const list = await this.list();
    const map = new Map<string, number>();
    for (const u of list) {
      const d = ymd(u.createdAtIso);
      map.set(d, (map.get(d) || 0) + 1);
    }
    const out: Array<{day: string; count: number}> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = ymd(d.toISOString());
      out.push({day: key, count: map.get(key) || 0});
    }
    return out;
  }
}

export default new AdminUsersService();

