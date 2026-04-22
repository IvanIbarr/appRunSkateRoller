import AsyncStorage from '@react-native-async-storage/async-storage';
import type {RecapSale} from '../types/recapSale';
import type {RecapCheckoutDraft} from '../types/recapCheckout';

const STORAGE_KEY = '@recap:sales:v1';

type Stored = {sales: RecapSale[]};

function safeParse(raw: string | null): Stored {
  if (!raw) {
    return {sales: []};
  }
  try {
    const obj = JSON.parse(raw) as Partial<Stored>;
    if (obj && Array.isArray(obj.sales)) {
      return {sales: obj.sales as RecapSale[]};
    }
  } catch {
    // ignore
  }
  return {sales: []};
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

class RecapSalesService {
  async list(): Promise<RecapSale[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {sales} = safeParse(raw);
    return [...sales].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async addFromDraft(draft: RecapCheckoutDraft): Promise<RecapSale> {
    const sale: RecapSale = {
      id: makeId(),
      createdAt: nowIso(),
      planId: draft.planId,
      planTitle: draft.planTitle,
      amountMx: draft.amountMx,
      buyerEmail: draft.buyerEmail ?? null,
    };
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {sales} = safeParse(raw);
    const next = {sales: [sale, ...sales].slice(0, 500)};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return sale;
  }

  async totalsByPlan(): Promise<Record<string, {count: number; revenueMx: number}>> {
    const list = await this.list();
    const out: Record<string, {count: number; revenueMx: number}> = {};
    for (const s of list) {
      const key = s.planId;
      if (!out[key]) {
        out[key] = {count: 0, revenueMx: 0};
      }
      out[key].count += 1;
      out[key].revenueMx += Number(s.amountMx) || 0;
    }
    return out;
  }

  async countsByDay(days: number): Promise<Array<{day: string; count: number; revenueMx: number}>> {
    const list = await this.list();
    const map = new Map<string, {count: number; revenueMx: number}>();
    for (const s of list) {
      const d = ymd(s.createdAt);
      const cur = map.get(d) || {count: 0, revenueMx: 0};
      cur.count += 1;
      cur.revenueMx += Number(s.amountMx) || 0;
      map.set(d, cur);
    }
    const out: Array<{day: string; count: number; revenueMx: number}> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = ymd(d.toISOString());
      const v = map.get(key) || {count: 0, revenueMx: 0};
      out.push({day: key, count: v.count, revenueMx: v.revenueMx});
    }
    return out;
  }
}

export default new RecapSalesService();

