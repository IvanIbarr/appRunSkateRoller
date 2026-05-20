# Build de release RunSkateRoller (Web / Android / iOS)
# Uso:
#   .\scripts\build_release.ps1 -Platform web
#   .\scripts\build_release.ps1 -Platform android
#   .\scripts\build_release.ps1 -Platform ios
#   .\scripts\build_release.ps1 -Platform all
#
# Requiere `release.local.env` (copia desde release.local.env.example).

param(
  [ValidateSet('web', 'android', 'ios', 'all')]
  [string]$Platform = 'web',
  [string]$EnvFile = 'release.local.env',
  [string]$WebOutput = 'build/web',
  [string]$ApkOutput = 'build/app/outputs/flutter-apk'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envPath = Join-Path $root $EnvFile
if (-not (Test-Path $envPath)) {
  $example = Join-Path $root 'release.local.env.example'
  Write-Error "Falta $EnvFile. Copia desde release.local.env.example y configura API_BASE_URL y Mapbox."
}

$defineArgs = @('--dart-define-from-file', $EnvFile)
$version = (Select-String -Path (Join-Path $root 'pubspec.yaml') -Pattern '^version:\s*(.+)$').Matches.Groups[1].Value.Trim()
Write-Host "RunSkateRoller release — version $version — platform: $Platform" -ForegroundColor Cyan

function Invoke-FlutterBuild {
  param([string[]]$Args)
  Write-Host "flutter $($Args -join ' ')" -ForegroundColor DarkGray
  & flutter @Args
  if ($LASTEXITCODE -ne 0) { throw "flutter falló con código $LASTEXITCODE" }
}

function Build-Web {
  Invoke-FlutterBuild @('pub', 'get')
  Invoke-FlutterBuild @('build', 'web', '--release') + $defineArgs + @('--base-href', '/')
  Write-Host "Web listo: $root\$WebOutput" -ForegroundColor Green
}

function Build-Android {
  Invoke-FlutterBuild @('pub', 'get')
  Invoke-FlutterBuild @('build', 'apk', '--release') + $defineArgs
  Invoke-FlutterBuild @('build', 'appbundle', '--release') + $defineArgs
  Write-Host "APK/AAB en: $root\$ApkOutput" -ForegroundColor Green
}

function Build-iOS {
  if ($IsWindows -or $env:OS -match 'Windows') {
    Write-Warning "iOS release requiere macOS + Xcode. En Windows solo se valida el proyecto:"
    Invoke-FlutterBuild @('pub', 'get')
    Invoke-FlutterBuild @('analyze')
    Write-Host "En Mac: flutter build ios --release --dart-define-from-file=release.local.env" -ForegroundColor Yellow
    return
  }
  Invoke-FlutterBuild @('pub', 'get')
  Invoke-FlutterBuild @('build', 'ios', '--release') + $defineArgs
  Write-Host "iOS listo. Abre ios/Runner.xcworkspace en Xcode para Archive." -ForegroundColor Green
}

switch ($Platform) {
  'web' { Build-Web }
  'android' { Build-Android }
  'ios' { Build-iOS }
  'all' {
    Build-Web
    Build-Android
    Build-iOS
  }
}
