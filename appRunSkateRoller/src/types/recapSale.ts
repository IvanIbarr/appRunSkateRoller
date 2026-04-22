import type {RecapPlanId} from './recapCheckout';

export interface RecapSale {
  id: string;
  createdAt: string; // ISO
  planId: RecapPlanId;
  planTitle: string;
  amountMx: number;
  buyerEmail?: string | null;
}

