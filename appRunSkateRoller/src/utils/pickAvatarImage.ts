import {Platform, Alert} from 'react-native';
import {launchImageLibrary, launchCamera, type Asset, type ImagePickerResponse} from 'react-native-image-picker';
import {normalizeAvatarForProfile} from './avatarImageNormalize';

/** Tras normalizar, el JPEG final es pequeño; este límite es solo previo al recorte en web. */
const MAX_RAW_DATA_URI_CHARS = 12_000_000;

function webAlert(title: string, message?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * includeBase64: evita fetch(file://) en iOS (a menudo falla o cuelga el JS thread).
 * Tamaño moderado para no saturar memoria ni el body JSON.
 */
const nativePickerOptions = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8 as 0.8,
  selectionLimit: 1,
  ...Platform.select({
    ios: {
      assetRepresentationMode: 'compatible' as const,
    },
    default: {},
  }),
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const g = globalThis as typeof globalThis & {btoa?: (s: string) => string};
  if (typeof g.btoa === 'function') {
    return g.btoa(binary);
  }
  throw new Error('btoa no disponible');
}

async function assetToDataUri(asset: Asset): Promise<string | null> {
  let raw: string | null = null;

  if (asset.base64) {
    const mime = asset.type || 'image/jpeg';
    raw = `data:${mime};base64,${asset.base64}`;
  } else {
    const fileUri = asset.uri;
    if (!fileUri) {
      return null;
    }
    try {
      const res = await fetch(fileUri);
      if (!res.ok) {
        throw new Error(`fetch ${res.status}`);
      }
      const buf = await res.arrayBuffer();
      const mime = asset.type || 'image/jpeg';
      const b64 = arrayBufferToBase64(buf);
      raw = `data:${mime};base64,${b64}`;
    } catch (e) {
      console.warn('pickAvatarImage: no se pudo leer la imagen desde URI', e);
      webAlert(
        'No se pudo leer la foto',
        'Vuelve a intentar o elige otra imagen.',
      );
      return null;
    }
  }

  if (!raw || raw.length > MAX_RAW_DATA_URI_CHARS) {
    webAlert(
      'Imagen muy grande',
      'Elige una foto más pequeña.',
    );
    return null;
  }

  const normalized = await normalizeAvatarForProfile(raw);
  return normalized ?? raw;
}

async function responseToDataUri(result: ImagePickerResponse): Promise<string | null> {
  if (result.didCancel || result.errorCode) {
    if (result.errorMessage) {
      console.warn('ImagePicker:', result.errorCode, result.errorMessage);
    }
    return null;
  }
  const asset = result.assets?.[0];
  if (!asset) {
    return null;
  }
  return assetToDataUri(asset);
}

export async function pickAvatarImageFromLibrary(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickAvatarImageWeb();
  }
  const result = await launchImageLibrary(nativePickerOptions);
  return responseToDataUri(result);
}

export async function pickAvatarImageFromCamera(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  const {selectionLimit: _s, ...cameraOpts} = nativePickerOptions;
  void _s;
  const result = await launchCamera(cameraOpts);
  return responseToDataUri(result);
}

function pickAvatarImageWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif';
    input.setAttribute('aria-hidden', 'true');
    input.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    const cleanup = () => {
      try {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      } catch {
        /* ignore */
      }
    };
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        resolve(null);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        webAlert('Archivo muy grande', 'Usa una imagen de menos de 8 MB.');
        cleanup();
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result;
        cleanup();
        if (typeof r !== 'string') {
          resolve(null);
          return;
        }
        if (r.length > MAX_RAW_DATA_URI_CHARS) {
          webAlert('Imagen muy grande', 'Elige otra imagen más pequeña.');
          resolve(null);
          return;
        }
        resolve(r);
      };
      reader.onerror = () => {
        cleanup();
        webAlert('No se pudo leer el archivo', 'Intenta con otra imagen.');
        resolve(null);
      };
      reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
  });
}
