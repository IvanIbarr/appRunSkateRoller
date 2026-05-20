/**
 * Restaura el esquema principal de la app cuando se perdió la BD local.
 * Seguridad: solo ejecuta el SQL si no existe la tabla "usuarios".
 *
 * Uso:
 *   node scripts/restaurar-esquema-base.js
 */

const fs = require('fs');
const path = require('path');
const {pool} = require('../src/config/database');

async function restaurarEsquemaBase() {
  try {
    console.log('🔎 Verificando estado de la base de datos...');
    const check = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'usuarios'
       ) AS usuarios_exists`,
    );

    if (check.rows[0]?.usuarios_exists) {
      console.log(
        '⚠️ La tabla "usuarios" ya existe. No se ejecuta restauración automática para evitar conflictos.',
      );
      console.log(
        '💡 Si necesitas restaurar desde cero, respalda y limpia la BD manualmente primero.',
      );
      process.exit(0);
    }

    const schemaPath = path.join(
      __dirname,
      '..',
      '..',
      'appRunSkateRoller',
      'esquema-sql-postgresql-sin-postgis.sql',
    );
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🛠️ Restaurando esquema base (sin PostGIS)...');
    await pool.query(sql);

    const tables = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`,
    );
    console.log(`✅ Restauración completada. Tablas detectadas: ${tables.rows.length}`);
    for (const row of tables.rows) {
      console.log(`   - ${row.table_name}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error restaurando esquema base:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

restaurarEsquemaBase();
