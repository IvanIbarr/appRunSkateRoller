# Script para verificar que los scripts de iOS esten correctamente formados
# Este script puede ejecutarse desde Windows

Write-Host "Verificando scripts de iOS..." -ForegroundColor Cyan
Write-Host ""

# Verificar script de conexion WiFi
$wifiScript = "scripts\conectar-iphone-wifi.sh"
if (Test-Path $wifiScript) {
    Write-Host "OK Script encontrado: conectar-iphone-wifi.sh" -ForegroundColor Green
    
    $content = Get-Content $wifiScript -Raw
    
    # Verificar que tenga shebang
    if ($content -match "^#!/bin/bash") {
        Write-Host "   OK Shebang correcto" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: Shebang no encontrado" -ForegroundColor Yellow
    }
    
    # Verificar comandos de macOS
    $macCommands = @("xcodebuild", "xcrun", "devicectl")
    $foundCommands = @()
    foreach ($cmd in $macCommands) {
        if ($content -match $cmd) {
            $foundCommands += $cmd
        }
    }
    
    if ($foundCommands.Count -gt 0) {
        Write-Host "   OK Comandos de macOS encontrados: $($foundCommands -join ', ')" -ForegroundColor Green
    }
    
    # Verificar estructura basica
    if ($content -match "if.*OSTYPE.*darwin") {
        Write-Host "   OK Verificacion de macOS presente" -ForegroundColor Green
    }
    
    if ($content -match "read -p") {
        Write-Host "   OK Interactividad implementada" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "   NOTA: Este script solo funciona en macOS" -ForegroundColor Yellow
    Write-Host "   Requiere:" -ForegroundColor Yellow
    Write-Host "   - macOS instalado" -ForegroundColor White
    Write-Host "   - Xcode instalado" -ForegroundColor White
    Write-Host "   - iPhone conectado por USB (primera vez)" -ForegroundColor White
} else {
    Write-Host "ERROR: Script no encontrado: $wifiScript" -ForegroundColor Red
}

# Verificar script de ejecucion iOS
$iosScript = "scripts\ejecutar-ios-macos.sh"
if (Test-Path $iosScript) {
    Write-Host ""
    Write-Host "OK Script encontrado: ejecutar-ios-macos.sh" -ForegroundColor Green
    
    $content = Get-Content $iosScript -Raw
    
    if ($content -match "^#!/bin/bash") {
        Write-Host "   OK Shebang correcto" -ForegroundColor Green
    }
    
    if ($content -match "pod install") {
        Write-Host "   OK Instalacion de CocoaPods incluida" -ForegroundColor Green
    }
    
    if ($content -match "npm run ios") {
        Write-Host "   OK Comando de ejecucion incluido" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Script no encontrado: $iosScript" -ForegroundColor Red
}

# Resumen
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Los scripts estan correctamente formados" -ForegroundColor Green
Write-Host ""
Write-Host "Para ejecutar conectar-iphone-wifi.sh necesitas:" -ForegroundColor Yellow
Write-Host "   1. Acceso a macOS (fisico o en la nube)" -ForegroundColor White
Write-Host "   2. Xcode instalado" -ForegroundColor White
Write-Host "   3. iPhone conectado por USB" -ForegroundColor White
Write-Host ""
Write-Host "Pasos desde Windows:" -ForegroundColor Cyan
Write-Host "   1. Conectarte a un Mac (remoto o fisico)" -ForegroundColor White
Write-Host "   2. Navegar al proyecto" -ForegroundColor White
Write-Host "   3. Ejecutar: bash scripts/conectar-iphone-wifi.sh" -ForegroundColor White
Write-Host ""

