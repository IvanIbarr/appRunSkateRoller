# Configuración de Adjuntos de Imágenes y Videos para Android e iOS

Este documento explica cómo configurar los permisos necesarios para que la funcionalidad de adjuntar imágenes y videos funcione correctamente en Android e iOS.

## Dependencias Instaladas

Las siguientes dependencias ya están instaladas:
- `react-native-image-picker` - Para seleccionar imágenes y videos
- `react-native-video` - Para reproducir videos en móvil

## Configuración para Android

### 1. Permisos en AndroidManifest.xml

Abre el archivo `android/app/src/main/AndroidManifest.xml` y agrega los siguientes permisos dentro de la etiqueta `<manifest>`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permisos para cámara y almacenamiento -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    
    <!-- Para Android 13+ (API 33+) -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    
    <!-- ... resto del manifest ... -->
</manifest>
```

### 2. Configurar react-native-image-picker

En el archivo `android/app/build.gradle`, verifica que el `targetSdkVersion` sea compatible:

```gradle
android {
    compileSdkVersion 33  // o superior
    
    defaultConfig {
        targetSdkVersion 33  // o superior
        // ... otras configuraciones
    }
}
```

### 3. Configurar react-native-video (opcional)

Si necesitas reproducir videos, asegúrate de tener las siguientes configuraciones en `android/app/build.gradle`:

```gradle
dependencies {
    // ... otras dependencias
    implementation 'com.google.android.exoplayer:exoplayer:2.18.7'
}
```

## Configuración para iOS

**Nota:** Si el proyecto iOS aún no está generado, puedes usar el template `Info.plist.template` como referencia.

### 1. Permisos en Info.plist

Una vez que el proyecto iOS esté generado, abre el archivo `ios/[NombreApp]/Info.plist` y agrega las siguientes claves dentro de la etiqueta `<dict>`:

```xml
<dict>
    <!-- ... otras configuraciones ... -->
    
    <!-- Permisos para cámara y galería -->
    <key>NSCameraUsageDescription</key>
    <string>Necesitamos acceso a la cámara para tomar fotos y videos para compartir en el chat</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Necesitamos acceso a tu galería para seleccionar imágenes y videos para compartir</string>
    
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>Necesitamos permiso para guardar imágenes en tu galería</string>
    
    <key>NSMicrophoneUsageDescription</key>
    <string>Necesitamos acceso al micrófono para grabar videos con audio</string>
    
    <!-- ... resto del plist ... -->
</dict>
```

**Template disponible:** Hay un archivo `Info.plist.template` en la raíz del proyecto que puedes usar como referencia cuando generes el proyecto iOS.

### 2. Configurar react-native-video en iOS

Abre `ios/Podfile` y asegúrate de tener la siguiente configuración:

```ruby
platform :ios, '11.0'  # o superior

target 'TuApp' do
  # ... otras configuraciones
  
  # Para react-native-video
  pod 'react-native-video', :path => '../node_modules/react-native-video'
end
```

Luego ejecuta:
```bash
cd ios
pod install
cd ..
```

## Instrucciones de Instalación

### Para Android:

1. **Sincronizar Gradle:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Rebuild la app:**
   ```bash
   npm run android
   ```

### Para iOS:

1. **Instalar pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Rebuild la app:**
   ```bash
   npm run ios
   ```

## Funcionalidades Implementadas

### ✅ Selección de Archivos:
- **Web**: Input file estándar del navegador
- **Android**: Diálogo nativo con opciones (Tomar foto, Elegir imagen, Elegir video)
- **iOS**: ActionSheet con opciones (Tomar foto, Elegir imagen, Elegir video)

### ✅ Reproducción de Videos:
- **Web**: Elemento HTML5 `<video>` nativo
- **Android/iOS**: Componente `react-native-video` con controles nativos

### ✅ Validaciones:
- Tamaño máximo: 10MB (configurable)
- Duración máxima de video: 60 segundos (configurable)
- Compresión automática de imágenes (máximo 1200px)

## Solución de Problemas

### Error: "react-native-image-picker no está disponible"
- Verifica que la dependencia esté instalada: `npm list react-native-image-picker`
- Si no está, reinstala: `npm install react-native-image-picker --legacy-peer-deps`

### Error: "Permisos denegados"
- Verifica que los permisos estén agregados en AndroidManifest.xml (Android) o Info.plist (iOS)
- En Android, verifica permisos en tiempo de ejecución (API 23+)
- En iOS, asegúrate de que los mensajes de descripción sean claros

### Error: "Video no se reproduce"
- Verifica que `react-native-video` esté instalado
- Para iOS, ejecuta `pod install` nuevamente
- Para Android, verifica que ExoPlayer esté configurado

### Error: "Imagen no se muestra"
- Verifica que la URI sea válida
- Para archivos base64, verifica que el formato sea correcto (`data:image/jpeg;base64,...`)

## Notas Importantes

1. **Base64 vs URI**: 
   - En **web**, los archivos se envían como base64
   - En **móvil**, se envían como URIs (file:// o content://)
   - El backend debe manejar ambos formatos

2. **Permisos en Tiempo de Ejecución (Android)**:
   - Para Android 6.0+, algunos permisos se solicitan en tiempo de ejecución
   - `react-native-image-picker` maneja esto automáticamente

3. **Permisos en iOS**:
   - Los permisos se solicitan automáticamente la primera vez que se intenta acceder
   - Si el usuario deniega, debe ir a Configuración > [App] > Permisos para habilitarlos

4. **Rendimiento**:
   - Las imágenes grandes pueden afectar el rendimiento
   - Se recomienda comprimir imágenes antes de enviarlas (ya implementado)
