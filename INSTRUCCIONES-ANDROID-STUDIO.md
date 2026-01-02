# Instrucciones para Ejecutar en Android Studio

## Pasos para Abrir y Ejecutar el Proyecto

### 1. Abrir el Proyecto en Android Studio

1. Abre **Android Studio**
2. Selecciona **"Open"** o **"File > Open"**
3. Navega a: `D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT\android`
4. Selecciona la carpeta `android` y haz clic en **OK**
5. Espera a que Android Studio sincronice el proyecto (Gradle Sync)

### 2. Verificar la Configuración

#### Verificar el SDK de Android:
1. Ve a **File > Project Structure** (o presiona `Ctrl+Alt+Shift+S`)
2. En la pestaña **SDK Location**, verifica:
   - **Android SDK location**: Debe apuntar a `C:\Users\<TuUsuario>\AppData\Local\Android\Sdk`
   - Si no está configurado, configúralo manualmente

#### Verificar el JDK:
1. En **Project Structure > SDK Location**
2. **JDK location**: Debe ser JDK 17, 18, 19 o 20 (NO JDK 21+)
   - Si tienes JDK 25, necesitas instalar JDK 17 o 20
   - Puedes descargarlo desde: https://adoptium.net/

### 3. Sincronizar Gradle

1. Una vez abierto el proyecto, Android Studio debería sincronizar automáticamente
2. Si no, haz clic en **"Sync Now"** en la barra superior
3. Espera a que termine la sincronización

### 4. Ejecutar la Aplicación

#### Opción A: Desde Android Studio

1. **Inicia el Emulador** (si no está corriendo):
   - Haz clic en el ícono **Device Manager** (Android con dispositivo)
   - Selecciona tu emulador (Pixel_5 o Medium_Phone_API_35)
   - Haz clic en el botón **Play** ▶️

2. **Ejecuta la App**:
   - En la barra superior, selecciona el dispositivo emulador
   - Haz clic en el botón **Run** ▶️ (o presiona `Shift+F10`)
   - La aplicación se compilará e instalará automáticamente

#### Opción B: Desde Terminal (en Android Studio)

1. Abre el terminal integrado en Android Studio (View > Tool Windows > Terminal)
2. Ejecuta:
   ```bash
   cd ..
   npm start
   ```
3. En otra terminal o desde la línea de comandos:
   ```bash
   npm run android
   ```

### 5. Ver Errores (si los hay)

Si hay errores de compilación:

1. Revisa la pestaña **Build** en la parte inferior de Android Studio
2. Revisa la pestaña **Logcat** para ver errores en tiempo de ejecución
3. Los errores más comunes:
   - **JDK incompatible**: Instala JDK 17-20
   - **SDK no encontrado**: Configura la ruta del SDK
   - **Gradle sync failed**: Revisa la configuración de Gradle

### 6. Solución de Problemas Comunes

#### Error: "SDK location not found"
- Ve a **File > Project Structure > SDK Location**
- Configura: `C:\Users\<TuUsuario>\AppData\Local\Android\Sdk`

#### Error: "Gradle sync failed"
- Ve a **File > Settings > Build, Execution, Deployment > Build Tools > Gradle**
- Verifica que esté usando **Gradle JDK 17-20**

#### Error: "NDK not found"
- No es crítico para este proyecto, puedes ignorarlo o instalar NDK desde SDK Manager

### 7. Usuarios de Prueba

Una vez que la aplicación se ejecute, puedes usar:

- **Administrador**: `admin@roller.com` / `admin123`
- **Líder**: `lider@roller.com` / `lider123`
- **Roller**: `roller@roller.com` / `roller123`

## Notas

- El servidor Metro (npm start) debe estar corriendo para que la app funcione correctamente
- Si cambias código JavaScript, la app se recargará automáticamente (Hot Reload)
- Los cambios en código nativo requieren recompilar la app



