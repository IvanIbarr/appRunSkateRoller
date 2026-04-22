import type {FormaPagoCompra} from './marketingCheckout';

export type RecapPlanId = 'gratis0' | 'pase25' | 'plus59' | 'plus479';

/** Borrador que viaja entre pasos del checkout demo de Recap */
export type RecapCheckoutDraft = {
  planId: RecapPlanId;
  planTitle: string;
  amountMx: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  formaPago?: FormaPagoCompra;
};

export const RECAP_PLAN_OPTIONS: {
  id: RecapPlanId;
  title: string;
  subtitle: string;
  amountMx: number;
}[] = [
  {
    id: 'gratis0',
    title: 'Plan Gratis · Crea y Comparte',
    subtitle: 'Prueba Recap y comparte tus rutas (con marca de agua)',
    amountMx: 0,
  },
  {
    id: 'pase25',
    title: 'Pase único',
    subtitle: 'Un recap premium puntual, sin suscripción',
    amountMx: 25,
  },
  {
    id: 'plus59',
    title: 'Plus mensual',
    subtitle: 'Prioridad, sin anuncio de cola, nube',
    amountMx: 59,
  },
  {
    id: 'plus479',
    title: 'Plus anual',
    subtitle: 'Ahorro vs 12 meses; ideal para temporada',
    amountMx: 479,
  },
];
