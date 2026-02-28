# ⚠️ IMPORTANTE: Ejecuta este SQL en pgAdmin

Para agregar la funcionalidad de "Alias", es necesario agregar las columnas `alias` y `alias_cambios` a la tabla `usuarios`.

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
-- AGREGAR COLUMNAS DE ALIAS A LA TABLA USUARIOS
-- ============================================================

-- Agregar columna alias solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'alias'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN alias VARCHAR(100);
        COMMENT ON COLUMN usuarios.alias IS 'Alias del usuario (máximo 100 caracteres)';
        RAISE NOTICE 'Columna alias agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna alias ya existe';
    END IF;
END$$;

-- Agregar columna alias_cambios solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'alias_cambios'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN alias_cambios INTEGER DEFAULT 0 CHECK (alias_cambios >= 0 AND alias_cambios <= 3);
        COMMENT ON COLUMN usuarios.alias_cambios IS 'Número de veces que se ha cambiado el alias (máximo 3)';
        RAISE NOTICE 'Columna alias_cambios agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna alias_cambios ya existe';
    END IF;
END$$;
```

---

## ✅ Verificación

Después de ejecutar el SQL, verifica que las columnas se hayan creado correctamente:

```sql
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name IN ('alias', 'alias_cambios');
```

Deberías ver:
- `alias`: VARCHAR(100), NULL
- `alias_cambios`: INTEGER, DEFAULT 0

---

## 📝 Notas

- La columna `alias` permite valores NULL (para usuarios que aún no tienen alias)
- La columna `alias_cambios` tiene un CHECK constraint que limita los valores entre 0 y 3
- El valor por defecto de `alias_cambios` es 0
