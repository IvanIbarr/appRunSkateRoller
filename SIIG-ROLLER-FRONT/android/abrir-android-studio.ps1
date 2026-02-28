# Script para abrir el proyecto en Android Studio
Write-Host "🚀 Abriendo proyecto en Android Studio..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en la carpeta android
$currentPath = Get-Location
if (-not $currentPath.Path.EndsWith("android")) {
    Write-Host "⚠️  Este script debe ejecutarse desde la carpeta android" -ForegroundColor Yellow
    Write-Host "   Cambiando a la carpeta android..." -ForegroundColor Cyan
    Set-Location "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT\android"
}

Write-Host "📂 Ubicación del proyecto:" -ForegroundColor Cyan
Write-Host "   $(Get-Location)" -ForegroundColor White
Write-Host ""

# Intentar encontrar Android Studio
$androidStudioPaths = @(
    "${env:LOCALAPPDATA}\Programs\Android\Android Studio\bin\studio64.exe",
    "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe",
    "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe"
)

$studioPath = $null
foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        $studioPath = $path
        break
    }
}

if ($studioPath) {
    Write-Host "✅ Android Studio encontrado en:" -ForegroundColor Green
    Write-Host "   $studioPath" -ForegroundColor White
    Write-Host ""
    Write-Host "📱 Abriendo proyecto..." -ForegroundColor Cyan
    
    # Abrir Android Studio con el proyecto actual
    Start-Process -FilePath $studioPath -ArgumentList "." -WorkingDirectory (Get-Location)
    
    Write-Host ""
    Write-Host "✅ Proyecto abierto en Android Studio" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Espera a que Android Studio sincronice el proyecto (puede tardar varios minutos)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "⚠️  Android Studio no encontrado en las ubicaciones comunes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "   1. Abre Android Studio manualmente" -ForegroundColor White
    Write-Host "   2. Selecciona: File > Open" -ForegroundColor White
    $currentLoc = Get-Location
    Write-Host "   3. Navega a: $currentLoc" -ForegroundColor White
    Write-Host ""
    Write-Host "   O abre el explorador de archivos en esta ubicacion:" -ForegroundColor Cyan
    Write-Host "   explorer ." -ForegroundColor White
    Write-Host ""
    
    # Abrir el explorador de archivos
    explorer .
}

Write-Host "📋 Verificando configuración del proyecto..." -ForegroundColor Cyan
Write-Host ""

# Verificar archivos importantes
$filesToCheck = @(
    @{Path = "build.gradle"; Name = "build.gradle principal"},
    @{Path = "app\build.gradle"; Name = "build.gradle de la app"},
    @{Path = "app\src\main\AndroidManifest.xml"; Name = "AndroidManifest.xml"},
    @{Path = "local.properties"; Name = "local.properties"}
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file.Path) {
        Write-Host "   ✅ $($file.Name) - OK" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($file.Name) - NO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Para mas informacion, consulta: ..\ABRIR-ANDROID-STUDIO.md" -ForegroundColor Cyan
Write-Host ""
