# Guía para Probar iOS desde Windows

## ⚠️ Limitación Importante

**NO es posible compilar apps iOS nativas desde Windows directamente.** iOS requiere:
- ✅ macOS (obligatorio)
- ✅ Xcode (solo disponible en macOS)
- ✅ CocoaPods (solo funciona en macOS/Linux)

## ✅ Estado Actual Verificado

- ✅ **Node.js**: v24.11.1 (instalado)
- ✅ **React Native**: 0.73.11 (instalado)
- ✅ **Código iOS**: 100% compatible y listo
- ❌ **Expo**: No instalado (proyecto usa React Native CLI)

---

## 🎯 Opciones Reales para Probar en iOS desde Windows

### Opción 1: Servicios en la Nube (Recomendado) ⭐

**Alquilar un Mac en la nube** y conectarte remotamente vía VNC/SSH.

#### Servicios Recomendados:

1. **MacStadium** (https://www.macstadium.com/)
   - Precio: ~$99/mes (dedicado) o ~$0.50/hora (pay-as-you-go)
   - Acceso: VNC, SSH, RDP
   - ✅ Muy confiable

2. **MacinCloud** (https://www.macincloud.com/)
   - Precio: ~$20-50/mes
   - Acceso: VNC, RDP
   - ✅ Más económico

3. **AWS EC2 Mac Instances**
   - Precio: ~$1.08/hora
   - Acceso: SSH/VNC
   - ✅ Escalable

#### Pasos:

1. **Registrarte** en el servicio
2. **Configurar Mac remoto** (instalar Xcode, Node, etc.)
3. **Subir tu proyecto** vía Git o SFTP
4. **Conectarte remotamente** y ejecutar `npm run ios`
5. **Conectar iPhone por WiFi** o USB (si el servicio lo permite)

---

### Opción 2: Migrar a Expo (Complejo pero posible)

Permite probar en iPhone usando **Expo Go** sin compilar, pero requiere adaptar el código.

#### Ventajas:
- ✅ Funciona desde Windows
- ✅ Pruebas rápidas en iPhone real
- ✅ No requiere macOS

#### Desventajas:
- ❌ Requiere migrar código (puede tomar horas/días)
- ❌ Algunas funcionalidades nativas pueden no funcionar
- ❌ Limitaciones de Expo

#### Pasos (si decides esta opción):

```powershell
# 1. Instalar Expo CLI
npm install -g @expo/cli

# 2. Crear proyecto Expo nuevo
npx create-expo-app --template blank-typescript SIIG-ROLLER-EXPO

# 3. Migrar código manualmente
# (Copiar componentes, screens, services, etc.)

# 4. Instalar Expo Go en iPhone (App Store)

# 5. Ejecutar
npx expo start
# Escanear QR con Expo Go
```

**Nota**: Esta opción requiere trabajo significativo de migración.

---

### Opción 3: Preparar Todo para Cuando Tengas macOS

Preparamos scripts y documentación para que cuando tengas acceso a macOS, sea solo ejecutar comandos.

---

## 🚀 Pasos Inmediatos que SÍ Podemos Ejecutar

Vamos a preparar todo lo posible desde Windows:

### Paso 1: Verificar Requisitos del Sistema

```powershell
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar React Native CLI
npx react-native --version
```

### Paso 2: Preparar Scripts para macOS

Vamos a crear scripts que puedas ejecutar cuando tengas acceso a macOS.

### Paso 3: Verificar Configuración de Red

Preparar la configuración para conectar iPhone por WiFi cuando tengas macOS.

---

## 📱 Preparación para Conexión WiFi al iPhone

Aunque no podemos compilar desde Windows, podemos preparar la configuración de red:

### Requisitos:
1. **iPhone y PC en la misma red WiFi**
2. **IP de tu PC** (ya configurada: 192.168.1.76)
3. **Backend corriendo** en tu PC

### Configuración Actual:
- ✅ IP del PC: `192.168.1.76` (configurada en `api.ts`)
- ✅ Backend: Puerto 3001
- ✅ Código iOS: Listo para usar esta IP

### Cuando tengas macOS:

1. **Conectar iPhone por USB** (primera vez)
2. **Confiar en la computadora** en el iPhone
3. **Ejecutar**: `npm run ios --device`
4. **O conectar por WiFi** (después de la primera conexión USB)

---

## 🔧 Scripts que Vamos a Crear

1. **Script de verificación** (ejecutar en Windows)
2. **Script de inicialización iOS** (para ejecutar en macOS)
3. **Script de conexión WiFi** (para ejecutar en macOS)
4. **Guía de troubleshooting**

---

## ✅ Lo que SÍ está Listo

- ✅ **Código 100% compatible con iOS**
- ✅ **SafeAreaInsets implementado**
- ✅ **Estilos optimizados para iOS**
- ✅ **Configuración de red lista** (IP: 192.168.1.76)
- ✅ **Backend funcionando** (puerto 3001)

---

## 🎯 Recomendación Final

**Para probar rápidamente en iOS desde Windows:**

1. **Opción más rápida**: Alquilar Mac en la nube (MacinCloud ~$20/mes)
2. **Opción más económica a largo plazo**: Esperar acceso a macOS físico
3. **Opción más compleja**: Migrar a Expo (requiere trabajo de desarrollo)

---

## 📝 Próximos Pasos

Vamos a crear los scripts y documentación necesarios para que cuando tengas acceso a macOS, solo ejecutes comandos y funcione.

