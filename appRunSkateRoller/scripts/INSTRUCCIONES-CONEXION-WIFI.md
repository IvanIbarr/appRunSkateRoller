# Instrucciones para Conectar iPhone por WiFi

## ⚠️ Limitación Importante

El script `conectar-iphone-wifi.sh` **solo funciona en macOS**. No se puede ejecutar directamente desde Windows.

## 📱 Requisitos

1. **macOS** (físico o en la nube)
2. **Xcode** instalado
3. **iPhone** con iOS 12 o superior
4. **Cable USB** (para la primera conexión)

## 🔧 Pasos para Ejecutar el Script

### Opción 1: Si tienes acceso a macOS

1. **Abre Terminal en macOS**

2. **Navega al proyecto:**
   ```bash
   cd "ruta/al/proyecto/SIIG-ROLLER-FRONT"
   ```

3. **Haz el script ejecutable:**
   ```bash
   chmod +x scripts/conectar-iphone-wifi.sh
   ```

4. **Ejecuta el script:**
   ```bash
   bash scripts/conectar-iphone-wifi.sh
   ```

5. **Sigue las instrucciones en pantalla:**
   - Conecta el iPhone por USB
   - Toca "Confiar en esta computadora" en el iPhone
   - El script habilitará la conexión WiFi

### Opción 2: Si usas Mac en la nube

1. **Conéctate al Mac remoto** (VNC, SSH, RDP)

2. **Sigue los mismos pasos** de la Opción 1

### Opción 3: Pasos Manuales (sin script)

Si el script no funciona, puedes hacerlo manualmente:

1. **Conecta el iPhone por USB** a la Mac

2. **Abre Xcode**

3. **Ve a:** `Window > Devices and Simulators` (o presiona `Cmd + Shift + 2`)

4. **Selecciona tu iPhone** en la lista de dispositivos

5. **Marca la casilla:** `Connect via network`

6. **Espera** a que aparezca el ícono de red (🌐) junto al iPhone

7. **Desconecta el cable USB** - El iPhone seguirá conectado por WiFi

8. **Verifica la conexión:**
   ```bash
   xcrun xctrace list devices
   ```
   Deberías ver tu iPhone con "(Network)" al lado

## 🚀 Después de Conectar por WiFi

Una vez que el iPhone esté conectado por WiFi, puedes ejecutar la app:

```bash
npm run ios --device
```

O especificar el dispositivo:

```bash
npm run ios --device="Nombre de tu iPhone"
```

## 🔍 Verificar Conexión

Para verificar que el iPhone está conectado:

```bash
# Listar dispositivos iOS
xcrun xctrace list devices

# O usando React Native CLI
npx react-native run-ios --device
```

## ❌ Solución de Problemas

### Error: "No se encontraron dispositivos iOS"

**Solución:**
1. Verifica que el iPhone esté desbloqueado
2. Verifica que hayas tocado "Confiar en esta computadora"
3. Desconecta y vuelve a conectar el cable USB
4. Reinicia el iPhone si es necesario

### Error: "Xcode no encontrado"

**Solución:**
1. Instala Xcode desde la App Store
2. Acepta la licencia: `sudo xcodebuild -license accept`
3. Instala las herramientas de línea de comandos:
   ```bash
   xcode-select --install
   ```

### Error: "No se pudo habilitar WiFi automáticamente"

**Solución:**
1. Usa los pasos manuales (Opción 3)
2. Asegúrate de que el iPhone y la Mac estén en la misma red WiFi
3. Verifica que el firewall de macOS permita conexiones

### El iPhone se desconecta después de un tiempo

**Solución:**
1. Esto es normal - reconecta cuando sea necesario
2. O mantén el cable USB conectado para conexión estable

## 📝 Notas Importantes

- **Primera conexión:** Siempre debe ser por USB
- **Misma red WiFi:** El iPhone y la Mac deben estar en la misma red
- **Firewall:** Asegúrate de que el firewall permita conexiones
- **Reconexión:** Si reinicias el iPhone o la Mac, necesitarás reconectar

## 🔄 Reconectar después de Reiniciar

Si reinicias el iPhone o la Mac:

1. **Conecta el iPhone por USB** (si no se conecta automáticamente por WiFi)
2. **Abre Xcode > Devices and Simulators**
3. **Verifica** que aparezca "Connect via network"
4. **O ejecuta el script nuevamente**

## ✅ Verificación desde Windows

Puedes verificar que los scripts estén correctamente formados ejecutando:

```powershell
.\scripts\verificar-script-ios.ps1
```

Este script verifica la estructura pero **no ejecuta** la conexión (solo funciona en macOS).

