# Web + API por HTTPS (GPS en iPhone Safari). Requiere Node.js.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$proxyDir = Join-Path $PSScriptRoot 'https_dev_proxy'

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } |
  Select-Object -First 1).IPAddress
if (-not $ip) { $ip = '192.168.1.79' }

Write-Host ''
Write-Host '=== RunSkateRoller: modo HTTPS para GPS en móvil ===' -ForegroundColor Cyan
Write-Host "1) Backend en puerto 3001 (otra terminal): cd SIIG-ROLLER-BACKEND; npm run start"
Write-Host "2) Flutter web en 8080 (esta ventana, release)"
Write-Host "3) Proxy HTTPS en 8443 (npm)"
Write-Host ''
Write-Host "URL en el iPhone: https://${ip}:8443" -ForegroundColor Green
Write-Host ''

Set-Location $proxyDir
if (-not (Test-Path 'node_modules')) {
  npm install
}

$env:DEV_IP = $ip
Start-Process -NoNewWindow -FilePath 'node' -ArgumentList 'server.mjs' -WorkingDirectory $proxyDir

Set-Location $root
$local = Join-Path $root 'mapbox.local.env'
if (-not (Test-Path $local)) {
  Copy-Item (Join-Path $root 'mapbox.local.env.example') $local
}

flutter run -d web-server --release --web-hostname 0.0.0.0 --web-port 8080 --dart-define-from-file=mapbox.local.env
