# Script para limpiar todos los cachés de React Native
# Uso: .\limpiar-cache.ps1

Write-Host "Limpiando cachés de React Native..." -ForegroundColor Cyan
Write-Host ""

# Limpiar caché de Metro Bundler
Write-Host "1. Limpiando caché de Metro Bundler..." -ForegroundColor Yellow
Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\haste-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\react-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Temp\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   Caché de Metro limpiado" -ForegroundColor Green

# Limpiar watchman (si está instalado)
Write-Host "2. Limpiando Watchman..." -ForegroundColor Yellow
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all 2>$null
    Write-Host "   Watchman limpiado" -ForegroundColor Green
} else {
    Write-Host "   Watchman no instalado, omitiendo" -ForegroundColor Gray
}

# Limpiar caché de npm
Write-Host "3. Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "   Caché de npm limpiado" -ForegroundColor Green

# Limpiar node_modules y reinstalar (opcional, comentado por defecto)
# Write-Host "4. Limpiando node_modules..." -ForegroundColor Yellow
# Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
# Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
# npm install
# Write-Host "   node_modules reinstalado" -ForegroundColor Green

# Limpiar build de Android
Write-Host "4. Limpiando build de Android..." -ForegroundColor Yellow
if (Test-Path "android\build") {
    Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "   Build de Android limpiado" -ForegroundColor Green

# Limpiar Gradle cache (opcional)
Write-Host "5. Limpiando caché de Gradle (esto puede tomar tiempo)..." -ForegroundColor Yellow
if (Test-Path "$env:USERPROFILE\.gradle\caches") {
    Remove-Item -Path "$env:USERPROFILE\.gradle\caches" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "   Caché de Gradle limpiado" -ForegroundColor Green

Write-Host ""
Write-Host "Limpieza completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "   npm start -- --reset-cache" -ForegroundColor Yellow


