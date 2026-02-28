# Instrucciones para crear tablas de seguimiento GPS

Este documento explica cómo crear las tablas necesarias para la funcionalidad de seguimiento GPS compartido.

## Pasos

1. Abre tu cliente de PostgreSQL (DBeaver, pgAdmin, o línea de comandos)

2. Conéctate a la base de datos `siig_roller_db`

3. Ejecuta el script SQL que se encuentra en:
   ```
   scripts/create-seguimientos-table.sql
   ```

   O copia y pega el siguiente SQL:

```sql
-- Tabla para sesiones de seguimiento GPS
CREATE TABLE IF NOT EXISTS seguimientos (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  origen TEXT,
  destino TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  finalizado_en TIMESTAMP,
  CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla para puntos de ubicación durante el seguimiento
CREATE TABLE IF NOT EXISTS seguimiento_puntos (
  id SERIAL PRIMARY KEY,
  seguimiento_id UUID NOT NULL REFERENCES seguimientos(id) ON DELETE CASCADE,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  precision DECIMAL(10, 2),
  velocidad DECIMAL(10, 2),
  timestamp BIGINT,
  creado_en TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_seguimiento FOREIGN KEY (seguimiento_id) REFERENCES seguimientos(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_seguimientos_usuario ON seguimientos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_activo ON seguimientos(activo);
CREATE INDEX IF NOT EXISTS idx_seguimiento_puntos_seguimiento ON seguimiento_puntos(seguimiento_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_puntos_creado ON seguimiento_puntos(creado_en);
```

4. Verifica que las tablas se crearon correctamente:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('seguimientos', 'seguimiento_puntos');
```

Deberías ver ambas tablas en los resultados.

## Verificación

Para verificar que todo está funcionando correctamente, puedes ejecutar:

```sql
-- Ver estructura de la tabla seguimientos
\d seguimientos

-- Ver estructura de la tabla seguimiento_puntos
\d seguimiento_puntos
```

## Notas

- Las tablas usan UUID para los IDs de seguimiento, lo que permite URLs únicas y seguras para compartir
- Los puntos de ubicación se almacenan con precisión decimal para latitud y longitud
- Los índices mejoran el rendimiento de las consultas, especialmente cuando hay muchos puntos de seguimiento

