const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const eventosDir = path.join(__dirname, '..', '..', 'uploads', 'eventos');
fs.mkdirSync(eventosDir, {recursive: true});

/**
 * Convierte data URL (base64) a archivo en /uploads/eventos y devuelve ruta pública.
 * Si ya es http(s) o ruta /uploads, se devuelve tal cual.
 */
async function persistEventoImageField(value, fieldPrefix) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/uploads/')) return trimmed;
  if (!trimmed.startsWith('data:image/')) return trimmed;

  const match = trimmed.match(/^data:image\/([\w+.-]+);base64,(.+)$/i);
  if (!match) {
    throw new Error('Formato de imagen no válido');
  }

  const subtype = match[1].toLowerCase();
  const ext =
    subtype.includes('png') ? '.png' : subtype.includes('webp') ? '.webp' : '.jpg';
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede exceder 5 MB');
  }

  const filename = `${fieldPrefix}-${crypto.randomUUID()}${ext}`;
  await fs.promises.writeFile(path.join(eventosDir, filename), buffer);
  return `/uploads/eventos/${filename}`;
}

async function prepareEventoImages(body) {
  const out = {...(body || {})};
  if (out.logoGrupo != null) {
    out.logoGrupo = await persistEventoImageField(out.logoGrupo, 'logo');
  }
  if (out.lugarDestino != null) {
    out.lugarDestino = await persistEventoImageField(out.lugarDestino, 'destino');
  }
  return out;
}

module.exports = {
  persistEventoImageField,
  prepareEventoImages,
};
