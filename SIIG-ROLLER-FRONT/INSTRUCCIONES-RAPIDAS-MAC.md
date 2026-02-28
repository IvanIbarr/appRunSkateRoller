# Instrucciones Rápidas para Mac

## 🚀 Ejecución Automática (Recomendado)

Cuando tengas acceso a Mac, ejecuta este script que hace TODO automáticamente:

```bash
# 1. Clonar repositorio (si no lo tienes)
git clone https://github.com/IvanIbarr/appRunSkateRoller.git
cd appRunSkateRoller

# 2. Hacer el script ejecutable
chmod +x scripts/ejecutar-todo-mac.sh

# 3. Ejecutar (hace todo automáticamente)
bash scripts/ejecutar-todo-mac.sh
```

El script:
- ✅ Clona el repositorio (si no existe)
- ✅ Instala dependencias Node.js
- ✅ Verifica Node.js y Xcode
- ✅ Instala CocoaPods
- ✅ Verifica conexión del iPhone
- ✅ Inicia Metro Bundler
- ✅ Compila e instala la app en tu iPhone

---

## 📝 Ejecución Manual (Paso a Paso)

Si prefieres hacerlo manualmente:

### Paso 1: Clonar Repositorio

```bash
git clone https://github.com/IvanIbarr/appRunSkateRoller.git
cd appRunSkateRoller
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Instalar CocoaPods (Primera vez)

```bash
sudo gem install cocoapods
```

### Paso 4: Conectar iPhone

1. Conectar iPhone por USB al Mac
2. En el iPhone: Tocar "Confiar en esta computadora"
3. Desbloquear iPhone

### Paso 5: Terminal 1 - Metro Bundler

```bash
npm start
```

**Espera a ver:** `Metro waiting on exp://...`

### Paso 6: Terminal 2 - Ejecutar en iPhone

```bash
npm run ios --device
```

---

## ✅ Verificación Rápida

Antes de ejecutar, verifica:

```bash
# Node.js
node --version  # Debe ser v18+

# Xcode
xcodebuild -version

# CocoaPods
pod --version

# Dispositivos iOS
xcrun xctrace list devices
```

---

## 🔄 Actualizar Código

Si haces cambios en Windows:

**En Windows:**
```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
git add .
git commit -m "Descripcion de cambios"
git push origin main
```

**En Mac:**
```bash
cd ~/appRunSkateRoller
git pull origin main
npm install
npm start              # Terminal 1
npm run ios --device   # Terminal 2
```

---

## 🛠️ Solución de Problemas

### Error: "CocoaPods not found"
```bash
sudo gem install cocoapods
```

### Error: "No devices found"
1. Verifica que el iPhone esté conectado por USB
2. Verifica que hayas tocado "Confiar" en el iPhone
3. Verifica que el iPhone esté desbloqueado
4. Ejecuta: `xcrun xctrace list devices`

### Error: "Metro bundler not running"
```bash
# En Terminal 1:
npm start

# Espera a ver "Metro waiting on..."
# Luego en Terminal 2:
npm run ios --device
```

---

## 📱 Conexión WiFi (Después de primera conexión USB)

```bash
# Usar el script automático
bash scripts/conectar-iphone-wifi.sh

# O manualmente en Xcode:
# Window > Devices and Simulators
# Seleccionar iPhone
# Marcar "Connect via network"
```

---

¡Listo para ejecutar en iPhone desde Mac! 🎉

