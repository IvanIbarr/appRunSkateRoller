-- ============================================================
-- TABLA: usuarios (base para autenticación y perfiles)
-- Ejecuta esto en la BD: siig_roller_db
-- ============================================================

-- Extensión para UUID (uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla principal de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  edad INTEGER CHECK (edad >= 13 AND edad <= 120),
  cumpleaños DATE,
  sexo VARCHAR(20) CHECK (sexo IN ('masculino', 'femenino', 'ambos')),
  nacionalidad VARCHAR(20) CHECK (nacionalidad IN ('español', 'inglés')),
  tipo_perfil VARCHAR(20) NOT NULL DEFAULT 'roller' CHECK (tipo_perfil IN ('administrador', 'liderGrupo', 'roller')),

  -- Perfil / UI
  logo TEXT,
  avatar VARCHAR(10),
  foto_perfil TEXT,
  telefono VARCHAR(20),

  -- Social / grupos (puede agregarse después con create-grupos-table.sql)
  grupo_id UUID,
  alias VARCHAR(100),
  alias_cambios INTEGER DEFAULT 0 CHECK (alias_cambios >= 0 AND alias_cambios <= 3),
  nombramiento VARCHAR(20),

  -- Auditoría
  fecha_registro TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (LOWER(TRIM(email)));
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_perfil ON usuarios (tipo_perfil);

