# Diagrama de Flujo de la App y Diseño de Tablas

## Diagrama de flujo (App) con servicios/métodos

```mermaid
flowchart TD
  A[Inicio App] --> B{¿Autenticado?}
  B -- No --> C[Login]
  B -- Sí --> H[Home / Navegación]

  C --> C1[authService.login]
  C1 --> C2[POST /auth/login]
  C2 --> H

  C --> D[Registro]
  D --> D1[authService.registro]
  D1 --> D2[POST /auth/registro]
  D2 --> D3[aliasService.agregarAlias]
  D3 --> D4[POST /alias]
  D2 --> H

  C --> E[Olvidé mi contraseña]
  E --> E1[authService.requestPasswordReset]
  E1 --> E2[POST /auth/forgot-password]
  E2 --> F[Ingresar código]
  F --> F1[authService.verifyResetCode]
  F1 --> F2[POST /auth/verify-reset-code]
  F2 --> G[Restablecer contraseña]
  G --> G1[authService.resetPassword]
  G1 --> G2[POST /auth/reset-password]
  G2 --> C

  H --> I[Navegación / Rutas]
  H --> J[Comunidad / Chat]
  H --> K[Historial]
  H --> L[Calendario / Eventos]
  H --> M[Menú / Perfil]

  I --> I1[Buscar origen/destino]
  I1 --> I2[mapService.autocomplete]
  I2 --> I3[API Mapbox Autocomplete]
  I1 --> I4[Calcular ruta]
  I4 --> I5[mapService.getRoute]
  I5 --> I6[API Mapbox Directions]
  I4 --> I7[seguimientoService.iniciar]
  I7 --> I8[POST /seguimientos]

  K --> K1[seguimientoService.getResumen]
  K1 --> K2[GET /seguimientos/resumen]
  K --> K3[seguimientoService.getLeaderboard]
  K3 --> K4[GET /seguimientos/leaderboard]

  L --> L1[eventoService.getEventos]
  L1 --> L2[GET /eventos]
  L --> L3[eventoService.crearEvento]
  L3 --> L4[POST /eventos]
  L --> L5[eventoService.actualizarEvento]
  L5 --> L6[PUT /eventos/:id]

  M --> M1[authService.getCurrentUser]
  M1 --> M2[GET /auth/me]
  M --> M3[authService.updateAvatar]
  M3 --> M4[PUT /auth/avatar]
  M --> M5[authService.updatePersonalInfo]
  M5 --> M6[PUT /auth/personal-info]
```

## Diseño de tablas (PostgreSQL)

> Basado en `esquema-sql-postgresql.sql` (con PostGIS).

### Tipos ENUM
- `tipo_sexo`: masculino | femenino | ambos
- `tipo_nacionalidad`: español | inglés
- `tipo_perfil`: administrador | liderGrupo | roller
- `estado_ruta`: planificada | enProgreso | completada
- `estado_grupo`: activo | finalizado | cancelado
- `estado_producto`: disponible | vendido | reservado
- `estado_transaccion`: pendiente | completada | cancelada | reembolsada

### Tablas principales

#### `usuarios`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | Único |
| password_hash | VARCHAR(255) | Obligatorio |
| edad | INTEGER | >= 13 |
| cumpleaños | DATE | Obligatorio |
| sexo | tipo_sexo | Obligatorio |
| nacionalidad | tipo_nacionalidad | Obligatorio |
| tipo_perfil | tipo_perfil | Default: roller |
| foto_perfil | TEXT | Opcional |
| logo | TEXT | Opcional |
| fecha_registro | TIMESTAMPTZ | Default NOW |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

#### `rutas`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| nombre | VARCHAR(255) | Obligatorio |
| descripcion | TEXT | Opcional |
| origen_lat / origen_lng | DECIMAL | Obligatorio |
| destino_lat / destino_lng | DECIMAL | Obligatorio |
| distancia | DECIMAL(10,2) | km |
| duracion_estimada | INTEGER | min |
| creador_id | UUID | FK → usuarios.id |
| estado | estado_ruta | Default planificada |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

#### `recorridos`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| usuario_id | UUID | FK → usuarios.id |
| ruta_id | UUID | FK → rutas.id (nullable) |
| distancia_real | DECIMAL(10,2) | km |
| duracion_real | INTEGER | seg |
| fecha_inicio / fecha_fin | TIMESTAMPTZ | |
| velocidad_promedio / maxima | DECIMAL(6,2) | km/h |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

#### `puntos_gps`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| recorrido_id | UUID | FK → recorridos.id |
| lat / lng | DECIMAL | Obligatorio |
| timestamp | TIMESTAMPTZ | Obligatorio |
| orden | INTEGER | Secuencia |
| created_at | TIMESTAMPTZ | Auditoría |

#### `grupos_rodadas`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| nombre | VARCHAR(255) | Obligatorio |
| lider_id | UUID | FK → usuarios.id |
| ruta_id | UUID | FK → rutas.id |
| fecha_hora_inicio | TIMESTAMPTZ | Obligatorio |
| estado | estado_grupo | Default activo |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

#### `participantes_grupo`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| grupo_id | UUID | FK → grupos_rodadas.id |
| usuario_id | UUID | FK → usuarios.id |
| fecha_union | TIMESTAMPTZ | Default NOW |
| created_at | TIMESTAMPTZ | Auditoría |
| UNIQUE | (grupo_id, usuario_id) | |

#### `eventos`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| titulo | VARCHAR(255) | Obligatorio |
| descripcion | TEXT | Opcional |
| fecha | DATE | Obligatorio |
| hora | TIME | Obligatorio |
| punto_encuentro_lat / lng | DECIMAL | Obligatorio |
| punto_encuentro_direccion | VARCHAR(500) | Opcional |
| organizador_id | UUID | FK → usuarios.id |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

#### `participantes_evento`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| evento_id | UUID | FK → eventos.id |
| usuario_id | UUID | FK → usuarios.id |
| fecha_registro | TIMESTAMPTZ | Default NOW |
| created_at | TIMESTAMPTZ | Auditoría |
| UNIQUE | (evento_id, usuario_id) | |

#### `productos`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| vendedor_id | UUID | FK → usuarios.id |
| titulo | VARCHAR(255) | Obligatorio |
| descripcion | TEXT | Opcional |
| categoria | VARCHAR(100) | Obligatorio |
| precio | DECIMAL(10,2) | >= 0 |
| estado | estado_producto | Default disponible |
| fecha_publicacion | TIMESTAMPTZ | Default NOW |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

#### `productos_imagenes`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| producto_id | UUID | FK → productos.id |
| url_imagen | TEXT | Obligatorio |
| orden | INTEGER | Default 0 |
| created_at | TIMESTAMPTZ | Auditoría |

#### `transacciones`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| producto_id | UUID | FK → productos.id |
| comprador_id | UUID | FK → usuarios.id |
| vendedor_id | UUID | FK → usuarios.id |
| monto | DECIMAL(10,2) | >= 0 |
| estado | estado_transaccion | Default pendiente |
| fecha_transaccion | TIMESTAMPTZ | Default NOW |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |
| CHECK | comprador_id != vendedor_id | |

### Vistas
- `vista_estadisticas_usuarios`: resumen de recorridos por usuario.
- `vista_productos_con_imagen`: productos con imagen principal.

