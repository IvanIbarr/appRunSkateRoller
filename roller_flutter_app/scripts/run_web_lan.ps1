# RunSkateRoller — Web accesible en la red local (móvil por WiFi).
# El modo DEBUG deja pantalla en blanco en otros dispositivos; usamos --release.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$local = Join-Path $root 'mapbox.local.env'
if (-not (Test-Path $local)) {
  Copy-Item (Join-Path $root 'mapbox.local.env.example') $local
  Write-Host 'Edita mapbox.local.env con tu token Mapbox.' -ForegroundColor Yellow
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } |
  Select-Object -First 1).IPAddress

Write-Host ''
Write-Host 'RunSkateRoller Web (LAN)' -ForegroundColor Cyan
Write-Host "  PC:    http://localhost:8080"
if ($ip) { Write-Host "  Móvil: http://${ip}:8080  (misma WiFi)" -ForegroundColor Green }
Write-Host '  API:   puerto 3001 en el mismo host' -ForegroundColor DarkGray
Write-Host ''
Write-Host 'GPS en iPhone Safari: usa HTTPS → .\scripts\run_web_lan_https.ps1' -ForegroundColor Yellow
Write-Host ''

flutter run -d web-server `
  --release `
  --web-hostname 0.0.0.0 `
  --web-port 8080 `
  --dart-define-from-file=mapbox.local.env
