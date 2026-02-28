# 📶 Guía: Conectar Moto G60 por WiFi (Sin Cable USB)

Esta guía te permitirá conectar tu Moto G60 a tu PC por WiFi, sin necesidad de usar el cable USB.

---

## 📋 Requisitos Previos

1. ✅ Tu Moto G60 y tu PC deben estar conectados a la **misma red WiFi**
2. ✅ Ya habilitaste "Opciones de desarrollador" y "Depuración USB" en tu Moto G60
3. ✅ La primera vez, necesitarás conectar el cable USB (solo para configurar la conexión WiFi)

---

## 🔌 Paso 1: Conexión Inicial con Cable USB (Solo la Primera Vez)

**Nota:** Solo necesitas hacer esto la primera vez para configurar ADB over WiFi.

1. **Conecta tu Moto G60 a tu PC con el cable USB**
2. Verifica que ADB reconozca el dispositivo:

```powershell
# Ubica tu ADB.exe (generalmente está en Android Studio)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

Deberías ver algo como:
```
List of devices attached
RZ8R90XXXXX    device
```

3. **Habilita ADB over WiFi en el dispositivo:**

```powershell
# Configurar ADB para usar el puerto 5555 (puerto estándar para WiFi)
& "$env:ANDROID_HOME\platform-tools\adb.exe" tcpip 5555
```

Verás:
```
restarting in TCP mode port: 5555
```

---

## 📱 Paso 2: Obtener la IP de tu Moto G60

Hay dos formas de obtener la IP de tu teléfono:

### Opción A: Desde el Teléfono

1. En tu Moto G60, ve a **Configuración** → **Acerca del teléfono**
2. Busca **"Dirección IP"** o **"Estado"** → **"Dirección IP"**
3. Anota la IP (ejemplo: `192.168.1.85`)

### Opción B: Desde ADB (Si todavía está conectado por USB)

```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell ip -f inet addr show wlan0 | findstr "inet"
```

O más simple:

```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell "ip addr show wlan0 | grep 'inet ' | cut -d' ' -f6|cut -d/ -f1"
```

---

## 🔗 Paso 3: Conectar ADB por WiFi

**Ahora puedes desconectar el cable USB.**

1. **Conecta ADB a la IP de tu teléfono:**

```powershell
# Reemplaza 192.168.1.85 con la IP real de tu Moto G60
& "$env:ANDROID_HOME\platform-tools\adb.exe" connect 192.168.1.85:5555
```

Deberías ver:
```
connected to 192.168.1.85:5555
```

2. **Verifica la conexión:**

```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

Deberías ver:
```
List of devices attached
192.168.1.85:5555    device
```

**¡Listo!** Ahora tu Moto G60 está conectado por WiFi. 🎉

---

## 🚀 Paso 4: Ejecutar la App sin Cable

Ahora puedes ejecutar la app normalmente:

### Terminal 1: Metro Bundler

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm start
```

### Terminal 2: Compilar e Instalar (Por WiFi)

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

La app se instalará y ejecutará en tu Moto G60 **sin necesidad de cable USB**.

---

## 🔄 Paso 5: Reconectar ADB por WiFi en Futuras Sesiones

**Si reinicias tu teléfono o tu PC**, necesitarás reconectar:

1. **Verifica si tu teléfono sigue conectado:**

```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

2. **Si no aparece, reconecta:**

```powershell
# Reemplaza 192.168.1.85 con la IP de tu Moto G60
& "$env:ANDROID_HOME\platform-tools\adb.exe" connect 192.168.1.85:5555
```

**Nota:** Si tu teléfono obtiene una IP diferente después de reiniciarse, necesitarás obtener la nueva IP y reconectar.

---

## 🛠️ Script Automático de Conexión WiFi

Para facilitar el proceso, puedes crear un script PowerShell:

```powershell
# conectar-adb-wifi.ps1
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$ADB = "$env:ANDROID_HOME\platform-tools\adb.exe"

# IP de tu Moto G60 (cámbiala si es diferente)
$DEVICE_IP = "192.168.1.85"

Write-Host "🔌 Conectando ADB por WiFi a $DEVICE_IP..." -ForegroundColor Cyan

& $ADB connect "$DEVICE_IP:5555"

Write-Host "✅ Verificando conexión..." -ForegroundColor Green
& $ADB devices
```

Guarda este script como `conectar-adb-wifi.ps1` en la carpeta del proyecto y ejecútalo cuando necesites reconectar.

---

## 🔧 Solución de Problemas

### ❌ Error: "cannot connect to 192.168.1.85:5555: No connection could be made because the target machine actively refused it"

**Solución:**
1. Asegúrate de que tu teléfono y PC estén en la misma red WiFi
2. Verifica que tu teléfono tenga la IP correcta (puede haber cambiado)
3. Si reiniciaste tu teléfono, necesitas volver a conectar el cable USB y ejecutar `adb tcpip 5555` de nuevo

### ❌ Error: "unable to connect to 192.168.1.85:5555"

**Solución:**
1. Verifica que el firewall de Windows no esté bloqueando el puerto 5555
2. Verifica que tu teléfono tenga la IP correcta
3. Intenta desconectar y volver a conectar:
   ```powershell
   & "$env:ANDROID_HOME\platform-tools\adb.exe" disconnect
   & "$env:ANDROID_HOME\platform-tools\adb.exe" connect 192.168.1.85:5555
   ```

### ❌ El teléfono se desconecta frecuentemente

**Solución:**
1. Desactiva el "Ahorro de energía" para WiFi en tu teléfono
2. Configura tu red WiFi como "Red de uso ilimitado" en Android
3. Ve a **Configuración** → **Redes** → **WiFi** → Tu red → **Modificar** → Activa **"Usar red siempre activa"**

### ❌ La IP del teléfono cambia cada vez que se reinicia

**Solución:**
1. Configura una IP estática en tu router para tu Moto G60
2. O usa la configuración estática en Android:
   - **Configuración** → **Redes** → **WiFi** → Tu red → **Modificar** → **Opciones avanzadas** → **IP estática**
   - Ingresa una IP fija (ejemplo: `192.168.1.85`)
   - Máscara: `255.255.255.0`
   - Gateway: `192.168.1.1` (o la IP de tu router)
   - DNS: `8.8.8.8` y `8.8.4.4`

---

## 📝 Notas Importantes

1. **La primera conexión siempre requiere cable USB** para configurar `adb tcpip 5555`
2. **Si reinicias tu teléfono**, necesitarás volver a ejecutar `adb tcpip 5555` con cable USB
3. **Si cambias de red WiFi**, necesitarás obtener la nueva IP y reconectar
4. **El rendimiento puede ser ligeramente más lento** que por USB, pero debería ser suficiente para desarrollo
5. **Asegúrate de que la IP en `api.ts` sea la IP de tu PC** (actualmente: `192.168.1.76`)

---

## ✅ Checklist Rápido

- [ ] Moto G60 y PC en la misma red WiFi
- [ ] Primera conexión: cable USB → `adb tcpip 5555`
- [ ] Obtener IP del Moto G60
- [ ] Conectar: `adb connect IP:5555`
- [ ] Verificar: `adb devices`
- [ ] Ejecutar `npm start` y `npm run android`

---

¡Listo! Ahora puedes desarrollar sin cables. 🎉


