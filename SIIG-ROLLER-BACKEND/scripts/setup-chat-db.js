/**
 * Crea/actualiza objetos de base de datos requeridos por el chat:
 * - tipo_chat
 * - tabla mensajes + índices
 * - columnas de adjuntos (adjunto_url, adjunto_tipo)
 *
 * Uso:
 *   node scripts/setup-chat-db.js
 */

const fs = require('fs');
const path = require('path');
const {pool} = require('../src/config/database');

async function runSqlFile(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  const sql = fs.readFileSync(fullPath, 'utf8');
  await pool.query(sql);
}

async function setupChatDb() {
  try {
    console.log('🔧 Preparando base de datos de chat...');
    await runSqlFile('create-mensajes-table-safe.sql');
    await runSqlFile('alter-mensajes-adjuntos.sql');

    const check = await pool.query(
      `SELECT
         EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'mensajes'
         ) AS mensajes_exists,
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'mensajes' AND column_name = 'adjunto_url'
         ) AS adjunto_url_exists,
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'mensajes' AND column_name = 'adjunto_tipo'
         ) AS adjunto_tipo_exists`,
    );

    const row = check.rows[0];
    if (row.mensajes_exists) {
      console.log('✅ Tabla mensajes lista');
    }
    if (row.adjunto_url_exists && row.adjunto_tipo_exists) {
      console.log('✅ Columnas de adjuntos listas');
    }
    console.log('✨ Setup de chat completado');
  } catch (error) {
    console.error('❌ Error en setup de chat:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

setupChatDb();
