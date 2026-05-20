-- ============================================================
-- TABLA: grupos (equipos de lider / staff - NO es grupos_rodadas)
-- Ejecutar con: npm run db:grupos:setup
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_grupo VARCHAR(255) NOT NULL,
    lider_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grupos_lider FOREIGN KEY (lider_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT unique_lider_grupo UNIQUE (lider_id)
);

-- Columna grupo_id en usuarios
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
        COMMENT ON COLUMN usuarios.grupo_id IS 'Grupo al que pertenece el usuario (asignado por el lider)';
    END IF;
END$$;

-- FK usuarios.grupo_id -> grupos (si aun no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND constraint_name = 'fk_usuarios_grupo'
    ) THEN
        ALTER TABLE usuarios
            ADD CONSTRAINT fk_usuarios_grupo
            FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL;
    END IF;
END$$;

-- Columna nombramiento (colider / veterano / nuevo)
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
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND constraint_name = 'usuarios_nombramiento_check'
    ) THEN
        ALTER TABLE usuarios
            ADD CONSTRAINT usuarios_nombramiento_check
            CHECK (nombramiento IS NULL OR nombramiento IN ('colider', 'veterano', 'nuevo'));
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_grupos_lider_id ON grupos(lider_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_grupo_id ON usuarios(grupo_id);

CREATE OR REPLACE FUNCTION update_grupos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_grupos_updated_at ON grupos;
CREATE TRIGGER trigger_update_grupos_updated_at
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION update_grupos_updated_at();

COMMENT ON TABLE grupos IS 'Grupos creados por lideres para organizar su equipo de staff';
COMMENT ON COLUMN grupos.nombre_grupo IS 'Nombre del grupo asignado por el lider';
COMMENT ON COLUMN grupos.lider_id IS 'ID del lider que creo el grupo';
