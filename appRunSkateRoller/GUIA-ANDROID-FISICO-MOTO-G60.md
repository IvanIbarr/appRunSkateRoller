# 📱 Guía: Ejecutar la App en Moto G60 (Dispositivo Físico)

## 📋 Requisitos Previos

1. ✅ Android Studio instalado
2. ✅ Node.js instalado (versión 18 o superior)
3. ✅ El proyecto React Native configurado
4. ✅ Tu Moto G60 con cable USB

---

## 🔧 Paso 1: Habilitar Opciones de Desarrollador en tu Moto G60

1. **Abre la configuración** en tu Moto G60
2. Ve a **"Acerca del teléfono"** o **"Acerca del dispositivo"**
3. Busca **"Número de compilación"** (puede estar en "Información del software")
4. **Toca 7 veces** sobre "Número de compilación"
5. Verás un mensaje que dice: "Ya eres desarrollador"

---

## 🔓 Paso 2: Activar Depuración USB

1. Vuelve a la pantalla principal de **Configuración**
2. Busca **"Opciones de desarrollador"** (ahora debería aparecer)
3. Activa el interruptor de **"Opciones de desarrollador"** (arriba)
4. Dentro de Opciones de desarrollador:
   - ✅ Activa **"Depuración USB"**
   - ✅ Activa **"Permitir instalación a través de USB"** (si está disponible)
   - ✅ Activa **"Permitir instalación vía USB"** o **"Instalar vía USB"**

---

## 🔌 Paso 3: Conectar el Dispositivo

1. **Conecta tu Moto G60** a tu PC con un cable USB
2. En tu teléfono, cuando aparezca el mensaje:
   - **"¿Permitir depuración USB?"**
   - ✅ Marca **"Permitir siempre desde esta computadora"**
   - Toca **"Permitir"**
3. Si aparece otro mensaje de seguridad, también permite la instalación

---

## ✅ Paso 4: Verificar que tu PC Reconoce el Dispositivo

Abre PowerShell o CMD y ejecuta:

```powershell
adb devices
```

**Deberías ver algo como:**
```
List of devices attached
ABC123XYZ    device
```

Si ves `unauthorized` en lugar de `device`:
- Desconecta y vuelve a conectar el cable USB
- Acepta la solicitud de depuración USB en tu teléfono

Si no ves tu dispositivo:
- Verifica que el cable USB permita transferencia de datos (algunos cables solo cargan)
- Prueba con otro cable USB
- Verifica que la depuración USB esté activada

---

## 🚀 Paso 5: Configurar la IP del Backend para Android

Como Android no puede acceder a `localhost` desde tu PC, necesitas usar la IP de tu red local:

1. **Obtén la IP de tu PC:**
   ```powershell
   ipconfig
   ```
   Busca **"Dirección IPv4"** en la sección de tu conexión Wi-Fi o Ethernet.
   Ejemplo: `192.168.1.100` o `192.168.0.50`

2. **Edita el archivo de configuración de API:**
   - Abre: `SIIG-ROLLER-FRONT/src/config/api.ts`
   - Busca la línea: `const LOCAL_IP = '192.168.1.100';`
   - **Cambia `192.168.1.100` por la IP que obtuviste con `ipconfig`**
   - Guarda el archivo

   **Ejemplo:**
   ```typescript
   // Si tu IP es 192.168.0.50, cambia a:
   const LOCAL_IP = '192.168.0.50';
   ```

   ⚠️ **Importante**: 
   - La app detectará automáticamente que está en Android y usará esta IP
   - Para web/emulador seguirá usando `localhost`
   - Asegúrate de que tu PC y tu Moto G60 estén en la misma red Wi-Fi

---

## 🔥 Paso 6: Asegurar que el Backend esté Corriendo

