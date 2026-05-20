# RunSkateRoller — Release Web, Android e iOS

Guía para generar builds de producción del cliente Flutter (`roller_flutter_app`).

## Requisitos

| Herramienta | Web | Android | iOS |
|-------------|-----|---------|-----|
| Flutter SDK 3.11+ | Sí | Sí | Sí |
| Chrome (prueba local) | Sí | — | — |
| Android SDK + JDK 17 | — | Sí | — |
| Xcode 15+ (solo Mac) | — | — | Sí |
| Backend `SIIG-ROLLER-BACKEND` desplegado | Sí | Sí | Sí |

## 1. Configurar secretos (una vez)

```powershell
cd roller_flutter_app
Copy-Item release.local.env.example release.local.env
# Editar release.local.env:
#   API_BASE_URL=https://tu-api.ejemplo.com
#   REACT_APP_MAPBOX_ACCESS_TOKEN=pk....
```

`release.local.env` está en `.gitignore` (no subir tokens).

### Desarrollo local

| Plataforma | Comando |
|------------|---------|
| Web (Chrome) | `.\scripts\run_chrome_mapbox.ps1` o `flutter run -d chrome --dart-define-from-file=mapbox.local.env` |
| Android emulador | `flutter run --dart-define=API_HOST=10.0.2.2` |
| Android físico (misma WiFi) | `flutter run --dart-define=API_HOST=192.168.X.Y` |
| iOS simulador | `flutter run` (localhost vía host Mac) |

## 2. Builds de release

```powershell
cd roller_flutter_app
.\scripts\build_release.ps1 -Platform web
.\scripts\build_release.ps1 -Platform android
.\scripts\build_release.ps1 -Platform ios    # en Mac; en Windows solo analyze
```

Salidas:

| Plataforma | Carpeta / artefacto |
|------------|---------------------|
| Web | `build/web/` → subir a hosting estático (Nginx, Firebase, etc.) |
| Android APK | `build/app/outputs/flutter-apk/app-release.apk` |
| Android AAB (Play Store) | `build/app/outputs/bundle/release/app-release.aab` |
| iOS | `build/ios/` → Archive en Xcode |

## 3. Identificadores de app

| | Valor |
|---|--------|
| Nombre visible | **RunSkateRoller** |
| Android `applicationId` | `com.siigroller` (igual que React Native) |
| iOS Bundle ID | `com.siigroller` |

Antes de publicar en tiendas: configurar **firma release** (Android keystore, iOS certificados en Xcode). Hoy Android usa firma debug en `build.gradle.kts` solo para pruebas locales.

## 4. Backend en producción

1. Variables en `.env` del servidor (ver `SIIG-ROLLER-BACKEND/.env.example`).
2. `JWT_SECRET` fuerte (obligatorio).
3. `CORS_ORIGIN` con el dominio de la web/app.
4. HTTPS delante del API (reverse proxy).
5. PostgreSQL + carpeta `uploads/` persistente.

## 5. Web — despliegue

- El API en producción debe ser accesible desde el navegador (CORS + HTTPS).
- Si la app web está en `https://app.ejemplo.com` y el API en `https://api.ejemplo.com`, define `API_BASE_URL` en `release.local.env`.
- Servir `build/web/` con `Content-Type` correcto y fallback a `index.html` para rutas GoRouter.

## 6. Android — permisos incluidos

- Ubicación (ruta en vivo)
- Internet
- Notificaciones locales (recordatorios de eventos; sin FCM aún)

## 7. iOS — notas

- Permiso de ubicación en `Info.plist`.
- Build release en Mac: `flutter build ios --release --dart-define-from-file=release.local.env`
- Subir con Xcode Organizer / App Store Connect.

## 8. Checklist pre-lanzamiento

- [ ] `release.local.env` con API y Mapbox reales
- [ ] `flutter analyze` sin errores
- [ ] Login, chat, ruta, calendario y marketing probados en cada plataforma
- [ ] Backend con backup (`npm run db:backup`)
- [ ] `npm audit` en backend y clientes RN en 0 vulnerabilidades

## Versión actual

Ver `version:` en `pubspec.yaml` (formato `1.0.0+build`).
