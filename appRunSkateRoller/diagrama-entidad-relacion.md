# Diagrama de Entidad-Relación - RunSkateRoller

## Diagrama ER Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DIAGRAMA ENTIDAD-RELACIÓN                          │
│                              RunSkateRoller                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      USUARIOS        │
├──────────────────────┤
│ PK id (UUID)         │
│    email (VARCHAR)   │◄────┐
│    password_hash     │     │
│    edad (INTEGER)    │     │
│    cumpleaños (DATE) │     │
│    sexo (ENUM)       │     │
│    nacionalidad      │     │
│    tipo_perfil       │     │
│    foto_perfil (URL) │     │
│    logo (URL)        │     │
│    fecha_registro    │     │
│    created_at        │     │
│    updated_at        │     │
└──────────────────────┘     │
         │                   │
         │ 1                 │ N
         │                   │
         │ N                 │
    ┌────┴───────────────────┼───────────────┐
    │                        │               │
    │                        │               │
┌───▼──────────┐    ┌────────▼──────┐  ┌────▼──────────┐
│   RUTAS      │    │   RECORRIDOS  │  │  PRODUCTOS    │
├──────────────┤    ├───────────────┤  ├───────────────┤
│ PK id (UUID) │    │ PK id (UUID)  │  │ PK id (UUID)  │
│    nombre    │    │ FK usuario_id │  │ FK vendedor_id│
│ descripcion  │    │ FK ruta_id    │  │    titulo     │
│ origen_lat   │    │ distancia_real│  │ descripcion   │
│ origen_lng   │    │ duracion_real │  │ categoria     │
│ destino_lat  │    │ fecha_inicio  │  │ precio        │
│ destino_lng  │    │ fecha_fin     │  │ estado        │
│ distancia    │    │ velocidad_avg │  │ fecha_pub     │
│ duracion_est │    │ velocidad_max │  │ created_at    │
│ FK creador_id│    │ created_at    │  │ updated_at    │
│ fecha_creacion│   │ updated_at    │  └───────────────┘
│ estado       │    └───────────────┘         │
│ created_at   │              │                │ N
│ updated_at   │              │ N              │
└──────────────┘              │                │
    │                         │                │
    │ 1                       │ 1              │
    │                         │                │
    │ N                       │                │
┌───▼──────────────┐  ┌──────▼────────────┐   │
│ GRUPOS_RODADAS   │  │   PUNTOS_GPS      │   │
├──────────────────┤  ├───────────────────┤   │
│ PK id (UUID)     │  │ PK id (UUID)      │   │
│    nombre        │  │ FK recorrido_id   │   │
│ FK lider_id      │  │    lat (DECIMAL)  │   │
│ FK ruta_id       │  │    lng (DECIMAL)  │   │
│ fecha_hora_inicio│  │    timestamp      │   │
│ estado           │  │    orden (INT)    │   │
│ created_at       │  │    created_at     │   │
│ updated_at       │  └───────────────────┘   │
└──────────────────┘                          │
         │                                     │
         │ 1                                   │
         │                                     │
         │ N                                   │
┌────────▼────────────────┐  ┌───────────────▼──┐
│ PARTICIPANTES_GRUPO     │  │ PRODUCTOS_IMAGENES│
├─────────────────────────┤  ├──────────────────┤
│ PK id (UUID)            │  │ PK id (UUID)     │
│ FK grupo_id             │  │ FK producto_id   │
│ FK usuario_id           │  │    url_imagen    │
│ fecha_union             │  │    orden         │
│ created_at              │  │    created_at    │
└─────────────────────────┘  └──────────────────┘

┌──────────────────────────┐
│       EVENTOS            │
├──────────────────────────┤
│ PK id (UUID)             │
│    titulo                │
│    descripcion           │
│    fecha (DATE)          │
│    hora (TIME)           │
│    punto_encuentro_lat   │
│    punto_encuentro_lng   │
│    punto_encuentro_dir   │
│ FK organizador_id        │◄────┐
│    created_at            │     │
│    updated_at            │     │
└──────────────────────────┘     │
         │                       │
         │ 1                     │ N
         │                       │
         │ N                     │
