-- Adjuntos en mensajes de chat (imagen / video)
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS adjunto_url TEXT;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS adjunto_tipo VARCHAR(16);

COMMENT ON COLUMN mensajes.adjunto_url IS 'Ruta relativa servida bajo /uploads/chat/...';
COMMENT ON COLUMN mensajes.adjunto_tipo IS 'image | video';
