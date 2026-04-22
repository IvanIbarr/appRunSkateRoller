/** URLs de galería de una publicación de marketing (compat. con solo `photoUri`). */
export function getMarketingSaleGalleryUris(item: {
  photoUri?: string | null;
  photoUris?: string[] | null;
}): string[] {
  if (Array.isArray(item.photoUris) && item.photoUris.length > 0) {
    return item.photoUris.filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    );
  }
  if (item.photoUri && typeof item.photoUri === 'string') {
    return [item.photoUri];
  }
  return [];
}
