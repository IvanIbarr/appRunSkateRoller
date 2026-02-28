# Script para iniciar el backend directamente y ver errores
Write-Host "=== INICIANDO BACKEND ===" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del backend
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verificar archivos
if (-not (Test-Path "src/server.js")) {
    Write-Host "ERROR: No se encuentra src/server.js" -ForegroundColor Red
    pause
    exit 1
}

# Verificar .env
if (-not (Test-Path ".env")) {
    Write-Host "ADVERTENCIA: No se encuentra .env" -ForegroundColor Yellow
    Write-Host "Usando valores por defecto:" -ForegroundColor Yellow
    Write-Host "  DB_HOST=localhost" -ForegroundColor Cyan
    Write-Host "  DB_PORT=5432" -ForegroundColor Cyan
    Write-Host "  DB_NAME=siig_roller_db" -ForegroundColor Cyan
    Write-Host "  DB_USER=postgres" -ForegroundColor Cyan
    Write-Host "  DB_PASSWORD=admin123" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Iniciando servidor..." -ForegroundColor Green
Write-Host "Puerto: 3001" -ForegroundColor Cyan
Write-Host "URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

# Iniciar el servidor
node src/server.js

