# Guía Completa: Ejecutar la App en tu iPhone

## 📱 Proceso Completo desde macOS

Esta guía te muestra cómo ejecutar la app SIIG Roller directamente en tu iPhone.

---

## 🔧 Requisitos Previos

### En tu Mac:
- ✅ macOS instalado
- ✅ Xcode instalado (desde App Store)
- ✅ Node.js instalado (v18+)
- ✅ Proyecto clonado/descargado

### En tu iPhone:
- ✅ iOS 12 o superior
- ✅ Cable USB (para primera conexión)
- ✅ iPhone desbloqueado

---

## 🚀 Paso 1: Preparar el Proyecto en macOS

### 1.1 Abrir Terminal en macOS

Presiona `Cmd + Espacio` y escribe "Terminal", luego presiona Enter.

### 1.2 Navegar al Proyecto

```bash
cd "ruta/completa/al/proyecto/SIIG-ROLLER-FRONT"
```

**Ejemplo:**
```bash
cd ~/Desktop/SIIG-ROLLER-FRONT
# o
cd /Users/tuusuario/Documents/SIIG-ROLLER-FRONT
```

### 1.3 Instalar Dependencias (si no lo has hecho)

```bash
npm install
```

### 1.4 Verificar que todo esté listo

```bash
node --version    # Debe ser v18+
npm --version
```

---

## 📱 Paso 2: Conectar tu iPhone

### Opción A: Conectar por USB (Primera vez - OBLIGATORIO)

1. **Conecta el cable USB** al iPhone y a la Mac

2. **En tu iPhone:**
   - Aparecerá un mensaje: "¿Confiar en esta computadora?"
   - Toca **"Confiar"**
   - Ingresa tu código de desbloqueo si se solicita

3. **En la Mac:**
   - Abre **Xcode** (si no está abierto)
   - Ve a: `Window > Devices and Simulators` (o `Cmd + Shift + 2`)
   - Deberías ver tu iPhone en la lista

### Opción B: Conectar por WiFi (Después de la primera conexión USB)

**Usando el script automático:**

```bash
# 1. Hacer el script ejecutable
chmod +x scripts/conectar-iphone-wifi.sh

# 2. Ejecutar el script
bash scripts/conectar-iphone-wifi.sh
```

**O manualmente:**

1. **Conecta el iPhone por USB** (primera vez)
2. **Abre Xcode** > `Window > Devices and Simulators`
3. **Selecciona tu iPhone**
4. **Marca la casilla:** `Connect via network`
5. **Espera** a que aparezca el ícono de red (🌐)
6. **Desconecta el cable USB** - El iPhone seguirá conectado

---

## 🏗️ Paso 3: Configurar el Proyecto iOS

### 3.1 Crear la Carpeta iOS (si no existe)

```bash
# Si la carpeta ios no existe, React Native la creará automáticamente
# O puedes usar el script:
bash scripts/ejecutar-ios-macos.sh
```

### 3.2 Instalar Dependencias de CocoaPods

```bash
# Navegar a la carpeta ios
cd ios

# Instalar CocoaPods (si no está instalado)
sudo gem install cocoapods

# Instalar dependencias
pod install

# Volver al directorio raíz
cd ..
```

**Nota:** Esto puede tardar varios minutos la primera vez.

---

## 🚀 Paso 4: Ejecutar la App en tu iPhone

### 4.1 Iniciar Metro Bundler

**Abre una terminal y ejecuta:**

```bash
cd "ruta/al/proyecto/SIIG-ROLLER-FRONT"
npm start
```

**Espera a ver:**
```
Metro waiting on exp://...
```

**NO cierres esta terminal** - Déjala corriendo.

### 4.2 Ejecutar la App en tu iPhone

**Abre OTRA terminal** y ejecuta:

```bash
cd "ruta/al/proyecto/SIIG-ROLLER-FRONT"

# Opción 1: Ejecutar en tu iPhone (si está conectado)
npm run ios --device

# Opción 2: Especificar el nombre de tu iPhone
npm run ios --device="Nombre de tu iPhone"
```

**O usar el script automático:**

```bash
bash scripts/ejecutar-ios-macos.sh
```

### 4.3 Lo que sucederá:

1. **Xcode compilará la app** (puede tardar 2-5 minutos la primera vez)
2. **La app se instalará** en tu iPhone
3. **La app se abrirá automáticamente** en tu iPhone
4. **Verás la pantalla de login** de SIIG Roller

---

## ✅ Paso 5: Verificar que Funciona

