# ✅ Configuración de Permisos Completada

## Estado de la Configuración

### ✅ Android - COMPLETADO

Los permisos han sido agregados automáticamente en:
- `android/app/src/main/AndroidManifest.xml`

**Permisos agregados:**
- ✅ `CAMERA` - Para tomar fotos y videos
- ✅ `READ_EXTERNAL_STORAGE` - Para leer archivos (Android 12 y anteriores)
- ✅ `WRITE_EXTERNAL_STORAGE` - Para escribir archivos (Android 10 y anteriores)
- ✅ `READ_MEDIA_IMAGES` - Para leer imágenes (Android 13+)
- ✅ `READ_MEDIA_VIDEO` - Para leer videos (Android 13+)

**Dependencias agregadas:**
- ✅ ExoPlayer para react-native-video en `android/app/build.gradle`

### ⚠️ iOS - PENDIENTE (cuando se genere el proyecto)

El proyecto iOS aún no está generado. Cuando lo generes:

1. **Generar proyecto iOS** (si aún no existe):
   ```bash
   npx pod-install
   # o
   cd ios && pod install
   ```

2. **Agregar permisos en Info.plist:**
   - Ubicación: `ios/[NombreApp]/Info.plist`
   - Usa el template: `Info.plist.template` como referencia
   - Agrega las siguientes claves:
     - `NSCameraUsageDescription`
     - `NSPhotoLibraryUsageDescription`
     - `NSPhotoLibraryAddUsageDescription`
     - `NSMicrophoneUsageDescription`

## Archivos Modificados

### Android
1. ✅ `android/app/src/main/AndroidManifest.xml` - Permisos agregados
2. ✅ `android/app/build.gradle` - Dependencia ExoPlayer agregada

### iOS
1. ✅ `Info.plist.template` - Template creado para referencia futura

## Próximos Pasos

### Para Android:
1. Rebuild la aplicación:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

2. Los permisos se solicitarán automáticamente la primera vez que:
   - Intentes tomar una foto
   - Intentes seleccionar una imagen de la galería
   - Intentes seleccionar un video

### Para iOS (cuando se genere):
1. Generar el proyecto iOS
2. Agregar permisos usando `Info.plist.template`
3. Ejecutar:
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

## Verificación

Para verificar que los permisos están configurados correctamente:

### Android:
- Revisa `android/app/src/main/AndroidManifest.xml`
- Deberías ver los permisos listados al inicio del archivo

### iOS:
- Cuando se genere, revisa `ios/[NombreApp]/Info.plist`
- Deberías ver las claves `NSCameraUsageDescription`, etc.

## Notas Importantes

1. **Android 13+**: Los permisos `READ_MEDIA_IMAGES` y `READ_MEDIA_VIDEO` son necesarios. Los permisos antiguos (`READ_EXTERNAL_STORAGE`) tienen `maxSdkVersion` para evitar conflictos.

2. **Solicitud de Permisos en Tiempo de Ejecución**: 
   - Android 6.0+ solicita permisos en tiempo de ejecución
   - `react-native-image-picker` maneja esto automáticamente
   - No necesitas código adicional

3. **iOS**: 
   - Los permisos se solicitan automáticamente cuando se intenta acceder
   - Los mensajes de descripción son importantes para que el usuario entienda por qué se necesita el permiso

4. **Testing**:
   - La primera vez que uses una función que requiere permiso, el sistema mostrará un diálogo
   - Si el usuario deniega, deberá ir a Configuración > [App] > Permisos para habilitarlo

## Solución de Problemas

Si los permisos no funcionan:

1. **Android:**
   - Verifica que el archivo `AndroidManifest.xml` tenga los permisos
   - Limpia y rebuild: `./gradlew clean && npm run android`
   - Verifica permisos en Configuración del dispositivo

2. **iOS (cuando esté disponible):**
   - Verifica que `Info.plist` tenga las claves correctas
   - Ejecuta `pod install` nuevamente
   - Limpia el build: `cd ios && xcodebuild clean`
