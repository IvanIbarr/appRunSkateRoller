# ⚠️ Comando: npm run ios --device

## ❌ NO se puede ejecutar desde Windows

El comando `npm run ios --device` **SOLO funciona en macOS**. No se puede ejecutar desde Windows.

---

## 🔍 ¿Por qué no funciona en Windows?

Este comando requiere:
- ✅ **Xcode** (solo disponible en macOS)
- ✅ **CocoaPods** (solo funciona en macOS/Linux)
- ✅ **Herramientas de compilación iOS** (solo en macOS)
- ✅ **Conexión a iPhone** (requiere Xcode)

Windows **NO tiene** estas herramientas disponibles.

---

## ✅ Cómo ejecutarlo (cuando tengas macOS)

### Opción 1: Desde Terminal en macOS

```bash
# 1. Abrir Terminal en macOS
#    (Presiona Cmd + Espacio, escribe "Terminal")

# 2. Navegar al proyecto
cd "/ruta/completa/al/proyecto/SIIG-ROLLER-FRONT"

# 3. Asegurarte de que Metro Bundler esté corriendo
#    (Abre otra terminal y ejecuta: npm start)

# 4. Ejecutar en iPhone
npm run ios --device
```

### Opción 2: Usar el script automático

```bash
# 1. Navegar al proyecto
cd "/ruta/completa/al/proyecto/SIIG-ROLLER-FRONT"

# 2. Hacer ejecutable
chmod +x scripts/ejecutar-en-iphone.sh

# 3. Ejecutar (el script hace todo automáticamente)
bash scripts/ejecutar-en-iphone.sh
```

---

## 📱 Requisitos antes de ejecutar

### En tu Mac:
1. ✅ **Xcode instalado** (desde App Store)
2. ✅ **CocoaPods instalado**: `sudo gem install cocoapods`
3. ✅ **Node.js instalado** (v18+)
4. ✅ **Proyecto clonado/descargado**

### En tu iPhone:
1. ✅ **Conectado por USB** (primera vez)
2. ✅ **"Confiar en esta computadora"** (tocado en el iPhone)
3. ✅ **iPhone desbloqueado**

### En el proyecto:
1. ✅ **Dependencias instaladas**: `npm install`
2. ✅ **CocoaPods instalado**: `cd ios && pod install`
3. ✅ **Metro Bundler corriendo**: `npm start` (en otra terminal)

---

## 🚀 Pasos completos en macOS

### Terminal 1: Metro Bundler
```bash
cd "/ruta/al/proyecto/SIIG-ROLLER-FRONT"
npm start
```
**Espera a ver:** `Metro waiting on exp://...`

### Terminal 2: Ejecutar en iPhone
```bash
cd "/ruta/al/proyecto/SIIG-ROLLER-FRONT"
npm run ios --device
```

**Lo que sucederá:**
1. Xcode compilará la app (2-5 minutos primera vez)
2. La app se instalará en tu iPhone
3. La app se abrirá automáticamente

---

## 🔄 Alternativas desde Windows

### Opción 1: Alquilar Mac en la nube
- **MacinCloud**: ~$20/mes
- **MacStadium**: ~$99/mes
- Conectarte remotamente y ejecutar los comandos

### Opción 2: Usar Mac físico
- Prestar/Compartir Mac de alguien
- Ejecutar los comandos directamente

### Opción 3: Probar en Android (desde Windows)
```powershell
# Esto SÍ funciona en Windows
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

---

## 📝 Comandos que SÍ funcionan en Windows

```powershell
# Verificar requisitos
node --version
npm --version

# Instalar dependencias
npm install

# Iniciar Metro Bundler
npm start

# Ejecutar en Android (si tienes Android Studio)
npm run android

# Ejecutar en web
npm run web
```

---

## 📝 Comandos que NO funcionan en Windows

```bash
# ❌ NO funciona en Windows
npm run ios --device
npm run ios
cd ios && pod install
xcrun xctrace list devices
bash scripts/conectar-iphone-wifi.sh
```

---

## ✅ Resumen

| Comando | Windows | macOS |
|---------|---------|-------|
| `npm start` | ✅ Sí | ✅ Sí |
| `npm run android` | ✅ Sí | ✅ Sí |
| `npm run web` | ✅ Sí | ✅ Sí |
| `npm run ios` | ❌ No | ✅ Sí |
| `npm run ios --device` | ❌ No | ✅ Sí |

---

## 🎯 Conclusión

**Para ejecutar `npm run ios --device` necesitas:**
1. ✅ Acceso a macOS (físico o en la nube)
2. ✅ Xcode instalado
3. ✅ iPhone conectado
4. ✅ Metro Bundler corriendo

**Desde Windows solo puedes:**
- ✅ Preparar el proyecto
- ✅ Verificar que todo esté listo
- ✅ Ejecutar en Android/Web
- ❌ NO ejecutar en iOS

---

## 📚 Ver también

- `GUIA-EJECUTAR-EN-IPHONE.md` - Guía completa paso a paso
- `GUIA-IOS-DESDE-WINDOWS.md` - Opciones desde Windows
- `scripts/ejecutar-en-iphone.sh` - Script automático para macOS

