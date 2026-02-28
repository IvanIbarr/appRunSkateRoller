-- ============================================================
-- Agregar columna avatar a la tabla usuarios
-- Almacena el avatar seleccionado por el usuario
-- ============================================================

-- Agregar columna avatar solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(10);
        COMMENT ON COLUMN usuarios.avatar IS 'Avatar del usuario (emoji o identificador)';
        
        RAISE NOTICE 'Columna avatar agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna avatar ya existe';
    END IF;
END$$;

