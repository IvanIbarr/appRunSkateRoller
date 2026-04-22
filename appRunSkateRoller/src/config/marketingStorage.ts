/** Clave única del listado de ventas de marketing (catálogo compartido local). */
export const MARKETING_SALES_KEY = '@marketing:sales';

/**
 * Web: permite refrescar Marketing en la misma pestaña justo después de publicar.
 * (El evento `storage` del navegador no se dispara en la pestaña que escribe.)
 */
export const MARKETING_SALES_UPDATED_EVENT = 'roller-marketing-sales-updated';

export function notifyMarketingSalesUpdated(): void {
  if (
    typeof window !== 'undefined' &&
    typeof window.dispatchEvent === 'function'
  ) {
    window.dispatchEvent(new Event(MARKETING_SALES_UPDATED_EVENT));
  }
}
