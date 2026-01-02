# Opción B: Ejecutar en iPhone desde Mac Físico

## ✅ Código en GitHub

El código ya está disponible en:
**https://github.com/IvanIbarr/appRunSkateRoller**

---

## 🖥️ Pasos para Mac Físico

### Paso 1: Clonar el Repositorio en Mac

```bash
# Abrir Terminal en Mac
cd ~
# o cd Desktop
# o cd Documents

# Clonar el repositorio
git clone https://github.com/IvanIbarr/appRunSkateRoller.git

# Navegar al proyecto
cd appRunSkateRoller
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias de Node.js
npm install

# Verificar que Node.js esté instalado
node --version  # Debe ser v18+
npm --version
```

### Paso 3: Configurar iOS (Primera vez)

```bash
# Instalar CocoaPods (si no está instalado)
sudo gem install cocoapods

# Navegar a carpeta ios (se creará automáticamente)
# Si no existe, React Native la creará al ejecutar npm run ios

# Instalar dependencias de CocoaPods
cd ios
pod install
cd ..
```

### Paso 4: Conectar iPhone

1. **Conectar iPhone por USB** al Mac
2. **En el iPhone:** Tocar "Confiar en esta computadora"
3. **Desbloquear iPhone** si está bloqueado
4. **Verificar conexión:**
   ```bash
   xcrun xctrace list devices
   ```
   Deberías ver tu iPhone en la lista

### Paso 5: Ejecutar la App

**Terminal 1: Metro Bundler**
```bash
cd ~/appRunSkateRoller
npm start
```

**Espera a ver:** `Metro waiting on exp://...`

**Terminal 2: Ejecutar en iPhone**
```bash
cd ~/appRunSkateRoller
npm run ios --device
```

**O usar el script automático:**
```bash
cd ~/appRunSkateRoller
chmod +x scripts/ejecutar-en-iphone.sh
bash scripts/ejecutar-en-iphone.sh
```

### Paso 6: Verificar que Funciona

1. **La app se instalará** en tu iPhone
2. **Se abrirá automáticamente**
3. **Deberías ver la pantalla de login**

---

## 🔄 Actualizar Código desde GitHub

Si haces cambios en Windows y quieres probarlos en Mac:

```bash
# En Mac, Terminal:
cd ~/appRunSkateRoller

# Obtener últimos cambios
git pull origin main

# Reinstalar dependencias si hay cambios en package.json
npm install

# Si hay cambios en iOS
cd ios
pod install
cd ..

# Ejecutar nuevamente
npm start              # Terminal 1
npm run ios --device   # Terminal 2
```

---

## 📱 Conexión WiFi (Después de primera conexión USB)

Una vez que hayas conectado el iPhone por USB al menos una vez:

```bash
# Usar el script automático
bash scripts/conectar-iphone-wifi.sh

# O manualmente en Xcode:
# Window > Devices and Simulators
# Seleccionar iPhone
# Marcar "Connect via network"
```

Después puedes desconectar el USB y el iPhone seguirá conectado por WiFi.

---

## 🛠️ Solución de Problemas

### Error: "iOS project folder not found"

```bash
# La carpeta ios se creará automáticamente
# Solo ejecuta:
npm run ios --device
```

### Error: "CocoaPods not found"

```bash
sudo gem install cocoapods
cd ios
pod install
cd ..
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

## ✅ Checklist Rápido

- [ ] Mac con macOS instalado
- [ ] Xcode instalado (desde App Store)
- [ ] Node.js instalado (v18+)
- [ ] Repositorio clonado desde GitHub
- [ ] `npm install` ejecutado
- [ ] `pod install` ejecutado (en carpeta ios)
- [ ] iPhone conectado por USB
- [ ] "Confiar en esta computadora" tocado en iPhone
- [ ] Metro Bundler corriendo (`npm start`)
- [ ] `npm run ios --device` ejecutado

---

## 🚀 Comandos Rápidos

```bash
# Clonar repositorio
git clone https://github.com/IvanIbarr/appRunSkateRoller.git
cd appRunSkateRoller

# Instalar todo
npm install
cd ios && pod install && cd ..

# Ejecutar (2 terminales)
npm start              # Terminal 1
npm run ios --device   # Terminal 2
```

---

## 📝 Notas Importantes

- **Primera vez:** La compilación puede tardar 2-5 minutos
- **Siguientes veces:** 30-60 segundos
- **Metro Bundler:** Manténlo corriendo mientras desarrollas
- **Actualizaciones:** Usa `git pull` para obtener cambios desde Windows

¡Listo para ejecutar en iPhone desde Mac! 🎉

