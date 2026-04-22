import AsyncStorage from '@react-native-async-storage/async-storage';
import type {RecapPlanId} from '../types/recapCheckout';

export type SubscriptionStatus = 'active' | 'cancelled';

export type UserSubscription = {
  userId: string;
  email: string;
  planId: RecapPlanId;
  planTitle: string;
  amountMx: number;
  status: SubscriptionStatus;
  autoRenew: boolean;
  startedAt: string; // ISO
  updatedAt: string; // ISO
};

const STORAGE_KEY = '@subs:recap:v1';

type Stored = {subs: Record<string, UserSubscription>};

function safeParse(raw: string | null): Stored {
  if (!raw) {
    return {subs: {}};
  }
  try {
    const obj = JSON.parse(raw) as Partial<Stored>;
    if (obj && obj.subs && typeof obj.subs === 'object') {
      return {subs: obj.subs as Record<string, UserSubscription>};
    }
  } catch {
    // ignore
  }
  return {subs: {}};
}

function nowIso(): string {
  return new Date().toISOString();
}

function keyFor(userId: string, email: string): string {
  return userId || email.toLowerCase();
}

function autoRenewFor(planId: RecapPlanId): boolean {
  return planId === 'plus59' || planId === 'plus479';
}

class SubscriptionsService {
  async get(userId: string, email: string): Promise<UserSubscription | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const {subs} = safeParse(raw);
    const k = keyFor(userId, email);
    return subs[k] || null;
  }

  async setActive(userId: string, email: string, plan: {planId: RecapPlanId; planTitle: string; amountMx: number}): Promise<UserSubscription> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored = safeParse(raw);
    const k = keyFor(userId, email);
    const prev = stored.subs[k];
    const startedAt = prev?.startedAt || nowIso();
    const sub: UserSubscription = {
      userId,
      email: email.toLowerCase(),
      planId: plan.planId,
      planTitle: plan.planTitle,
      amountMx: plan.amountMx,
      status: 'active',
      autoRenew: autoRenewFor(plan.planId),
      startedAt,
      updatedAt: nowIso(),
    };
    stored.subs[k] = sub;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return sub;
  }

  async cancel(userId: string, email: string): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored = safeParse(raw);
    const k = keyFor(userId, email);
    const prev = stored.subs[k];
    if (!prev) {
      return;
    }
    stored.subs[k] = {...prev, status: 'cancelled', autoRenew: false, updatedAt: nowIso()};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
}

export default new SubscriptionsService();