En una terminal PowerShell:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-BACKEND"
npm run dev
```

**Debes ver:**
```
✅ Conectado a PostgreSQL
🚀 Servidor corriendo en http://localhost:3001
```

⚠️ **Importante**: El backend debe estar corriendo en `localhost:3001`. El dispositivo Android accederá usando la IP de tu PC.

---

## 📦 Paso 7: Asegurar que el Firewall Permita Conexiones

1. Abre **"Firewall de Windows Defender"**
2. Haz clic en **"Configuración avanzada"**
3. Clic en **"Reglas de entrada"** en el panel izquierdo
4. Busca si existe una regla para el puerto 3001
5. Si no existe, crea una nueva regla que permita conexiones TCP en el puerto 3001

**O más fácil:**
- Cuando ejecutes la app y veas el aviso del firewall, haz clic en **"Permitir acceso"**

---

## 🎯 Paso 8: Ejecutar la Aplicación en tu Moto G60

Abre **DOS terminales** en PowerShell:

### Terminal 1: Metro Bundler (Servidor de Desarrollo)

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm start
```

Espera a que veas:
```
Metro waiting on exp://192.168.1.XXX:8081
```

### Terminal 2: Compilar e Instalar en Android

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

**Lo que sucederá:**
1. Gradle compilará la aplicación (puede tardar varios minutos la primera vez)
2. La aplicación se instalará en tu Moto G60
3. La aplicación se abrirá automáticamente

---

## 🧪 Paso 9: Probar la Aplicación

Una vez que la app se abra en tu Moto G60:

1. **Verifica la conexión con el backend:**
   - Intenta iniciar sesión con: `admin@roller.com` / `admin123`
   - Si funciona, ¡la conexión está correcta!

2. **Si no se conecta al backend:**
   - Verifica que tu PC y tu Moto G60 estén en la misma red Wi-Fi
   - Verifica que la IP en `api.ts` sea correcta
   - Verifica que el backend esté corriendo
   - Verifica que el firewall permita conexiones

---

## 🔧 Solución de Problemas Comunes

### ❌ Error: "adb: no devices/emulators found"

**Solución:**
1. Verifica que la depuración USB esté activada en tu teléfono
2. Ejecuta: `adb kill-server` y luego `adb start-server`
3. Desconecta y vuelve a conectar el cable USB
4. Acepta la solicitud de depuración USB en tu teléfono

### ❌ Error: "Metro bundler no se conecta"

**Solución:**
1. Asegúrate de que el Metro Bundler esté corriendo (`npm start`)
2. Verifica que tu teléfono y PC estén en la misma red Wi-Fi
3. En tu teléfono, agita el dispositivo y selecciona **"Settings"** → Configura la IP manualmente si es necesario

### ❌ La app se abre pero muestra "Network request failed"

**Solución:**
1. Verifica que la IP en `api.ts` sea correcta (debe ser la IP de tu PC, no localhost)
2. Verifica que el backend esté corriendo en `localhost:3001`
3. Verifica que tu PC y Moto G60 estén en la misma red Wi-Fi
4. Verifica que el firewall permita conexiones en el puerto 3001

### ❌ La app no se instala en el dispositivo

**Solución:**
1. Verifica que hayas aceptado la instalación USB en tu teléfono
2. Verifica que el cable USB permita transferencia de datos
3. Prueba con otro cable USB

### ❌ Error de compilación en Gradle

**Solución:**
1. Abre Android Studio
2. Abre el proyecto en: `SIIG-ROLLER-FRONT/android`
3. Deja que sincronice Gradle
4. Intenta compilar desde Android Studio primero
5. Luego vuelve a ejecutar `npm run android`

---

## 📝 Notas Importantes

- ⚠️ **La primera compilación puede tardar 5-10 minutos**. Ten paciencia.
- 🔄 **Para cambios de código JavaScript**: La app se recargará automáticamente (Hot Reload)
- 🔨 **Para cambios de código nativo**: Debes recompilar con `npm run android`
- 📱 **Mantén tu teléfono desbloqueado** durante la instalación
- 🔌 **Usa un buen cable USB** que permita transferencia de datos

---

## ✅ Usuarios de Prueba

Una vez que la app funcione, puedes usar:

- **Administrador**: `admin@roller.com` / `admin123`
- **Líder**: `lider@roller.com` / `lider123`
- **Roller**: `roller@roller.com` / `roller123`

---

## 🎉 ¡Listo!

Si todo sale bien, verás la aplicación ejecutándose en tu Moto G60. ¡Disfruta probando la app en tu dispositivo físico!