### En tu iPhone:

1. **La app debería abrirse automáticamente**
2. **Deberías ver la pantalla de login**
3. **Prueba iniciar sesión** con:
   - Email: `admin@roller.com`
   - Contraseña: `admin123`

### Si la app no se abre:

1. **Verifica que Metro Bundler esté corriendo** (Terminal 1)
2. **Verifica la conexión del iPhone:**
   ```bash
   xcrun xctrace list devices
   ```
   Deberías ver tu iPhone en la lista

3. **Revisa los errores en Xcode:**
   - Abre Xcode
   - Ve a la pestaña "Issues" (⚠️)
   - Revisa si hay errores de compilación

---

## 🔄 Paso 6: Reconectar en Futuras Sesiones

### Si reinicias tu iPhone o Mac:

**Opción A: Por USB (más rápido)**
```bash
# 1. Conecta el iPhone por USB
# 2. Ejecuta directamente:
npm run ios --device
```

**Opción B: Por WiFi (si ya lo configuraste antes)**
```bash
# 1. Verifica que el iPhone esté en la misma red WiFi
# 2. Ejecuta:
npm run ios --device
```

Si no se conecta automáticamente por WiFi:
```bash
bash scripts/conectar-iphone-wifi.sh
```

---

## 🛠️ Solución de Problemas

### ❌ Error: "No devices found"

**Solución:**
```bash
# 1. Verifica que el iPhone esté conectado
xcrun xctrace list devices

# 2. Si no aparece, reconecta por USB
# 3. Asegúrate de haber tocado "Confiar" en el iPhone
```

### ❌ Error: "CocoaPods not found"

**Solución:**
```bash
sudo gem install cocoapods
cd ios
pod install
cd ..
```

### ❌ Error: "Metro bundler not running"

**Solución:**
```bash
# En una terminal separada:
npm start

# Espera a que aparezca "Metro waiting..."
# Luego en otra terminal:
npm run ios --device
```

### ❌ La app se instala pero no se abre

**Solución:**
1. **Abre la app manualmente** en tu iPhone (busca "SIIG Roller")
2. **Verifica que Metro Bundler esté corriendo**
3. **Revisa la consola de Xcode** para ver errores

### ❌ Error de compilación en Xcode

**Solución:**
1. **Abre el proyecto en Xcode:**
   ```bash
   open ios/SIIGROLLER.xcworkspace
   ```
   (Nota: usa `.xcworkspace`, NO `.xcodeproj`)

2. **En Xcode:**
   - Selecciona tu iPhone como destino
   - Ve a `Product > Clean Build Folder` (`Cmd + Shift + K`)
   - Luego `Product > Build` (`Cmd + B`)

---

## 📝 Comandos Rápidos de Referencia

```bash
# Verificar dispositivos conectados
xcrun xctrace list devices

# Iniciar Metro Bundler
npm start

# Ejecutar en iPhone (en otra terminal)
npm run ios --device

# Conectar iPhone por WiFi
bash scripts/conectar-iphone-wifi.sh

# Ejecutar todo automáticamente
bash scripts/ejecutar-ios-macos.sh

# Limpiar y reconstruir
cd ios
pod deintegrate
pod install
cd ..
npm start -- --reset-cache
```

---

## 🎯 Resumen del Proceso

1. ✅ **Conectar iPhone por USB** (primera vez)
2. ✅ **Confiar en la computadora** (en el iPhone)
3. ✅ **Instalar CocoaPods** (`pod install`)
4. ✅ **Iniciar Metro Bundler** (`npm start`)
5. ✅ **Ejecutar app** (`npm run ios --device`)
6. ✅ **¡Disfrutar la app en tu iPhone!** 🎉

---

## 💡 Tips Importantes

- **Mantén Metro Bundler corriendo** mientras desarrollas
- **La primera compilación tarda más** (2-5 minutos)
- **Las siguientes compilaciones son más rápidas** (30-60 segundos)
- **Si cambias código**, solo presiona `R` en Metro Bundler para recargar
- **Para ver logs**, abre Xcode > Window > Devices and Simulators > Tu iPhone > View Device Logs

---

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas:

1. **Revisa los logs de Xcode**
2. **Revisa la terminal de Metro Bundler**
3. **Verifica que todos los requisitos estén instalados**
4. **Consulta `scripts/INSTRUCCIONES-CONEXION-WIFI.md`**

¡Listo! Ahora puedes ejecutar la app en tu iPhone. 🚀

