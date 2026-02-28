# Script para iniciar el backend
Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Green
Write-Host ""

# Cambiar al directorio del backend
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "src/server.js")) {
    Write-Host "❌ Error: No se encuentra src/server.js" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde el directorio SIIG-ROLLER-BACKEND" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar PostgreSQL
Write-Host "📊 Verificando PostgreSQL..." -ForegroundColor Cyan
try {
    $pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -eq 'Running') {
        Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL no está corriendo" -ForegroundColor Yellow
        Write-Host "   Iniciando PostgreSQL..." -ForegroundColor Yellow
        Start-Service postgresql-x64-16 -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "⚠️  No se pudo verificar PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Iniciando servidor Node.js..." -ForegroundColor Cyan
Write-Host "   Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar el servidor
try {
    node src/server.js
} catch {
    Write-Host ""
    Write-Host "❌ Error al iniciar el servidor:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Verifica:" -ForegroundColor Yellow
    Write-Host "   1. Que Node.js esté instalado (node --version)" -ForegroundColor Yellow
    Write-Host "   2. Que las dependencias estén instaladas (npm install)" -ForegroundColor Yellow
    Write-Host "   3. Que PostgreSQL esté corriendo" -ForegroundColor Yellow
    Write-Host ""
    pause
}

