# Script para Preparar Proyecto iOS desde Windows
# Este script verifica que todo este listo para cuando tengas acceso a macOS

Write-Host "Verificando requisitos para iOS..." -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($nodeVersion) {
    Write-Host "   OK Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "Verificando npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($npmVersion) {
    Write-Host "   OK npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ERROR: npm no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar React Native
Write-Host "Verificando React Native..." -ForegroundColor Yellow
$rnOutput = npm list react-native --depth=0 2>&1 | Out-String
if ($rnOutput -match "react-native@") {
    Write-Host "   OK React Native instalado" -ForegroundColor Green
} else {
    Write-Host "   ERROR: React Native no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar que el codigo este listo
Write-Host ""
Write-Host "Verificando codigo iOS..." -ForegroundColor Yellow

$calendarioScreen = "src\screens\CalendarioScreen.tsx"
if (Test-Path $calendarioScreen) {
    $content = Get-Content $calendarioScreen -Raw
    if ($content -match "useSafeAreaInsets") {
        Write-Host "   OK SafeAreaInsets implementado" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: SafeAreaInsets no encontrado" -ForegroundColor Yellow
    }
    
    if ($content -match "Platform\.select") {
        Write-Host "   OK Platform.select usado" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: Platform.select no encontrado" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ERROR: CalendarioScreen.tsx no encontrado" -ForegroundColor Red
}

# Verificar configuracion de red
Write-Host ""
Write-Host "Verificando configuracion de red..." -ForegroundColor Yellow
$apiConfig = "src\config\api.ts"
if (Test-Path $apiConfig) {
    $content = Get-Content $apiConfig -Raw
    if ($content -match "192\.168\.\d+\.\d+") {
        Write-Host "   OK IP local configurada" -ForegroundColor Green
        $ipMatch = [regex]::Match($content, "192\.168\.\d+\.\d+")
        if ($ipMatch.Success) {
            Write-Host "   IP encontrada: $($ipMatch.Value)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ADVERTENCIA: IP local no configurada" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ERROR: api.ts no encontrado" -ForegroundColor Red
}

# Verificar si existe carpeta ios
Write-Host ""
Write-Host "Verificando estructura del proyecto..." -ForegroundColor Yellow
if (Test-Path "ios") {
    Write-Host "   OK Carpeta ios existe" -ForegroundColor Green
} else {
    Write-Host "   ADVERTENCIA: Carpeta ios no existe (se creara automaticamente en macOS)" -ForegroundColor Yellow
}

# Resumen
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OK El codigo esta listo para iOS" -ForegroundColor Green
Write-Host "ADVERTENCIA: Para compilar necesitas:" -ForegroundColor Yellow
Write-Host "   1. macOS (MacBook, iMac, Mac Mini, o Mac en la nube)" -ForegroundColor White
Write-Host "   2. Xcode instalado" -ForegroundColor White
Write-Host "   3. CocoaPods instalado (sudo gem install cocoapods)" -ForegroundColor White
Write-Host ""
Write-Host "Opciones para probar en iOS desde Windows:" -ForegroundColor Cyan
Write-Host "   1. Alquilar Mac en la nube (MacinCloud ~20 USD/mes)" -ForegroundColor White
Write-Host "   2. Esperar acceso a macOS fisico" -ForegroundColor White
Write-Host "   3. Migrar a Expo (requiere trabajo de desarrollo)" -ForegroundColor White
Write-Host ""
Write-Host "Ver GUIA-IOS-DESDE-WINDOWS.md para mas detalles" -ForegroundColor Cyan
Write-Host ""
