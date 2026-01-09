import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';

// Importaciones condicionales para móvil
let ImagePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    ImagePicker = require('react-native-image-picker');
  } catch (e) {
    console.warn('react-native-image-picker no está disponible');
  }
}

export interface Attachment {
  uri: string;
  type: 'image' | 'video';
  name?: string;
}

interface AttachmentPickerProps {
  onAttachmentSelected: (attachment: Attachment | null) => void;
  maxSizeMB?: number;
  maxVideoDurationSeconds?: number;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  onAttachmentSelected,
  maxSizeMB = 10,
  maxVideoDurationSeconds = 60,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es muy grande (máximo 1200px para mantener calidad)
          const MAX_SIZE = 1200;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            } else {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto del canvas'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con calidad 0.8
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const processVideo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          video.onloadedmetadata = () => {
            // Verificar duración del video
            if (video.duration > maxVideoDurationSeconds) {
              reject(new Error(`El video no puede exceder ${maxVideoDurationSeconds} segundos`));
              return;
            }
            
            // Retornar como base64
            resolve(e.target.result as string);
          };
          
          video.onerror = () => reject(new Error('Error al procesar el video'));
          video.src = e.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleSelectFileMobile = () => {
    if (!ImagePicker) {
      Alert.alert('Error', 'El selector de archivos no está disponible');
      return;
    }

    const options: any = {
      title: 'Seleccionar archivo',
      cancelButtonTitle: 'Cancelar',
      takePhotoButtonTitle: 'Tomar foto',
      chooseFromLibraryButtonTitle: 'Elegir de la galería',
      chooseVideoButtonTitle: 'Elegir video',
      mediaType: 'mixed', // Permite tanto imágenes como videos
      quality: 0.8,
      videoQuality: 'medium',
      durationLimit: maxVideoDurationSeconds,
      maxWidth: 1200,
      maxHeight: 1200,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar foto', 'Elegir imagen', 'Elegir video'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Tomar foto
            ImagePicker.launchCamera(
              {...options, mediaType: 'photo'},
              handleImagePickerResponse,
            );
          } else if (buttonIndex === 2) {
            // Elegir imagen
            ImagePicker.launchImageLibrary(
              {...options, mediaType: 'photo'},
              handleImagePickerResponse,
            );
          } else if (buttonIndex === 3) {
            // Elegir video
            ImagePicker.launchImageLibrary(
              {...options, mediaType: 'video'},
              handleImagePickerResponse,
            );
          }
        },
      );
    } else {
      // Android: mostrar diálogo
      Alert.alert(
        'Seleccionar archivo',
        '¿Qué deseas adjuntar?',
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Tomar foto',
            onPress: () =>
              ImagePicker.launchCamera(
                {...options, mediaType: 'photo'},
                handleImagePickerResponse,
              ),
          },
          {
            text: 'Elegir imagen',
            onPress: () =>
              ImagePicker.launchImageLibrary(
                {...options, mediaType: 'photo'},
                handleImagePickerResponse,
              ),
          },
          {
            text: 'Elegir video',
            onPress: () =>
              ImagePicker.launchImageLibrary(
                {...options, mediaType: 'video'},
                handleImagePickerResponse,
              ),
          },
        ],
        {cancelable: true},
      );
    }
  };

  const handleImagePickerResponse = (response: any) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorMessage) {
      Alert.alert('Error', response.errorMessage);
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      
      // Validar tamaño
      if (asset.fileSize && asset.fileSize > maxSizeMB * 1024 * 1024) {
        Alert.alert('Error', `El archivo no puede exceder ${maxSizeMB}MB`);
        return;
      }

      // Determinar el tipo de archivo
      // react-native-image-picker puede retornar el tipo en diferentes propiedades
      const assetType = asset.type || asset.mediaType || '';
      const isVideo = 
        assetType.startsWith('video/') || 
        assetType === 'video' ||
        assetType === 'video/mp4' ||
        asset.fileName?.toLowerCase().endsWith('.mp4') ||
        asset.fileName?.toLowerCase().endsWith('.mov') ||
        asset.fileName?.toLowerCase().endsWith('.avi');

      // Validar duración del video
      if (isVideo && asset.duration) {
        if (asset.duration > maxVideoDurationSeconds) {
          Alert.alert(
            'Error',
            `El video no puede exceder ${maxVideoDurationSeconds} segundos`,
          );
          return;
        }
      }

      const fileUri = asset.uri || '';
      
      if (!fileUri) {
        Alert.alert('Error', 'No se pudo obtener la URI del archivo');
        return;
      }

      const attachment: Attachment = {
        uri: fileUri,
        type: isVideo ? 'video' : 'image',
        name: asset.fileName || asset.uri?.split('/').pop() || undefined,
      };

      onAttachmentSelected(attachment);
    }
  };

  const handleSelectFile = () => {
    if (Platform.OS === 'web') {
      // Código existente para web
      if (!fileInputRef.current) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.style.display = 'none';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            // Validar tamaño
            if (file.size > maxSizeMB * 1024 * 1024) {
              Alert.alert('Error', `El archivo no puede exceder ${maxSizeMB}MB`);
              return;
            }

            const fileType = file.type.startsWith('image/') ? 'image' : 'video';
            
            try {
              let dataUri: string;
              
              if (fileType === 'image') {
                dataUri = await compressImage(file);
              } else {
                dataUri = await processVideo(file);
              }

              onAttachmentSelected({
                uri: dataUri,
                type: fileType,
                name: file.name,
              });
            } catch (error) {
              console.error('Error al procesar archivo:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'No se pudo procesar el archivo',
              );
            }
          }
        };
        document.body.appendChild(input);
        fileInputRef.current = input as any;
      }

      if (fileInputRef.current) {
        (fileInputRef.current as HTMLInputElement).click();
      }
    } else {
      // Código para móvil (Android/iOS)
      handleSelectFileMobile();
    }
  };

  return (
    <TouchableOpacity
      style={styles.attachButton}
      onPress={handleSelectFile}
      activeOpacity={0.7}>
      <Text style={styles.attachButtonText}>📎</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 24,
  },
});
