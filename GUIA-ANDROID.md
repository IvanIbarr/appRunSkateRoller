# 📱 Guía para Ejecutar la App en Android (Moto G32)

## ✅ Pasos Previos

### 1. Activar Depuración USB en el Teléfono

1. **Activar Opciones de Desarrollador:**
   - Ve a **Configuración** > **Acerca del teléfono**
   - Busca **"Número de compilación"** o **"Build number"**
   - **Toca 7 veces** en "Número de compilación"
   - Verás el mensaje: "Ahora eres desarrollador"

2. **Activar Depuración USB:**
   - Ve a **Configuración** > **Sistema** > **Opciones de desarrollador**
   - Activa **"Depuración USB"**
   - Activa **"Instalar vía USB"** (opcional pero recomendado)

3. **Conectar el Teléfono:**
   - Conecta el cable USB a la laptop
   - En el teléfono, aparecerá un diálogo: **"Permitir depuración USB?"**
   - Marca **"Permitir siempre desde este equipo"**
   - Toca **"Permitir"**

### 2. Verificar Conexión

Ejecuta en PowerShell:
```powershell
adb devices
```

Deberías ver algo como:
```
List of devices attached
ABC123XYZ    device
```

Si aparece `unauthorized`, acepta el diálogo en el teléfono.

### 3. Iniciar el Backend

**IMPORTANTE:** El backend debe estar corriendo antes de ejecutar la app.

En una ventana de PowerShell:
```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-BACKEND"
node src/server.js
```

Deberías ver:
```
✅ Conectado a PostgreSQL
✅ Conexión a la base de datos exitosa
🚀 Servidor corriendo en http://localhost:3001
```

### 4. Verificar IP de la Red

La app necesita la IP de tu laptop en la red local. Verifica que coincida:

```powershell
ipconfig
```

Busca "Dirección IPv4" en la conexión activa (WiFi o Ethernet).

Si la IP es diferente a `192.168.1.76`, actualiza:
- Archivo: `SIIG-ROLLER-FRONT/src/config/api.ts`
- Línea 16: Cambia `const LOCAL_IP = '192.168.1.76';` por tu IP actual

### 5. Permitir Puerto en Firewall (si es necesario)

Si el teléfono no puede conectarse al backend, permite el puerto 3001:

```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "Backend Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## 🚀 Ejecutar la App

### Opción 1: Script Automático (Recomendado)

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
.\ejecutar-android.ps1
```

### Opción 2: Manual

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"

# Iniciar Metro Bundler (en una ventana)
npm start

# En otra ventana, ejecutar Android
npm run android
```

## 🔍 Solución de Problemas

### El dispositivo no aparece en `adb devices`

1. Desconecta y vuelve a conectar el cable USB
2. Acepta el diálogo de "Permitir depuración USB" en el teléfono
3. Verifica que "Depuración USB" esté activada
4. Prueba otro cable USB (algunos cables solo cargan, no transfieren datos)

### Error: "Could not connect to development server"

1. Verifica que Metro Bundler esté corriendo (`npm start`)
2. Verifica que el backend esté corriendo en el puerto 3001
3. Verifica que la IP en `api.ts` sea correcta
4. Asegúrate de que el teléfono y la laptop estén en la misma red WiFi

### La app se instala pero no se conecta al backend

1. Verifica la IP en `api.ts`
2. Prueba acceder desde el navegador del teléfono: `http://TU_IP:3001/health`
3. Si no funciona, verifica el firewall de Windows
4. Asegúrate de que el backend esté escuchando en `0.0.0.0` o `localhost`

### Error de compilación

1. Limpia el proyecto:
   ```powershell
   cd android
   .\gradlew clean
   cd ..
   ```

2. Reinstala dependencias:
   ```powershell
   npm install
   ```

3. Limpia caché de Metro:
   ```powershell
   npm start -- --reset-cache
   ```

## 📝 Notas

- **Primera vez:** La compilación puede tardar varios minutos
- **Metro Bundler:** Debe estar corriendo mientras usas la app
- **Backend:** Debe estar corriendo siempre que uses la app
- **Hot Reload:** Los cambios en el código se reflejan automáticamente (sacude el teléfono y toca "Reload")

## ✅ Verificación Final

Una vez que la app esté corriendo:

1. ✅ Deberías ver la pantalla de Login
2. ✅ Puedes iniciar sesión con tus credenciales
3. ✅ La app se conecta al backend (verifica en los logs del backend)
4. ✅ Puedes navegar por todas las pantallas
5. ✅ El historial muestra los nuevos diseños circulares

¡Disfruta probando la app en tu Moto G32! 🎉


