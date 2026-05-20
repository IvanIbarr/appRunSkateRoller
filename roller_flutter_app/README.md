# RunSkateRoller (Flutter)

Cliente multiplataforma **Web · Android · iOS** para la comunidad roller.

## Inicio rápido (desarrollo)

```powershell
cd roller_flutter_app
flutter pub get
Copy-Item .env.example .env
# Edita .env con REACT_APP_MAPBOX_ACCESS_TOKEN=pk...

# Web
.\scripts\run_chrome_mapbox.ps1

# Backend en otra terminal (puerto 3001)
cd ..\SIIG-ROLLER-BACKEND
npm run start
```

## Release (producción)

Ver **[RELEASE.md](RELEASE.md)** y el script:

```powershell
Copy-Item release.local.env.example release.local.env
# Configura API_BASE_URL y Mapbox
.\scripts\build_release.ps1 -Platform web      # o android | ios
```

## Estructura

- `lib/src/app.dart` — GoRouter y shell principal
- `lib/src/core/network/api_config.dart` — URL del API (`API_BASE_URL`, `API_HOST`, `API_PORT`)
- `lib/src/core/maps/mapbox_service.dart` — Mapbox (paridad con React Native)

## Identificador

- Android / iOS: `com.siigroller` (mismo que `appRunSkateRoller`)
