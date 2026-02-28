# Script para conectar ADB por WiFi al Moto G60
# Uso: .\conectar-adb-wifi.ps1

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$ADB = "$env:ANDROID_HOME\platform-tools\adb.exe"

# Verificar si ADB existe
if (-not (Test-Path $ADB)) {
    Write-Host "Error: No se encontro ADB en: $ADB" -ForegroundColor Red
    Write-Host "Asegurate de tener Android Studio instalado." -ForegroundColor Yellow
    exit 1
}

# IP de tu Moto G60 (cambiala si es diferente)
# Para obtenerla: Configuracion -> Acerca del telefono -> Estado -> Direccion IP
$DEVICE_IP = "192.168.1.68"

Write-Host ""
Write-Host "Conectando ADB por WiFi al Moto G60..." -ForegroundColor Cyan
Write-Host "   IP del dispositivo: $DEVICE_IP" -ForegroundColor Gray
Write-Host ""

# Intentar conectar
$connectResult = & $ADB connect "${DEVICE_IP}:5555" 2>&1

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Verificando conexion..." -ForegroundColor Green
Write-Host ""

$devices = & $ADB devices

Write-Host $devices

Write-Host ""
if ($devices -match "$DEVICE_IP:5555.*device") {
    Write-Host "Conexion exitosa! Tu Moto G60 esta conectado por WiFi." -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes ejecutar:" -ForegroundColor Cyan
    Write-Host "   npm start    (Terminal 1)" -ForegroundColor Yellow
    Write-Host "   npm run android    (Terminal 2)" -ForegroundColor Yellow
} else {
    Write-Host "No se pudo conectar al dispositivo." -ForegroundColor Red
    Write-Host ""
    Write-Host "Soluciones:" -ForegroundColor Yellow
    Write-Host "   1. Verifica que tu telefono y PC esten en la misma red WiFi" -ForegroundColor White
    Write-Host "   2. Verifica que la IP del telefono sea correcta: $DEVICE_IP" -ForegroundColor White
    Write-Host "   3. Si es la primera vez, conecta el cable USB y ejecuta: adb tcpip 5555" -ForegroundColor White
    Write-Host "   4. Verifica que el firewall no este bloqueando el puerto 5555" -ForegroundColor White
}

Write-Host ""