┌────────▼──────────────────┐   │
│ PARTICIPANTES_EVENTO      │   │
├───────────────────────────┤   │
│ PK id (UUID)              │   │
│ FK evento_id              │   │
│ FK usuario_id             │───┘
│ fecha_registro            │
│ created_at                │
└───────────────────────────┘

┌──────────────────────────┐
│     TRANSACCIONES        │
├──────────────────────────┤
│ PK id (UUID)             │
│ FK producto_id           │◄───┐
│ FK comprador_id          │    │
│ FK vendedor_id           │    │
│    monto                 │    │
│    estado                │    │
│    fecha_transaccion     │    │
│    created_at            │    │
│    updated_at            │    │
└──────────────────────────┘    │
                                │
                                │ N
                                │
                        ┌───────┴────────┐
                        │   PRODUCTOS    │
                        │  (ya mostrado) │
                        └────────────────┘
```

## Relaciones Principales

1. **USUARIOS** → **RUTAS** (1:N)
   - Un usuario puede crear muchas rutas
   - Una ruta pertenece a un usuario (creador)

2. **USUARIOS** → **RECORRIDOS** (1:N)
   - Un usuario puede tener muchos recorridos
   - Un recorrido pertenece a un usuario

3. **RUTAS** → **RECORRIDOS** (1:N)
   - Una ruta puede tener muchos recorridos asociados
   - Un recorrido sigue una ruta específica

4. **RECORRIDOS** → **PUNTOS_GPS** (1:N)
   - Un recorrido tiene muchos puntos GPS
   - Un punto GPS pertenece a un recorrido

5. **RUTAS** → **GRUPOS_RODADAS** (1:N)
   - Una ruta puede usarse en muchos grupos
   - Un grupo sigue una ruta específica

6. **USUARIOS** → **GRUPOS_RODADAS** (1:N como líder)
   - Un usuario puede liderar muchos grupos
   - Un grupo tiene un líder

7. **USUARIOS** ↔ **GRUPOS_RODADAS** (N:M)
   - Muchos usuarios pueden participar en muchos grupos
   - Relación a través de PARTICIPANTES_GRUPO

8. **USUARIOS** → **PRODUCTOS** (1:N como vendedor)
   - Un usuario puede vender muchos productos
   - Un producto pertenece a un vendedor

9. **PRODUCTOS** → **PRODUCTOS_IMAGENES** (1:N)
   - Un producto puede tener muchas imágenes
   - Una imagen pertenece a un producto

10. **PRODUCTOS** → **TRANSACCIONES** (1:N)
    - Un producto puede tener muchas transacciones (historial)
    - Una transacción está asociada a un producto

11. **USUARIOS** → **TRANSACCIONES** (1:N como comprador/vendedor)
    - Un usuario puede hacer muchas compras
    - Un usuario puede tener muchas ventas

12. **USUARIOS** → **EVENTOS** (1:N como organizador)
    - Un usuario puede organizar muchos eventos
    - Un evento tiene un organizador

13. **USUARIOS** ↔ **EVENTOS** (N:M)
    - Muchos usuarios pueden participar en muchos eventos
    - Relación a través de PARTICIPANTES_EVENTO

## Notas Importantes

- **PostGIS**: Se recomienda usar la extensión PostGIS de PostgreSQL para funcionalidades geoespaciales avanzadas (cálculo de distancias, búsquedas por proximidad, etc.)
- **Índices**: Se deben crear índices en:
  - Claves foráneas (FK)
  - Campos de búsqueda frecuente (email, nombre)
  - Campos geoespaciales (lat, lng)
  - Campos de fecha para filtros temporales
- **Enums**: Los campos `sexo`, `nacionalidad`, `tipo_perfil`, `estado` deben ser tipos ENUM o CHECK constraints
- **UUID**: Todas las claves primarias usan UUID para mejor distribución y seguridad
- **Timestamps**: Se recomienda usar timestamps con zona horaria (TIMESTAMP WITH TIME ZONE)

