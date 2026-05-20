# Copia token Mapbox desde .env a mapbox.local.env (prioriza REACT_APP como en RN).
Set-StrictMode -Version Latest
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$src = Join-Path $root ".env"
$dst = Join-Path $root "mapbox.local.env"
if (-not (Test-Path $src)) {
  Write-Error "No existe .env en $root"
  exit 1
}

$r = Select-String -Path $src -Pattern '^\s*REACT_APP_MAPBOX_ACCESS_TOKEN=' | Select-Object -First 1
$m = Select-String -Path $src -Pattern '^\s*MAPBOX_ACCESS_TOKEN=' | Select-Object -First 1

$line = $null
if ($r) { $line = $r.Line.Trim() }
elseif ($m) { $line = $m.Line.Trim() }

if (-not $line) {
  Write-Error "No se encontró REACT_APP_MAPBOX_ACCESS_TOKEN ni MAPBOX_ACCESS_TOKEN en .env"
  exit 1
}

@"
# Generado por scripts/sync_mapbox_to_local.ps1 — edita .env y vuelve a ejecutar el script si cambias el token.
$line
"@ | Set-Content -Encoding utf8 $dst

Write-Host "Escrito $dst" -ForegroundColor Green
