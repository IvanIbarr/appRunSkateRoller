# Script para generar iconos de Android en diferentes tamaños
# Requiere ImageMagick instalado, o copia la imagen directamente

$imagenOrigen = "assets\app-icon.jpeg"
$directorios = @(
    @{nombre="mipmap-mdpi"; tamaño=48},
    @{nombre="mipmap-hdpi"; tamaño=72},
    @{nombre="mipmap-xhdpi"; tamaño=96},
    @{nombre="mipmap-xxhdpi"; tamaño=144},
    @{nombre="mipmap-xxxhdpi"; tamaño=192}
)

$androidResPath = "android\app\src\main\res"

# Verificar si existe ImageMagick
$magick = Get-Command magick -ErrorAction SilentlyContinue

if ($magick) {
    Write-Host "Usando ImageMagick para generar iconos..." -ForegroundColor Green
    
    foreach ($dir in $directorios) {
        $rutaCompleta = Join-Path $androidResPath $dir.nombre
        $rutaLauncher = Join-Path $rutaCompleta "ic_launcher.png"
        $rutaLauncherRound = Join-Path $rutaCompleta "ic_launcher_round.png"
        
        if (Test-Path $rutaCompleta) {
            $tamaño = $dir.tamaño
            # Generar icono cuadrado
            magick $imagenOrigen -resize "${tamaño}x${tamaño}" -background none -gravity center -extent "${tamaño}x${tamaño}" $rutaLauncher 2>&1 | Out-Null
            # Generar icono redondeado (para versiones recientes de Android)
            magick $imagenOrigen -resize "${tamaño}x${tamaño}" -background none -gravity center -extent "${tamaño}x${tamaño}" -alpha set -channel A -evaluate multiply 0.0 +channel -draw "roundrectangle 0,0,$tamaño,$tamaño,$($tamaño*0.25),$($tamaño*0.25)" $rutaLauncherRound 2>&1 | Out-Null
            
            Write-Host "Iconos generados para $($dir.nombre) (${tamaño}x${tamaño})" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "ImageMagick no encontrado. Copiando imagen directamente (requiere conversión manual a PNG)" -ForegroundColor Yellow
    Write-Host "Recomendación: Instala ImageMagick o usa Android Asset Studio online para generar los iconos correctamente" -ForegroundColor Yellow
    Write-Host "https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html" -ForegroundColor Cyan
}

Write-Host "`nPara generar iconos manualmente:" -ForegroundColor Green
Write-Host "1. Visita: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html" -ForegroundColor White
Write-Host "2. Sube la imagen: $imagenOrigen" -ForegroundColor White
Write-Host "3. Descarga el ZIP generado" -ForegroundColor White
Write-Host "4. Extrae los archivos en: $androidResPath" -ForegroundColor White
