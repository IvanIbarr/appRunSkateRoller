#!/bin/bash
# Script para ejecutar la app en iOS desde macOS
# Ejecutar este script cuando tengas acceso a macOS

echo "🍎 Preparando proyecto iOS..."
echo ""

# Verificar que estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script solo funciona en macOS"
    exit 1
fi

# Verificar Xcode
echo "🔍 Verificando Xcode..."
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo "   ✅ $XCODE_VERSION"
else
    echo "   ❌ Xcode no encontrado"
    echo "   📥 Instala Xcode desde la App Store"
    exit 1
fi

# Verificar CocoaPods
echo "🔍 Verificando CocoaPods..."
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo "   ✅ CocoaPods $POD_VERSION"
else
    echo "   ⚠️  CocoaPods no encontrado"
    echo "   📥 Instalando CocoaPods..."
    sudo gem install cocoapods
fi

# Verificar Node.js
echo "🔍 Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js $NODE_VERSION"
else
    echo "   ❌ Node.js no encontrado"
    exit 1
fi

# Verificar si existe carpeta ios
if [ ! -d "ios" ]; then
    echo ""
    echo "📁 Carpeta ios no existe. Creando proyecto iOS..."
    echo "   Esto puede tardar varios minutos..."
    
    # Crear proyecto iOS
    npx react-native init TempProject --skip-install
    if [ -d "TempProject/ios" ]; then
        cp -r TempProject/ios .
        rm -rf TempProject
        echo "   ✅ Carpeta ios creada"
    else
        echo "   ❌ Error al crear carpeta ios"
        exit 1
    fi
fi

# Instalar dependencias de CocoaPods
echo ""
echo "📦 Instalando dependencias de CocoaPods..."
cd ios
pod install
cd ..

# Verificar que Metro Bundler esté corriendo
echo ""
echo "🚀 Iniciando Metro Bundler en segundo plano..."
npm start &
METRO_PID=$!

# Esperar a que Metro esté listo
sleep 5

# Ejecutar en iOS
echo ""
echo "📱 Ejecutando app en iOS..."
echo "   Selecciona el simulador o dispositivo cuando aparezca"
echo ""

# Opción 1: Simulador (recomendado)
npm run ios

# Opción 2: Dispositivo físico (descomentar si prefieres)
# npm run ios --device

echo ""
echo "✅ App ejecutándose en iOS"
echo "   Metro Bundler PID: $METRO_PID"
echo "   Para detener Metro: kill $METRO_PID"

