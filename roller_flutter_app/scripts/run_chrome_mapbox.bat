@echo off
cd /d "%~dp0.."
if not exist "mapbox.local.env" (
  if exist "mapbox.local.env.example" copy /Y "mapbox.local.env.example" "mapbox.local.env"
  echo Creado mapbox.local.env - edita y pega tu MAPBOX_ACCESS_TOKEN
)
flutter run -d chrome --dart-define-from-file=mapbox.local.env
