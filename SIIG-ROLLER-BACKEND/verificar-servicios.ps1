# Script para verificar y diagnosticar servicios
Write-Host "🔍 DIAGNÓSTICO DE SERVICIOS`n" -ForegroundColor Cyan

# Verificar puertos
Write-Host "📊 PUERTOS:" -ForegroundColor Yellow
Write-Host "Puerto 3001 (Backend):"
$port3001 = netstat -ano | findstr :3001
if ($port3001) {
    Write-Host "  ✅ En uso" -ForegroundColor Green
    $port3001 | Select-Object -First 2
} else {
    Write-Host "  ❌ No está en uso" -ForegroundColor Red
}

Write-Host "`nPuerto 3000 (Frontend):"
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    Write-Host "  ✅ En uso" -ForegroundColor Green
    $port3000 | Select-Object -First 2
} else {
    Write-Host "  ❌ No está en uso" -ForegroundColor Red
}

# Verificar conexiones HTTP
Write-Host "`n🌐 CONEXIONES HTTP:" -ForegroundColor Yellow
Write-Host "Backend (http://localhost:3001/health):"
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 3
    Write-Host "  ✅ Responde: $($backend.StatusCode)" -ForegroundColor Green
    Write-Host "  Contenido: $($backend.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ No responde: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nFrontend (http://localhost:3000):"
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3
    Write-Host "  ✅ Responde: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ No responde: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar procesos Node
Write-Host "`n📦 PROCESOS NODE.JS:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  ✅ Encontrados: $($nodeProcesses.Count) procesos" -ForegroundColor Green
    $nodeProcesses | Format-Table Id, ProcessName, StartTime -AutoSize
} else {
    Write-Host "  ❌ No hay procesos Node.js corriendo" -ForegroundColor Red
}

Write-Host "`n💡 RECOMENDACIONES:" -ForegroundColor Cyan
if (-not $port3001) {
    Write-Host "  - Inicia el backend: cd SIIG-ROLLER-BACKEND; node src/server.js" -ForegroundColor Yellow
}
if (-not $port3000) {
    Write-Host "  - Inicia el frontend: cd SIIG-ROLLER-FRONT; npm run web" -ForegroundColor Yellow
}

