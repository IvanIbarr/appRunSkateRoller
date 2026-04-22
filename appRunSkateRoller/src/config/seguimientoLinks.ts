import {Platform} from 'react-native';

/**
 * URL base pública de la app web en producción (sin barra final).
 * Ejemplo: https://app.tudominio.com
 *
 * Si la rellenas, los enlaces compartidos (WhatsApp, etc.) usarán HTTPS
 * y podrás configurar App Links (Android) / Universal Links (iOS) para
 * abrir la app instalada. Si queda vacío, en nativo se usa el esquema
 * runskateroller:// (abre la app directamente cuando el SO lo permite).
 */
export const PUBLIC_WEB_APP_BASE = '';

const SCHEME = 'runskateroller';

/** Enlace profundo nativo: runskateroller://seguimiento/<uuid> */
export function buildSeguimientoDeepLink(seguimientoId: string): string {
  return `${SCHEME}://seguimiento/${encodeURIComponent(seguimientoId)}`;
}

/** URL HTTPS con ?seguimiento= (misma forma que la web). */
export function buildSeguimientoWebUrl(seguimientoId: string, originOverride?: string): string {
  const id = encodeURIComponent(seguimientoId);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !originOverride) {
    return `${window.location.origin}/?seguimiento=${id}`;
  }
  const base = (originOverride ?? PUBLIC_WEB_APP_BASE).replace(/\/$/, '');
  if (!base) {
    return buildSeguimientoDeepLink(seguimientoId);
  }
  return `${base}/?seguimiento=${id}`;
}

/**
 * Texto a compartir: prioriza HTTPS si hay PUBLIC_WEB_APP_BASE; si no, esquema nativo.
 */
export function buildSeguimientoShareUrl(seguimientoId: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return buildSeguimientoWebUrl(seguimientoId);
  }
  const base = PUBLIC_WEB_APP_BASE.replace(/\/$/, '');
  if (base.length > 0) {
    return `${base}/?seguimiento=${encodeURIComponent(seguimientoId)}`;
  }
  return buildSeguimientoDeepLink(seguimientoId);
}
