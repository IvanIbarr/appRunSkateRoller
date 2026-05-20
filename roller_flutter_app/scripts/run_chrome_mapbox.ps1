# Arranque Chrome con token Mapbox desde archivo local (no subas mapbox.local.env a git).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$local = Join-Path $root "mapbox.local.env"
$example = Join-Path $root "mapbox.local.env.example"
if (-not (Test-Path $local)) {
  if (Test-Path $example) {
    Copy-Item $example $local
    Write-Host "Creado $local — edítalo y pega MAPBOX_ACCESS_TOKEN=pk...." -ForegroundColor Yellow
  }
}

flutter run -d chrome --dart-define-from-file=mapbox.local.env
