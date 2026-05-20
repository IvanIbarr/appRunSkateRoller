/**
 * Crea tabla participantes_evento si no existe.
 * node scripts/ensure-participantes-evento.js
 */
require('dotenv').config();
const {pool} = require('../src/config/database');

const sql = `
CREATE TABLE IF NOT EXISTS participantes_evento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participantes_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_participantes_evento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT uq_participante_evento UNIQUE (evento_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS idx_participantes_evento_id ON participantes_evento(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_evento_usuario_id ON participantes_evento(usuario_id);
`;

async function main() {
  try {
    await pool.query(sql);
    console.log('OK participantes_evento');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
