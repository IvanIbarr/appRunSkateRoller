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
