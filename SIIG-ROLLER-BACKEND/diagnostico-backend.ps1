# Script de diagnóstico del backend
Write-Host "=== DIAGNÓSTICO DEL BACKEND ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js NO está instalado" -ForegroundColor Red
    exit 1
}

# 2. Verificar directorio
Write-Host "2. Verificando archivos..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

if (Test-Path "src/server.js") {
    Write-Host "   ✅ server.js existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ server.js NO existe" -ForegroundColor Red
    exit 1
}

if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules NO existe - ejecuta: npm install" -ForegroundColor Yellow
}

# 3. Verificar puerto
Write-Host "3. Verificando puerto 3001..." -ForegroundColor Yellow
$port = netstat -ano | findstr :3001
if ($port) {
    Write-Host "   ⚠️  Puerto 3001 en uso:" -ForegroundColor Yellow
    $port | ForEach-Object { Write-Host "      $_" -ForegroundColor White }
} else {
    Write-Host "   ✅ Puerto 3001 disponible" -ForegroundColor Green
}

# 4. Verificar PostgreSQL
Write-Host "4. Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and ($pgService | Where-Object { $_.Status -eq 'Running' })) {
    Write-Host "   ✅ PostgreSQL está corriendo" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  PostgreSQL NO está corriendo" -ForegroundColor Yellow
}

# 5. Verificar .env
Write-Host "5. Verificando configuración..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ Archivo .env existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Archivo .env NO existe (usará valores por defecto)" -ForegroundColor Yellow
    Write-Host "      DB_HOST=localhost" -ForegroundColor Cyan
    Write-Host "      DB_PORT=5432" -ForegroundColor Cyan
    Write-Host "      DB_NAME=siig_roller_db" -ForegroundColor Cyan
    Write-Host "      DB_USER=postgres" -ForegroundColor Cyan
    Write-Host "      DB_PASSWORD=admin123" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== INTENTANDO INICIAR BACKEND ===" -ForegroundColor Cyan
Write-Host ""

# Intentar iniciar el servidor
try {
    node src/server.js
} catch {
    Write-Host ""
    Write-Host "❌ Error al iniciar:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    pause
}

