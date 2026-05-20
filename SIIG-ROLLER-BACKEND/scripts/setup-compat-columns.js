/**
 * Agrega columnas de compatibilidad para frontend actual:
 * - usuarios.alias / usuarios.avatar
 * - eventos.* campos extendidos usados por calendario
 *
 * Uso:
 *   node scripts/setup-compat-columns.js
 */

const {pool} = require('../src/config/database');

async function run() {
  try {
    console.log('🔧 Aplicando columnas de compatibilidad...');

    await pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS alias VARCHAR(255),
      ADD COLUMN IF NOT EXISTS avatar TEXT;
    `);

    await pool.query(`
      ALTER TABLE eventos
      ADD COLUMN IF NOT EXISTS titulo_ruta TEXT,
      ADD COLUMN IF NOT EXISTS punto_salida TEXT,
      ADD COLUMN IF NOT EXISTS fecha_inicio TEXT,
      ADD COLUMN IF NOT EXISTS cita TEXT,
      ADD COLUMN IF NOT EXISTS salida TEXT,
      ADD COLUMN IF NOT EXISTS nivel TEXT,
      ADD COLUMN IF NOT EXISTS logo_grupo TEXT,
      ADD COLUMN IF NOT EXISTS lugar_destino TEXT;
    `);

    console.log('✅ Compatibilidad aplicada (usuarios + eventos)');
  } catch (error) {
    console.error('❌ Error aplicando compatibilidad:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
