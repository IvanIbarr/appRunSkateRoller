/** En iOS/Android el recorte se hace con react-native-image-resizer tras elegir foto. */
export interface AvatarCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (jpegDataUri: string) => void;
  previewShape?: 'circle' | 'square';
  title?: string;
  hint?: string;
  confirmLabel?: string;
}

export default function AvatarCropModal(_props: AvatarCropModalProps): null {
  return null;
}
