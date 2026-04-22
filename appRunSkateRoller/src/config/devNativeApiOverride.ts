/**
 * Móvil en DEV: el front no usa el proxy de Webpack; debe apuntar al backend.
 *
 * - `null` → usa `LOCAL_IP` en `api.ts` (misma red Wi‑Fi que el PC).
 * - Puedes poner `http://TU_IP:3001/api` o la URL de un túnel al **puerto 3001** (API), no al front.
 *
 * @example
 * export const NATIVE_DEV_API_BASE_OVERRIDE: string | null = 'https://api-mi-tunel.trycloudflare.com/api';
 */
export const NATIVE_DEV_API_BASE_OVERRIDE: string | null = null;
