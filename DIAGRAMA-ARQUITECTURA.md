# Diagrama de Arquitectura

## Arquitectura general (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             CAPA DE PRESENTACIÓN                             │
│            App React Native (Android/iOS)  |  Web React Native Web            │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │ HTTPS REST
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                CAPA DE SERVICIOS                             │
│                        Backend Node.js / Express                              │
│                                                                              │
│   Endpoints clave:                                                           │
│   - /auth/login, /auth/registro, /auth/forgot-password                        │
│   - /auth/verify-reset-code, /auth/reset-password                             │
│   - /eventos, /seguimientos, /auth/me, /auth/avatar                           │
└───────────────────────┬───────────────────────────────┬──────────────────────┘
                        │ SQL                           │ SMTP
                        ▼                               ▼
┌────────────────────────────────┐        ┌────────────────────────────────────┐
│         CAPA DE DATOS          │        │        SERVICIOS EXTERNOS          │
│            PostgreSQL          │        │  Mapbox APIs  |  SendGrid (SMTP)   │
└────────────────────────────────┘        └────────────────────────────────────┘
```

## Componentes y responsabilidades

### Cliente (App/Web)
- **UI/UX**: pantallas, navegación, formularios, estilos.
- **Servicios de app**: `authService`, `eventoService`, `seguimientoService`, `aliasService`.
- **Mapbox**: autocompletado y cálculo de rutas (cliente).

### Backend (Node.js / Express)
- **Autenticación**: login/registro/recuperación de contraseña.
- **Eventos**: creación, edición y consulta.
- **Seguimientos**: historial, leaderboard y métricas.
- **Usuarios**: perfil, avatar, información personal.
- **Integración email**: envío de códigos por SMTP (SendGrid).

### Base de Datos (PostgreSQL)
- **Entidades principales**: usuarios, rutas, recorridos, puntos_gps, eventos, grupos, marketplace.
- **Vistas**: estadísticas y productos con imagen.

