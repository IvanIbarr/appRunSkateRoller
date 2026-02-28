# Configuración Paso a Paso para Probar en iPhone

## 🎯 Opciones Disponibles

### Opción A: Mac en la Nube (Recomendado - Más Rápido) ⭐

**Tiempo:** 30-60 minutos  
**Costo:** ~$20/mes (MacinCloud)  
**Complejidad:** ⭐⭐ Media

### Opción B: Mac Físico (Si tienes acceso)

**Tiempo:** 15-30 minutos  
**Costo:** Gratis  
**Complejidad:** ⭐ Baja

### Opción C: Probar en Android Primero (Desde Windows)

**Tiempo:** 10 minutos  
**Costo:** Gratis  
**Complejidad:** ⭐ Baja

---

## 🚀 OPCIÓN A: Configurar Mac en la Nube

### Paso 1: Registrarse en MacinCloud

1. **Ir a:** https://www.macincloud.com/
2. **Crear cuenta** (registro gratuito)
3. **Elegir plan:**
   - **Dedicated Server**: ~$20-50/mes (recomendado)
   - **Shared Server**: ~$10-20/mes (más económico)

### Paso 2: Conectarse al Mac Remoto

1. **Descargar cliente RDP/VNC** (si no tienes):
   - Windows tiene RDP integrado
   - O descargar: https://www.realvnc.com/en/connect/download/viewer/

2. **Obtener credenciales** de MacinCloud:
   - IP del servidor
   - Usuario y contraseña
   - Puerto (generalmente 5900 para VNC o 3389 para RDP)

3. **Conectarse:**
   ```
   En Windows: mstsc (para RDP)
   O usar cliente VNC con la IP proporcionada
   ```

### Paso 3: Configurar el Mac Remoto

Una vez conectado al Mac remoto:

```bash
# 1. Abrir Terminal en el Mac remoto

# 2. Instalar Homebrew (si no está)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Instalar Node.js
brew install node

# 4. Instalar Xcode Command Line Tools
xcode-select --install

# 5. Aceptar licencia de Xcode
sudo xcodebuild -license accept

# 6. Instalar CocoaPods
sudo gem install cocoapods
```

### Paso 4: Subir el Proyecto

**Opción 1: Usar Git (Recomendado)**

```bash
# En el Mac remoto
cd ~
git clone [URL_DEL_REPOSITORIO]
# O crear repositorio y hacer push desde Windows
```

**Opción 2: Usar SFTP**

```bash
# Desde Windows, usar WinSCP o FileZilla
# Conectar al Mac remoto
# Subir carpeta SIIG-ROLLER-FRONT
```

**Opción 3: Usar USB/Disco Duro Virtual**

Si el servicio lo permite, montar un disco compartido.

### Paso 5: Conectar iPhone

**Opción A: Por USB (si el servicio lo permite)**

1. Conectar iPhone por USB al Mac remoto
2. Confiar en la computadora (en el iPhone)

**Opción B: Por WiFi (después de primera conexión USB)**

1. Conectar iPhone por USB primero (una vez)
2. Habilitar "Connect via network" en Xcode
3. Desconectar USB
4. El iPhone seguirá conectado por WiFi

### Paso 6: Ejecutar la App

```bash
# En el Mac remoto, Terminal 1:
cd ~/SIIG-ROLLER-FRONT
npm install
cd ios
pod install
cd ..
npm start

# En el Mac remoto, Terminal 2:
cd ~/SIIG-ROLLER-FRONT
npm run ios --device
```

---

## 🖥️ OPCIÓN B: Configurar Mac Físico

### Paso 1: Conectar iPhone

1. **Conectar iPhone por USB** al Mac
2. **En el iPhone:** Tocar "Confiar en esta computadora"
3. **Desbloquear iPhone** si está bloqueado

### Paso 2: Subir Proyecto al Mac

**Opción 1: Git (Recomendado)**

```bash
# En Windows, hacer commit y push
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
git add .
git commit -m "Preparar para iOS"
git push

# En Mac, clonar
git clone [URL_DEL_REPOSITORIO]
```

**Opción 2: USB/Disco Externo**

1. Copiar carpeta `SIIG-ROLLER-FRONT` a USB
2. Conectar USB al Mac
3. Copiar al Mac

**Opción 3: Red Local (WiFi)**

1. Compartir carpeta en Windows
2. Acceder desde Mac por red

### Paso 3: Instalar Dependencias en Mac

```bash
# Abrir Terminal en Mac
cd "ruta/al/proyecto/SIIG-ROLLER-FRONT"

# Instalar dependencias Node
npm install

# Instalar CocoaPods (si no está)
sudo gem install cocoapods

# Instalar dependencias iOS
cd ios
pod install
cd ..
```

### Paso 4: Ejecutar la App

```bash
# Terminal 1: Metro Bundler
npm start

# Terminal 2: Ejecutar en iPhone
npm run ios --device
```

---

## 📱 OPCIÓN C: Probar en Android Primero (Desde Windows)

### Paso 1: Verificar Android Studio

```powershell
# Verificar si Android Studio está instalado
Get-Process "studio64" -ErrorAction SilentlyContinue
```

Si no está instalado:
1. Descargar: https://developer.android.com/studio
2. Instalar Android Studio
3. Instalar Android SDK

### Paso 2: Configurar Dispositivo Android

**Opción A: Emulador Android**

1. Abrir Android Studio
2. Tools > Device Manager
3. Crear/Iniciar emulador

**Opción B: Dispositivo Android Físico**

1. Habilitar "Depuración USB" en el Android
2. Conectar por USB
3. Aceptar solicitud de depuración

### Paso 3: Ejecutar en Android

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

---

## 🎯 ¿Cuál Opción Elegir?

### Elige Opción A si:
- ✅ Quieres probar iOS rápidamente
- ✅ No tienes acceso a Mac físico
- ✅ Estás dispuesto a pagar ~$20/mes

### Elige Opción B si:
- ✅ Tienes acceso a Mac físico
- ✅ Puedes conectar iPhone al Mac
- ✅ Quieres evitar costos

### Elige Opción C si:
- ✅ Quieres probar la app ahora mismo
- ✅ Tienes Android Studio o dispositivo Android
- ✅ Puedes probar iOS después

---

## 📝 Siguiente Paso

**Dime cuál opción prefieres y te guío paso a paso con los comandos exactos.**

¿Cuál opción quieres configurar?
- [ ] Opción A: Mac en la nube
- [ ] Opción B: Mac físico
- [ ] Opción C: Android primero

