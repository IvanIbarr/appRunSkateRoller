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

