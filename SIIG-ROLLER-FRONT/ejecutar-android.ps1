# Script para ejecutar la app en Android
Write-Host "=== EJECUTANDO APP EN ANDROID ===" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del frontend
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encuentra package.json" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde el directorio SIIG-ROLLER-FRONT" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar dispositivo Android
Write-Host "1. Verificando dispositivo Android..." -ForegroundColor Yellow
$devices = adb devices
$deviceCount = ($devices | Select-String "device$" | Measure-Object).Count

if ($deviceCount -eq 0) {
    Write-Host "❌ No se encontró ningún dispositivo Android conectado" -ForegroundColor Red
    Write-Host ""
    Write-Host "INSTRUCCIONES:" -ForegroundColor Yellow
    Write-Host "1. Conecta tu teléfono Moto G32 con cable USB" -ForegroundColor White
    Write-Host "2. En el teléfono, activa 'Opciones de desarrollador':" -ForegroundColor White
    Write-Host "   - Ve a Configuración > Acerca del teléfono" -ForegroundColor Cyan
    Write-Host "   - Toca 7 veces en 'Número de compilación'" -ForegroundColor Cyan
    Write-Host "3. Activa 'Depuración USB' en Opciones de desarrollador" -ForegroundColor White
    Write-Host "4. Conecta el cable y acepta el diálogo de 'Permitir depuración USB'" -ForegroundColor White
    Write-Host ""
    Write-Host "Luego ejecuta este script nuevamente" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Dispositivo Android detectado" -ForegroundColor Green
Write-Host ""

# Verificar backend
Write-Host "2. Verificando backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 3
    Write-Host "✅ Backend funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend no responde en http://localhost:3001" -ForegroundColor Red
    Write-Host ""
    Write-Host "IMPORTANTE: El backend debe estar corriendo antes de ejecutar la app" -ForegroundColor Yellow
    Write-Host "Inicia el backend en otra ventana de PowerShell:" -ForegroundColor Cyan
    Write-Host "  cd '..\SIIG-ROLLER-BACKEND'" -ForegroundColor White
    Write-Host "  node src/server.js" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host ""

# Verificar IP configurada
Write-Host "3. Verificando configuración de red..." -ForegroundColor Yellow
$ipConfig = ipconfig | Select-String -Pattern "IPv4"
$currentIP = $ipConfig | ForEach-Object { if ($_ -match "(\d+\.\d+\.\d+\.\d+)") { $matches[1] } } | Select-Object -First 1

Write-Host "   IP actual de la laptop: $currentIP" -ForegroundColor Cyan
Write-Host "   IP configurada en api.ts: 192.168.1.76" -ForegroundColor Cyan

if ($currentIP -ne "192.168.1.76") {
    Write-Host ""
    Write-Host "⚠️  ADVERTENCIA: La IP no coincide" -ForegroundColor Yellow
    Write-Host "   Actualiza SIIG-ROLLER-FRONT/src/config/api.ts con la IP: $currentIP" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "¿Continuar de todos modos? (S/N)"
    if ($continue -ne "S" -and $continue -ne "s") {
        exit 1
    }
}

Write-Host ""

# Iniciar Metro Bundler si no está corriendo
Write-Host "4. Iniciando Metro Bundler..." -ForegroundColor Yellow
Write-Host "   (Presiona Ctrl+C en esta ventana para detener)" -ForegroundColor Cyan
Write-Host ""

# Ejecutar en Android
Write-Host "5. Ejecutando app en Android..." -ForegroundColor Yellow
Write-Host ""

try {
    npm run android
} catch {
    Write-Host ""
    Write-Host "❌ Error al ejecutar la app" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  - Que Android Studio esté instalado" -ForegroundColor White
    Write-Host "  - Que el dispositivo esté conectado y reconocido" -ForegroundColor White
    Write-Host "  - Que el backend esté corriendo" -ForegroundColor White
    Write-Host ""
    pause
}


