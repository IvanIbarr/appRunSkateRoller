import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';

interface ImageUploaderProps {
  label: string;
  imageUri?: string | null;
  onImageSelected: (uri: string | null) => void;
  style?: any;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  imageUri,
  onImageSelected,
  style,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = document.createElement('img');
        img.onload = () => {
          // Crear canvas para comprimir
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es muy grande (máximo 800px)
          const MAX_SIZE = 800;
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

          // Dibujar imagen redimensionada
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto del canvas'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con calidad reducida (0.7 = 70% calidad)
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
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

  const handleSelectImage = () => {
    if (Platform.OS === 'web') {
      // Crear input file si no existe
      if (!fileInputRef.current) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            // Validar tamaño (máximo 5MB antes de comprimir)
            if (file.size > 5 * 1024 * 1024) {
              Alert.alert('Error', 'La imagen no puede exceder 5MB');
              return;
            }
            
            try {
              // Comprimir imagen antes de guardar
              const compressedImage = await compressImage(file);
              onImageSelected(compressedImage);
            } catch (error) {
              console.error('Error al comprimir imagen:', error);
              Alert.alert('Error', 'No se pudo procesar la imagen');
            }
          }
        };
        document.body.appendChild(input);
        fileInputRef.current = input as any;
      }
      
      // Abrir selector de archivo
      if (fileInputRef.current) {
        (fileInputRef.current as HTMLInputElement).click();
      }
    } else {
      // Para móvil, por ahora solo mostrar mensaje
      Alert.alert('Info', 'Funcionalidad de selección de imágenes en desarrollo');
    }
  };

  const handleRemoveImage = () => {
    onImageSelected(null);
    if (Platform.OS === 'web' && fileInputRef.current) {
      (fileInputRef.current as HTMLInputElement).value = '';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.uploadContainer}
        onPress={handleSelectImage}
        activeOpacity={0.7}>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{uri: imageUri}} 
              style={styles.image} 
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                activeOpacity={0.8}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Subir imagen</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  uploadContainer: {
    width: '100%',
    aspectRatio: 1, // Hacer cuadrado
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
});

