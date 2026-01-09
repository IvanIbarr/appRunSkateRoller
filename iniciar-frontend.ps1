# Script para iniciar el frontend
Write-Host "🚀 Iniciando servidor frontend..." -ForegroundColor Green
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

Write-Host "📦 Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🌐 Iniciando servidor web..." -ForegroundColor Cyan
Write-Host "   El servidor se abrirá en http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar el servidor web
try {
    npm run web
} catch {
    Write-Host ""
    Write-Host "❌ Error al iniciar el servidor:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Verifica:" -ForegroundColor Yellow
    Write-Host "   1. Que Node.js esté instalado (node --version)" -ForegroundColor Yellow
    Write-Host "   2. Que las dependencias estén instaladas (npm install)" -ForegroundColor Yellow
    Write-Host ""
    pause
}

