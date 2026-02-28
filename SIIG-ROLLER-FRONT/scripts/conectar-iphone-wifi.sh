#!/bin/bash
# Script para conectar iPhone por WiFi desde macOS
# Requiere que el iPhone haya sido conectado por USB al menos una vez

echo "📱 Conectando iPhone por WiFi..."
echo ""

# Verificar que estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script solo funciona en macOS"
    exit 1
fi

# Verificar que Xcode esté instalado
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode no encontrado"
    exit 1
fi

# Verificar que el iPhone esté conectado por USB (primera vez)
echo "🔌 Paso 1: Conecta tu iPhone por USB"
echo "   - Conecta el cable USB al iPhone y a la Mac"
echo "   - En el iPhone, toca 'Confiar en esta computadora'"
echo ""
read -p "¿Ya conectaste el iPhone por USB? (s/n): " respuesta

if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
    echo "❌ Por favor conecta el iPhone por USB primero"
    exit 1
fi

# Verificar dispositivos conectados
echo ""
echo "🔍 Buscando dispositivos iOS..."
DEVICES=$(xcrun xctrace list devices 2>&1 | grep -i "iphone\|ipad" | head -n 5)

if [ -z "$DEVICES" ]; then
    echo "❌ No se encontraron dispositivos iOS"
    echo "   Asegúrate de que:"
    echo "   1. El iPhone esté conectado por USB"
    echo "   2. Hayas tocado 'Confiar en esta computadora'"
    echo "   3. El iPhone esté desbloqueado"
    exit 1
fi

echo "✅ Dispositivos encontrados:"
echo "$DEVICES"
echo ""

# Obtener UDID del dispositivo
echo "📱 Selecciona tu iPhone de la lista anterior"
read -p "Ingresa el UDID de tu iPhone (o presiona Enter para usar el primero): " UDID

if [ -z "$UDID" ]; then
    UDID=$(echo "$DEVICES" | head -n 1 | awk '{print $NF}' | tr -d '()')
fi

# Habilitar conexión WiFi
echo ""
echo "🌐 Habilitando conexión WiFi para el iPhone..."
xcrun devicectl device info wifi --device "$UDID" --enable 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Conexión WiFi habilitada"
    echo ""
    echo "📱 Ahora puedes desconectar el cable USB"
    echo "   El iPhone seguirá conectado por WiFi"
    echo ""
    echo "🚀 Para ejecutar la app:"
    echo "   npm run ios --device"
else
    echo "⚠️  No se pudo habilitar WiFi automáticamente"
    echo ""
    echo "📱 Pasos manuales:"
    echo "   1. En Xcode: Window > Devices and Simulators"
    echo "   2. Selecciona tu iPhone"
    echo "   3. Marca 'Connect via network'"
    echo "   4. Espera a que aparezca el ícono de red"
    echo ""
    echo "🚀 Luego ejecuta:"
    echo "   npm run ios --device"
fi

