-- ============================================================
-- TABLA: MENSAJES
-- Almacena mensajes de chat (General y Staff)
-- ============================================================

CREATE TYPE tipo_chat AS ENUM ('general', 'staff');

CREATE TABLE IF NOT EXISTS mensajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_type tipo_chat NOT NULL,
    usuario_id UUID NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
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

