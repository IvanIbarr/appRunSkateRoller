import ImageResizer from 'react-native-image-resizer';

export const AVATAR_OUTPUT_SIZE = 512;
const JPEG_QUALITY = 88;

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Normalización automática en iOS/Android: mismo tamaño cuadrado + JPEG. */
export async function normalizeAvatarForProfile(dataUri: string): Promise<string | null> {
  if (!dataUri || !dataUri.startsWith('data:image/')) {
    return null;
  }

  try {
    const res = await ImageResizer.createResizedImage(
      dataUri,
      AVATAR_OUTPUT_SIZE,
      AVATAR_OUTPUT_SIZE,
      'JPEG',
      JPEG_QUALITY,
      0,
      undefined,
      false,
      {mode: 'cover', onlyScaleDown: false},
    );
    const response = await fetch(res.uri);
    const blob = await response.blob();
    return await blobToDataUri(blob);
  } catch (e) {
    console.warn('normalizeAvatarForProfile:', e);
    return dataUri.length > 900_000 ? null : dataUri;
  }
}
