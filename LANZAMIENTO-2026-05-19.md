# Paquete de lanzamiento — 19 may 2026

Resumen de lo listo para **Web**, **Android** e **iOS** (rama `actualizacion-pantallas-flujos-2026-05-19`).

## Cliente Flutter (`roller_flutter_app`)

| Plataforma | Estado | Cómo generar |
|------------|--------|--------------|
| **Web** | Listo para build | `.\scripts\build_release.ps1 -Platform web` |
| **Android** | Listo (APK + AAB) | `.\scripts\build_release.ps1 -Platform android` |
| **iOS** | Listo (build en Mac) | `flutter build ios --release --dart-define-from-file=release.local.env` |

Configuración: `release.local.env.example` → `release.local.env` (API + Mapbox).

## Backend (`SIIG-ROLLER-BACKEND`)

- API Node en puerto **3001**, Socket.IO, PostgreSQL.
- Plantilla servidor: `.env.example`.
- Backup BD: `npm run db:backup`.

## Seguridad npm (auditoría)

| Proyecto | Vulnerabilidades |
|----------|------------------|
| SIIG-ROLLER-BACKEND | 0 |
| appRunSkateRoller | 0 |
| SIIG-ROLLER-FRONT | 0 |

## Antes de subir a tiendas

1. Crear `release.local.env` con `API_BASE_URL` HTTPS real.
2. Android: keystore de release (hoy firma debug para pruebas).
3. iOS: certificados Apple + Archive en Xcode.
4. Backend: `JWT_SECRET` fuerte y `CORS_ORIGIN` acotado.
5. Probar login, chat, ruta, calendario y marketing en cada plataforma.

## Comandos útiles

```powershell
# Backend local
cd SIIG-ROLLER-BACKEND
$env:PORT="3001"; npm run start

# Flutter dev web
cd roller_flutter_app
.\scripts\run_chrome_mapbox.ps1
```

Documentación detallada: `roller_flutter_app/RELEASE.md`.
