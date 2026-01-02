#!/bin/bash
# Script simplificado para ejecutar la app directamente en iPhone
# Ejecutar desde macOS cuando el iPhone esté conectado

echo "📱 Ejecutando SIIG Roller en iPhone..."
echo ""

# Verificar que estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script solo funciona en macOS"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado"
    echo "   Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ No se encuentra package.json"
    echo "   Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

# Verificar dispositivos iOS
echo "🔍 Buscando dispositivos iOS..."
DEVICES=$(xcrun xctrace list devices 2>&1 | grep -i "iphone\|ipad" | grep -v "Simulator")

if [ -z "$DEVICES" ]; then
    echo "⚠️  No se encontraron dispositivos iOS físicos"
    echo ""
    echo "📱 Pasos para conectar tu iPhone:"
    echo "   1. Conecta tu iPhone por USB a la Mac"
    echo "   2. En el iPhone, toca 'Confiar en esta computadora'"
    echo "   3. Asegúrate de que el iPhone esté desbloqueado"
    echo ""
    read -p "¿Ya conectaste tu iPhone? (s/n): " respuesta
    
    if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
        echo "❌ Por favor conecta tu iPhone primero"
        exit 1
    fi
    
    # Verificar nuevamente
    DEVICES=$(xcrun xctrace list devices 2>&1 | grep -i "iphone\|ipad" | grep -v "Simulator")
    if [ -z "$DEVICES" ]; then
        echo "❌ Aún no se detecta el iPhone"
        echo "   Verifica la conexión USB y que hayas tocado 'Confiar'"
        exit 1
    fi
fi

echo "✅ Dispositivos encontrados:"
echo "$DEVICES"
echo ""

# Verificar si existe carpeta ios
if [ ! -d "ios" ]; then
    echo "📁 Carpeta ios no existe. Creando proyecto iOS..."
    echo "   Esto puede tardar varios minutos..."
    
    # React Native creará la carpeta ios automáticamente
    echo "   Se creará al ejecutar npm run ios"
fi

# Verificar CocoaPods
if [ -d "ios" ]; then
    echo "📦 Verificando CocoaPods..."
    if ! command -v pod &> /dev/null; then
        echo "⚠️  CocoaPods no encontrado"
        echo "   Instalando CocoaPods..."
        sudo gem install cocoapods
    fi
    
    if [ ! -f "ios/Podfile.lock" ]; then
        echo "📦 Instalando dependencias de CocoaPods..."
        cd ios
        pod install
        cd ..
    fi
fi

# Verificar que Metro Bundler no esté corriendo
echo ""
echo "🔍 Verificando Metro Bundler..."
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Metro Bundler ya está corriendo"
else
    echo "⚠️  Metro Bundler no está corriendo"
    echo ""
    echo "📝 IMPORTANTE: Necesitas Metro Bundler corriendo"
    echo ""
    echo "Abre OTRA terminal y ejecuta:"
    echo "   npm start"
    echo ""
    echo "Espera a ver 'Metro waiting on...'"
    echo ""
    read -p "¿Ya está corriendo Metro Bundler? (s/n): " metro
    
    if [ "$metro" != "s" ] && [ "$metro" != "S" ]; then
        echo ""
        echo "🚀 Iniciando Metro Bundler en segundo plano..."
        npm start > /dev/null 2>&1 &
        METRO_PID=$!
        echo "   Metro Bundler iniciado (PID: $METRO_PID)"
        sleep 5
        echo "   Esperando a que Metro esté listo..."
        sleep 3
    fi
fi

# Ejecutar la app
echo ""
echo "🚀 Compilando e instalando la app en tu iPhone..."
echo "   Esto puede tardar 2-5 minutos la primera vez..."
echo ""

npm run ios --device

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡App instalada y ejecutándose en tu iPhone!"
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

