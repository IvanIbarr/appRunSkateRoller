# ⚠️ IMPORTANTE: Ejecuta este SQL en pgAdmin

El error 500 en el chat se debe a que falta la tabla `mensajes`. 

## Pasos para ejecutar:

1. **Abre pgAdmin**
2. **Conecta a tu servidor PostgreSQL** (localhost)
3. **Expande la base de datos `siig_roller_db`**
4. **Haz clic derecho en `siig_roller_db` → Query Tool**
5. **Copia y pega TODO el siguiente código SQL:**
6. **Presiona F5 o haz clic en "Execute" (▶)**

---

## 📋 CÓDIGO SQL A COPIAR Y PEGAR:

```sql
-- ============================================================
-- TABLA: MENSAJES
-- Almacena mensajes de chat (General y Staff)
-- ============================================================

-- Crear tipo ENUM solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_chat') THEN
        CREATE TYPE tipo_chat AS ENUM ('general', 'staff');
    END IF;
END$$;

-- Crear tabla solo si no existe
CREATE TABLE IF NOT EXISTS mensajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_type tipo_chat NOT NULL,
    usuario_id UUID NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_mensajes_chat_type ON mensajes(chat_type);
CREATE INDEX IF NOT EXISTS idx_mensajes_usuario_id ON mensajes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_created_at ON mensajes(created_at);
CREATE INDEX IF NOT EXISTS idx_mensajes_chat_type_created_at ON mensajes(chat_type, created_at DESC);

-- Función para eliminar mensajes antiguos (más de 7 días)
CREATE OR REPLACE FUNCTION eliminar_mensajes_antiguos()
RETURNS void AS $$
BEGIN
    DELETE FROM mensajes
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE mensajes IS 'Almacena mensajes de chat general y staff';
COMMENT ON COLUMN mensajes.chat_type IS 'Tipo de chat: general o staff';
COMMENT ON COLUMN mensajes.texto IS 'Contenido del mensaje';
COMMENT ON COLUMN mensajes.created_at IS 'Fecha y hora de creación del mensaje';
```

---

## ✅ Después de ejecutar:

1. Deberías ver un mensaje de éxito
2. **Reinicia el servidor backend** si está corriendo
3. Prueba el chat nuevamente - el error 500 debería desaparecer

## 🔍 Para verificar que se creó correctamente:

Ejecuta esta consulta en Query Tool:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'mensajes';
```

Deberías ver una fila con `mensajes` si se creó correctamente.

