-- ============================================================
-- Agregar columna nombramiento a la tabla usuarios
-- Almacena el nombramiento del usuario (colider, veterano, nuevo)
-- ============================================================

-- Agregar columna nombramiento solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'nombramiento'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN nombramiento VARCHAR(20);
        COMMENT ON COLUMN usuarios.nombramiento IS 'Nombramiento del usuario (colider, veterano, nuevo)';
        
        -- Agregar constraint CHECK para validar valores permitidos
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_nombramiento_check 
        CHECK (nombramiento IS NULL OR nombramiento IN ('colider', 'veterano', 'nuevo'));
        
        RAISE NOTICE 'Columna nombramiento agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna nombramiento ya existe';
    END IF;
END$$;

