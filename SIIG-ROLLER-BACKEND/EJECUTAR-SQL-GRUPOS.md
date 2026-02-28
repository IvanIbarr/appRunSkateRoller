# ⚠️ IMPORTANTE: Ejecuta este SQL en pgAdmin

Para agregar la funcionalidad de "Nombre del Grupo", es necesario crear la tabla `grupos` y agregar la columna `grupo_id` a la tabla `usuarios`.

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
-- TABLA: GRUPOS
-- Almacena los grupos creados por los líderes
-- Versión segura que verifica si la tabla ya existe
-- ============================================================

-- Crear tabla grupos solo si no existe
CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_grupo VARCHAR(255) NOT NULL,
    lider_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grupos_lider FOREIGN KEY (lider_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT unique_lider_grupo UNIQUE (lider_id) -- Un líder solo puede tener un grupo
);

-- Agregar columna grupo_id a usuarios solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'grupo_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN grupo_id UUID;
        ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN usuarios.grupo_id IS 'Grupo al que pertenece el usuario (asignado por el líder)';
        
        RAISE NOTICE 'Columna grupo_id agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna grupo_id ya existe';
    END IF;
END$$;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_grupos_lider_id ON grupos(lider_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_grupo_id ON usuarios(grupo_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_grupos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_grupos_updated_at ON grupos;
CREATE TRIGGER trigger_update_grupos_updated_at
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION update_grupos_updated_at();

-- Comentarios
COMMENT ON TABLE grupos IS 'Grupos creados por líderes para organizar su equipo de staff';
COMMENT ON COLUMN grupos.nombre_grupo IS 'Nombre del grupo asignado por el líder';
COMMENT ON COLUMN grupos.lider_id IS 'ID del líder que creó el grupo';

-- Verificar que las tablas y columnas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'grupos';

SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'usuarios' 
AND column_name = 'grupo_id';
```

## ✅ Verificación

Después de ejecutar el script, deberías ver:
1. Un mensaje indicando que la tabla `grupos` se creó exitosamente
2. Un mensaje indicando que la columna `grupo_id` se agregó a `usuarios`
3. Una consulta que muestra la tabla `grupos`
4. Una consulta que muestra la columna `grupo_id` en `usuarios`

## 📝 Notas Importantes

- **Un líder solo puede tener un grupo**: La restricción `unique_lider_grupo` asegura que cada líder tenga un solo grupo
- **Relación de grupo**: Cuando un líder crea/actualiza un grupo, automáticamente se asigna a su grupo
- **Asignación automática**: Cuando un líder agrega un usuario al staff, ese usuario se asigna automáticamente al grupo del líder

