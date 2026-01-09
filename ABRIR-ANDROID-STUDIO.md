# 📱 Abrir Proyecto en Android Studio

## Pasos para Abrir el Proyecto

### Opción 1: Desde Android Studio (Recomendado)

1. **Abre Android Studio**

2. **Selecciona "Open" o "Abrir"**

3. **Navega a la carpeta del proyecto:**
   ```
   D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT\android
   ```
   ⚠️ **IMPORTANTE:** Selecciona la carpeta `android`, NO la carpeta raíz del proyecto.

4. **Espera a que Gradle sincronice:**
   - Android Studio detectará automáticamente que es un proyecto React Native
   - Gradle descargará dependencias si es necesario
   - Esto puede tomar varios minutos la primera vez

5. **Verifica la configuración:**
   - Asegúrate de que el SDK de Android esté configurado correctamente
   - Verifica que el dispositivo/emulador esté conectado o configurado

### Opción 2: Desde la Terminal

1. **Navega a la carpeta android:**
   ```powershell
   cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT\android"
   ```

2. **Abre con Android Studio:**
   ```powershell
   # Si Android Studio está en el PATH
   studio .
   
   # O si está instalado en la ubicación por defecto:
   & "C:\Program Files\Android\Android Studio\bin\studio64.exe" .
   ```

3. **O simplemente:**
   ```powershell
   start .
   ```
   Y luego selecciona "Abrir con Android Studio"

## Verificación de la Configuración

### ✅ Permisos Configurados

Los siguientes permisos ya están agregados en `AndroidManifest.xml`:
- ✅ Cámara
- ✅ Almacenamiento (lectura y escritura)
- ✅ Medios (imágenes y videos para Android 13+)

### ✅ Dependencias Configuradas

Las siguientes dependencias ya están instaladas:
- ✅ `react-native-image-picker`
- ✅ `react-native-video`
- ✅ ExoPlayer (para reproducción de videos)

## Primer Build en Android Studio

1. **Sincronizar Gradle:**
   - Click en "Sync Project with Gradle Files" (ícono de elefante con flecha)
   - O: File > Sync Project with Gradle Files

2. **Verificar que no haya errores:**
   - Revisa el panel "Build" en la parte inferior
   - Debería mostrar "BUILD SUCCESSFUL"

3. **Ejecutar la aplicación:**
   - Conecta un dispositivo Android o inicia un emulador
   - Click en el botón "Run" (▶️) o presiona `Shift + F10`

## Estructura del Proyecto en Android Studio

Cuando abras el proyecto, verás:

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml  ← Permisos configurados aquí
│   │   │   ├── java/com/siigroller/
│   │   │   └── res/
│   │   └── debug/
│   ├── build.gradle  ← Dependencias configuradas aquí
│   └── ...
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## Solución de Problemas

### Error: "SDK location not found"
- Verifica que `local.properties` exista y tenga la ruta correcta del SDK
- Debería contener: `sdk.dir=C:\\Users\\sacx2\\AppData\\Local\\Android\\Sdk`

### Error: "Failed to sync Gradle"
- Asegúrate de tener conexión a internet
- Verifica que el archivo `build.gradle` no tenga errores
- Intenta: File > Invalidate Caches / Restart

### Error: "Module not found"
- Ejecuta desde la raíz del proyecto:
  ```bash
  npm install
  cd android
  ./gradlew clean
  ```

### Error: "Permission denied" en gradlew
- En Windows PowerShell:
  ```powershell
  cd android
  .\gradlew clean
  ```

## Comandos Útiles desde Android Studio

- **Build:** Build > Make Project (`Ctrl+F9`)
- **Run:** Run > Run 'app' (`Shift+F10`)
- **Sync Gradle:** File > Sync Project with Gradle Files
- **Clean:** Build > Clean Project
- **Rebuild:** Build > Rebuild Project

## Verificar Permisos en AndroidManifest.xml

Para verificar que los permisos están correctamente configurados:

1. Abre `app/src/main/AndroidManifest.xml`
2. Verifica que veas estos permisos al inicio del archivo:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
   <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
   ```

## Notas Importantes

- ⚠️ Asegúrate de abrir la carpeta `android`, no la raíz del proyecto React Native
- ⚠️ La primera sincronización puede tardar varios minutos
- ✅ El proyecto está configurado para usar Android SDK 34
- ✅ Los permisos ya están agregados y listos para usar

## Próximos Pasos

Una vez que el proyecto esté abierto en Android Studio:

1. ✅ Verifica que no haya errores de compilación
2. ✅ Conecta un dispositivo o inicia un emulador
3. ✅ Ejecuta la aplicación
4. ✅ Prueba la funcionalidad de adjuntar imágenes/videos en el chat

¡Listo para desarrollar! 🚀
