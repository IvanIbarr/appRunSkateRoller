const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const marketingDir = path.join(__dirname, '..', '..', 'uploads', 'marketing', 'photos');
fs.mkdirSync(marketingDir, {recursive: true});

async function persistMarketingPhoto(value) {
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
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('La imagen no puede exceder 10 MB');
  }

  const filename = `sale-${crypto.randomUUID()}${ext}`;
  await fs.promises.writeFile(path.join(marketingDir, filename), buffer);
  return `/uploads/marketing/photos/${filename}`;
}

async function prepareMarketingPhotos(body) {
  const out = {...(body || {})};
  if (out.photoUri != null) {
    out.photoUri = await persistMarketingPhoto(out.photoUri);
  }
  if (Array.isArray(out.photoUris)) {
    const persisted = [];
    for (const uri of out.photoUris) {
      const p = await persistMarketingPhoto(uri);
      if (p) persisted.push(p);
    }
    out.photoUris = persisted;
    if (persisted.length > 0 && !out.photoUri) {
      out.photoUri = persisted[0];
    }
  }
  return out;
}

module.exports = {persistMarketingPhoto, prepareMarketingPhotos};
