# Opción C: Probar en Android Primero (Desde Windows)

## ✅ Código en GitHub

El código ya está disponible en:
**https://github.com/IvanIbarr/appRunSkateRoller**

---

## 📱 Pasos para Ejecutar en Android

### Paso 1: Verificar Android Studio

```powershell
# Verificar si Android Studio está instalado
Get-Process "studio64" -ErrorAction SilentlyContinue
```

**Si NO está instalado:**

1. **Descargar Android Studio:**
   - https://developer.android.com/studio
   - Instalar con todas las opciones por defecto

2. **Configurar Android SDK:**
   - Abrir Android Studio
   - Tools > SDK Manager
   - Instalar Android SDK (API 33 o superior)

### Paso 2: Configurar Dispositivo Android

#### Opción A: Emulador Android (Recomendado para pruebas)

1. **Abrir Android Studio**
2. **Tools > Device Manager**
3. **Create Device** (si no tienes uno)
   - Seleccionar dispositivo (Pixel 5, etc.)
   - Seleccionar sistema (API 33 o superior)
   - Crear y lanzar emulador

#### Opción B: Dispositivo Android Físico

1. **Habilitar Depuración USB:**
   - Configuración > Acerca del teléfono
   - Tocar "Número de compilación" 7 veces
   - Volver a Configuración > Opciones de desarrollador
   - Activar "Depuración USB"

2. **Conectar por USB:**
   - Conectar Android a la laptop
   - Aceptar solicitud de depuración en el Android

3. **Verificar conexión:**
   ```powershell
   $adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adb devices
   ```
   Deberías ver tu dispositivo en la lista

### Paso 3: Configurar Variables de Entorno (Si es necesario)

```powershell
# Verificar que ANDROID_HOME esté configurado
$env:ANDROID_HOME

# Si no está configurado:
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")
```

### Paso 4: Verificar que Metro Bundler Esté Corriendo

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"

# Si no está corriendo:
npm start
```

**Espera a ver:** `Metro waiting on...`

### Paso 5: Ejecutar en Android

**En otra terminal (nueva ventana de PowerShell):**

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

**Lo que sucederá:**
1. Gradle compilará la app (puede tardar varios minutos la primera vez)
2. La app se instalará en el dispositivo/emulador
3. La app se abrirá automáticamente

---

## 🔍 Verificar Dispositivos Android

```powershell
# Verificar dispositivos conectados
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices
```

**Deberías ver:**
```
List of devices attached
emulator-5554    device
# o
[ID_DISPOSITIVO]    device
```

---

## 🛠️ Solución de Problemas

### Error: "ANDROID_HOME not set"

```powershell
# Configurar ANDROID_HOME
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")

# Reiniciar PowerShell después de configurar
```

### Error: "No devices found"

**Para Emulador:**
1. Abrir Android Studio
2. Device Manager > Iniciar emulador
3. Esperar a que el emulador termine de cargar
4. Ejecutar `npm run android` nuevamente

**Para Dispositivo Físico:**
1. Verificar que "Depuración USB" esté activada
2. Desconectar y volver a conectar USB
3. Aceptar solicitud de depuración en el Android
4. Ejecutar: `& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices`

### Error: "Metro bundler not running"

```powershell
# En Terminal 1:
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm start

# Espera a ver "Metro waiting on..."
# Luego en Terminal 2:
npm run android
```

### Error: "Gradle build failed"

```powershell
# Limpiar build
cd android
.\gradlew clean
cd ..

# Reintentar
npm run android
```

### Error: "SDK location not found"

1. Abrir Android Studio
2. File > Project Structure > SDK Location
3. Verificar que la ruta del SDK sea correcta
4. Generalmente: `C:\Users\[TuUsuario]\AppData\Local\Android\Sdk`

---

## 📱 Conexión WiFi (Sin Cable)

Si quieres conectar Android por WiFi (después de primera conexión USB):

```powershell
# 1. Conectar por USB primero
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# 2. Habilitar conexión WiFi
& $adb tcpip 5555

# 3. Obtener IP del Android
# En el Android: Configuración > Acerca del teléfono > Estado > Dirección IP
# Ejemplo: 192.168.1.85

# 4. Conectar por WiFi
& $adb connect 192.168.1.85:5555

# 5. Verificar
& $adb devices
# Deberías ver: 192.168.1.85:5555    device

# 6. Ahora puedes desconectar USB
# Ejecutar normalmente:
npm run android
```

---

## ✅ Checklist Rápido

- [ ] Android Studio instalado
- [ ] Android SDK instalado (API 33+)
- [ ] Emulador Android creado/iniciado O dispositivo Android conectado
- [ ] Depuración USB habilitada (si es dispositivo físico)
- [ ] Metro Bundler corriendo (`npm start`)
- [ ] `npm run android` ejecutado

---

## 🚀 Comandos Rápidos

```powershell
# Terminal 1: Metro Bundler
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm start

# Terminal 2: Ejecutar en Android
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

---

## 📝 Notas Importantes

- **Primera compilación:** Puede tardar 5-10 minutos
- **Siguientes compilaciones:** 1-2 minutos
- **Metro Bundler:** Manténlo corriendo mientras desarrollas
- **Hot Reload:** Los cambios se reflejan automáticamente

---

## 🎯 Después de Probar en Android

Una vez que pruebes en Android y todo funcione:

1. **Verificar que todas las funcionalidades trabajen:**
   - Login/Registro
   - Calendario
   - Crear/Editar/Eliminar eventos
   - Compartir eventos

2. **Luego probar en iPhone** (Opción B) cuando tengas acceso a Mac

---

## 🔄 Actualizar desde GitHub

Si haces cambios y quieres probarlos:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
git pull origin main
npm install
npm run android
```

¡Listo para probar en Android! 🚀

