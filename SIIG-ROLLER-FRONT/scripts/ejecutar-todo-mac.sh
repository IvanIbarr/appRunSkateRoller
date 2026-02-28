#!/bin/bash
# Script completo para ejecutar la app en iPhone desde Mac
# Ejecutar este script cuando tengas acceso a macOS

echo "🍎 Configurando y ejecutando SIIG Roller en iPhone..."
echo ""

# Verificar que estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script solo funciona en macOS"
    exit 1
fi

# Paso 1: Verificar/Clonar repositorio
echo "📦 Paso 1: Verificando repositorio..."
if [ ! -d "appRunSkateRoller" ]; then
    echo "   Clonando repositorio desde GitHub..."
    git clone https://github.com/IvanIbarr/appRunSkateRoller.git
    if [ $? -ne 0 ]; then
        echo "   ❌ Error al clonar repositorio"
        exit 1
    fi
    echo "   ✅ Repositorio clonado"
else
    echo "   ✅ Repositorio ya existe"
fi

cd appRunSkateRoller

# Paso 2: Instalar dependencias Node.js
echo ""
echo "📦 Paso 2: Instalando dependencias Node.js..."
if [ ! -d "node_modules" ]; then
    echo "   Ejecutando npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo "   ❌ Error al instalar dependencias"
        exit 1
    fi
    echo "   ✅ Dependencias instaladas"
else
    echo "   ✅ Dependencias ya instaladas"
fi

# Paso 3: Verificar Node.js
echo ""
echo "📦 Paso 3: Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "   ❌ Node.js no encontrado"
    echo "   📥 Instala Node.js desde: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js $NODE_VERSION"
fi

# Paso 4: Verificar Xcode
echo ""
echo "📦 Paso 4: Verificando Xcode..."
if ! command -v xcodebuild &> /dev/null; then
    echo "   ❌ Xcode no encontrado"
    echo "   📥 Instala Xcode desde la App Store"
    exit 1
else
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo "   ✅ $XCODE_VERSION"
fi

# Paso 5: Instalar CocoaPods
echo ""
echo "📦 Paso 5: Verificando CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo "   CocoaPods no encontrado. Instalando..."
    sudo gem install cocoapods
    if [ $? -ne 0 ]; then
        echo "   ❌ Error al instalar CocoaPods"
        exit 1
    fi
    echo "   ✅ CocoaPods instalado"
else
    POD_VERSION=$(pod --version)
    echo "   ✅ CocoaPods $POD_VERSION"
fi

# Paso 6: Verificar dispositivos iOS
echo ""
echo "📱 Paso 6: Verificando dispositivos iOS..."
DEVICES=$(xcrun xctrace list devices 2>&1 | grep -i "iphone\|ipad" | grep -v "Simulator")

if [ -z "$DEVICES" ]; then
    echo "   ⚠️  No se encontraron dispositivos iOS físicos"
    echo ""
    echo "   📱 Pasos para conectar tu iPhone:"
    echo "      1. Conecta tu iPhone por USB a la Mac"
    echo "      2. En el iPhone, toca 'Confiar en esta computadora'"
    echo "      3. Asegúrate de que el iPhone esté desbloqueado"
    echo ""
    read -p "   ¿Ya conectaste tu iPhone? (s/n): " respuesta
    
    if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
        echo "   ❌ Por favor conecta tu iPhone primero"
        exit 1
    fi
    
    # Verificar nuevamente
    DEVICES=$(xcrun xctrace list devices 2>&1 | grep -i "iphone\|ipad" | grep -v "Simulator")
    if [ -z "$DEVICES" ]; then
        echo "   ❌ Aún no se detecta el iPhone"
        echo "   Verifica la conexión USB y que hayas tocado 'Confiar'"
        exit 1
    fi
fi

echo "   ✅ Dispositivos encontrados:"
echo "$DEVICES"
echo ""

# Paso 7: Configurar iOS (si es necesario)
echo "📦 Paso 7: Configurando proyecto iOS..."
if [ ! -d "ios" ]; then
    echo "   La carpeta ios se creará automáticamente al ejecutar npm run ios"
else
    if [ ! -f "ios/Podfile.lock" ]; then
        echo "   Instalando dependencias de CocoaPods..."
        cd ios
        pod install
        cd ..
        if [ $? -ne 0 ]; then
            echo "   ⚠️  Error al instalar CocoaPods, pero continuaremos"
        else
            echo "   ✅ CocoaPods instalado"
        fi
    else
        echo "   ✅ Dependencias iOS ya instaladas"
    fi
fi

# Paso 8: Verificar Metro Bundler
echo ""
echo "📦 Paso 8: Verificando Metro Bundler..."
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Metro Bundler ya está corriendo"
else
    echo "   ⚠️  Metro Bundler no está corriendo"
    echo ""
    echo "   🚀 Iniciando Metro Bundler en segundo plano..."
    npm start > /dev/null 2>&1 &
    METRO_PID=$!
    echo "   Metro Bundler iniciado (PID: $METRO_PID)"
    echo "   Esperando a que Metro esté listo..."
    sleep 8
    echo "   ✅ Metro Bundler listo"
fi

# Paso 9: Ejecutar en iPhone
echo ""
echo "🚀 Paso 9: Compilando e instalando la app en tu iPhone..."
echo "   Esto puede tardar 2-5 minutos la primera vez..."
echo ""

npm run ios --device

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "✅ ¡APP INSTALADA Y EJECUTÁNDOSE EN TU IPHONE!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "📱 La app debería abrirse automáticamente en tu iPhone"
    echo "   Si no se abre, búscala manualmente en tu iPhone"
    echo ""
    echo "💡 Tips:"
    echo "   - Mantén Metro Bundler corriendo para ver cambios en tiempo real"
    echo "   - Presiona 'R' en Metro Bundler para recargar la app"
    echo "   - Presiona 'Cmd + D' en el iPhone para abrir el menú de desarrollo"
else
    echo ""
    echo "❌ Error al ejecutar la app"
    echo ""
    echo "🔍 Verifica:"
    echo "   1. Que Metro Bundler esté corriendo (npm start)"
    echo "   2. Que el iPhone esté conectado y confiado"
    echo "   3. Que Xcode esté instalado"
    echo "   4. Revisa los errores en la terminal de arriba"
fi

