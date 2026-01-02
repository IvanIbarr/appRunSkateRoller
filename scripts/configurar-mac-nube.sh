#!/bin/bash
# Script para configurar Mac en la nube paso a paso
# Ejecutar cuando te conectes al Mac remoto

echo "🍎 Configurando Mac en la nube para desarrollo iOS..."
echo ""

# Verificar que estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script solo funciona en macOS"
    exit 1
fi

# Paso 1: Verificar/Instalar Homebrew
echo "📦 Paso 1: Verificando Homebrew..."
if ! command -v brew &> /dev/null; then
    echo "   Homebrew no encontrado. Instalando..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "   ✅ Homebrew ya está instalado"
    brew --version
fi

# Paso 2: Verificar/Instalar Node.js
echo ""
echo "📦 Paso 2: Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "   Node.js no encontrado. Instalando..."
    brew install node
else
    echo "   ✅ Node.js ya está instalado"
    node --version
fi

# Paso 3: Verificar Xcode
echo ""
echo "📦 Paso 3: Verificando Xcode..."
if ! command -v xcodebuild &> /dev/null; then
    echo "   ❌ Xcode no encontrado"
    echo "   📥 Instala Xcode desde la App Store"
    echo "   Luego ejecuta: xcode-select --install"
    exit 1
else
    echo "   ✅ Xcode encontrado"
    xcodebuild -version | head -n 1
fi

# Paso 4: Instalar Xcode Command Line Tools
echo ""
echo "📦 Paso 4: Verificando Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo "   Instalando Xcode Command Line Tools..."
    xcode-select --install
    echo "   ⚠️  Espera a que termine la instalación y presiona Enter..."
    read
else
    echo "   ✅ Xcode Command Line Tools instalados"
fi

# Paso 5: Aceptar licencia de Xcode
echo ""
echo "📦 Paso 5: Aceptando licencia de Xcode..."
sudo xcodebuild -license accept

# Paso 6: Verificar/Instalar CocoaPods
echo ""
echo "📦 Paso 6: Verificando CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo "   CocoaPods no encontrado. Instalando..."
    sudo gem install cocoapods
else
    echo "   ✅ CocoaPods ya está instalado"
    pod --version
fi

# Resumen
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ CONFIGURACIÓN COMPLETA"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Herramientas instaladas:"
echo "  ✅ Homebrew"
echo "  ✅ Node.js"
echo "  ✅ Xcode"
echo "  ✅ CocoaPods"
echo ""
echo "Próximos pasos:"
echo "  1. Subir el proyecto al Mac (Git, SFTP, etc.)"
echo "  2. cd al directorio del proyecto"
echo "  3. npm install"
echo "  4. cd ios && pod install && cd .."
echo "  5. npm start (Terminal 1)"
echo "  6. npm run ios --device (Terminal 2)"
echo ""

