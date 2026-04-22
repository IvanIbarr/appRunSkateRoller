/** Normalización de avatar solo en navegador (Canvas). */

export const AVATAR_OUTPUT_SIZE = 512;
const JPEG_QUALITY = 0.88;

/**
 * Recorte cuadrado + escala a tamaño fijo.
 * zoom ≥ 1 acerca (recorte más pequeño desde el área central).
 * panX/panY en [-1, 1] mueven el centro del recorte.
 */
export function normalizeAvatarWebCanvas(
  dataUri: string,
  options?: {zoom?: number; panX?: number; panY?: number},
): Promise<string | null> {
  if (typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  const zoom = Math.max(1, Math.min(4, options?.zoom ?? 1));
  const panX = Math.max(-1, Math.min(1, options?.panX ?? 0));
  const panY = Math.max(-1, Math.min(1, options?.panY ?? 0));

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          resolve(null);
          return;
        }
        const minSide = Math.min(w, h);
        let side = minSide / zoom;
        side = Math.min(side, minSide);
        side = Math.max(side, 32);
        let cx = w / 2 + panX * Math.max(0, (w - side) / 2) * 0.85;
        let cy = h / 2 + panY * Math.max(0, (h - side) / 2) * 0.85;
        cx = Math.max(side / 2, Math.min(w - side / 2, cx));
        cy = Math.max(side / 2, Math.min(h - side / 2, cy));
        const sx = cx - side / 2;
        const sy = cy - side / 2;

        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_OUTPUT_SIZE;
        canvas.height = AVATAR_OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUri;
  });
}

export async function normalizeAvatarForProfile(dataUri: string): Promise<string | null> {
  if (!dataUri || !dataUri.startsWith('data:image/')) {
    return null;
  }
  return normalizeAvatarWebCanvas(dataUri, {zoom: 1, panX: 0, panY: 0});
}
