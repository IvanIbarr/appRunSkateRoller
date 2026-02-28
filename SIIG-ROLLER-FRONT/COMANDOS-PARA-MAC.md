# Comandos para Ejecutar en Mac

## 📋 Comandos Listos para Copiar y Pegar

Cuando tengas acceso a un Mac, ejecuta estos comandos en Terminal:

### Paso 1: Clonar Repositorio

```bash
# Navegar a donde quieras clonar (Desktop, Documents, etc.)
cd ~
# o
cd ~/Desktop
# o
cd ~/Documents

# Clonar el repositorio
git clone https://github.com/IvanIbarr/appRunSkateRoller.git

# Navegar al proyecto
cd appRunSkateRoller
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias de Node.js
npm install

# Verificar Node.js
node --version  # Debe ser v18+
npm --version
```

### Paso 3: Configurar iOS (Primera vez)

```bash
# Instalar CocoaPods (si no está instalado)
sudo gem install cocoapods

# La carpeta ios se creará automáticamente al ejecutar npm run ios
# Pero si quieres prepararla antes:
# cd ios
# pod install
# cd ..
```

### Paso 4: Conectar iPhone

1. **Conectar iPhone por USB** al Mac
2. **En el iPhone:** Tocar "Confiar en esta computadora"
3. **Desbloquear iPhone**

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

---

## 🔄 Actualizar Código

Si haces cambios en Windows y quieres probarlos en Mac:

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

## 📝 Comandos Completos (Todo en uno)

```bash
# Clonar e instalar todo
cd ~
git clone https://github.com/IvanIbarr/appRunSkateRoller.git
cd appRunSkateRoller
npm install
sudo gem install cocoapods

# Conectar iPhone por USB y confiar

# Terminal 1:
npm start

# Terminal 2:
npm run ios --device
```

---

## ✅ Checklist para Mac

- [ ] macOS instalado
- [ ] Xcode instalado (desde App Store)
- [ ] Node.js instalado (v18+)
- [ ] Repositorio clonado
- [ ] `npm install` ejecutado
- [ ] CocoaPods instalado
- [ ] iPhone conectado por USB
- [ ] "Confiar" tocado en iPhone
- [ ] Metro Bundler corriendo
- [ ] `npm run ios --device` ejecutado

---

¡Listo para ejecutar en iPhone desde Mac! 🎉

