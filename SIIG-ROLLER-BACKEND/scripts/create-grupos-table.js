/**
 * Crea la tabla `grupos` (equipos de líder) y columnas en `usuarios`.
 *
 * Nota: el esquema base trae `grupos_rodadas` (rutas en vivo), no esta tabla.
 * Si restauraste la BD con db:restore, debes ejecutar también este script.
 *
 * Uso:
 *   npm run db:grupos:setup
 *   node scripts/create-grupos-table.js
 *   node scripts/create-grupos-table.js --check
 */

require('dotenv').config({path: require('path').join(__dirname, '..', '.env')});

const fs = require('fs');
const path = require('path');
const {pool} = require('../src/config/database');

const SQL_FILE = path.join(__dirname, 'create-grupos-table.sql');

function dbLabel() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const name = process.env.DB_NAME || 'siig_roller_db';
  const user = process.env.DB_USER || 'postgres';
  return `${user}@${host}:${port}/${name}`;
}

async function tableExists(tableName) {
  const r = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS ok`,
    [tableName],
  );
  return Boolean(r.rows[0]?.ok);
}

async function columnExists(tableName, columnName) {
  const r = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
     ) AS ok`,
    [tableName, columnName],
  );
  return Boolean(r.rows[0]?.ok);
}

async function verifyGruposSchema() {
  const grupos = await tableExists('grupos');
  const grupoId = await columnExists('usuarios', 'grupo_id');
  const nombramiento = await columnExists('usuarios', 'nombramiento');
  let gruposCount = 0;
  if (grupos) {
    const c = await pool.query('SELECT COUNT(*)::int AS n FROM grupos');
    gruposCount = c.rows[0]?.n ?? 0;
  }
  return {grupos, grupoId, nombramiento, gruposCount};
}

async function runCheckOnly() {
  console.log(`🔎 Verificando esquema de grupos en: ${dbLabel()}\n`);
  const v = await verifyGruposSchema();

  const ok = v.grupos && v.grupoId;
  console.log(`   tabla grupos .............. ${v.grupos ? '✅' : '❌ FALTA'}`);
  console.log(`   usuarios.grupo_id ......... ${v.grupoId ? '✅' : '❌ FALTA'}`);
  console.log(`   usuarios.nombramiento ..... ${v.nombramiento ? '✅' : '⚠️  recomendado'}`);
  if (v.grupos) {
    console.log(`   registros en grupos ..... ${v.gruposCount}`);
  }

  if (!ok) {
    console.log('\n❌ Esquema incompleto. Ejecuta: npm run db:grupos:setup');
    process.exitCode = 1;
    return;
  }
  console.log('\n✅ Esquema de grupos listo.');
}

async function runSetup() {
  console.log(`🔄 Configurando grupos en: ${dbLabel()}\n`);

  if (!(await tableExists('usuarios'))) {
    throw new Error(
      'La tabla "usuarios" no existe. Primero restaura el esquema base: npm run db:restore',
    );
  }

  if (await tableExists('grupos')) {
    console.log('ℹ️  La tabla "grupos" ya existe; se aplican solo ajustes pendientes.');
  } else {
    console.log('📋 Creando tabla "grupos" (distinta de "grupos_rodadas" del esquema base)...');
  }

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  await pool.query(sql);

  const v = await verifyGruposSchema();
  if (!v.grupos || !v.grupoId) {
    throw new Error('El SQL terminó pero la verificación falló (grupos o grupo_id ausentes).');
  }

  console.log('\n✅ Esquema aplicado correctamente:');
  console.log(`   • tabla grupos`);
  console.log(`   • usuarios.grupo_id`);
  console.log(`   • usuarios.nombramiento ${v.nombramiento ? '' : '(no se pudo crear)'}`);
  console.log(`   • ${v.gruposCount} grupo(s) registrado(s)`);
  console.log('\n💡 Reinicia el backend si estaba corriendo y recarga /grupo/nombre en la app.');
}

async function main() {
  const checkOnly = process.argv.includes('--check');

  try {
    if (checkOnly) {
      await runCheckOnly();
    } else {
      await runSetup();
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === '42P01') {
      console.error('   PostgreSQL no encontró una tabla referenciada. ¿Existe "usuarios"?');
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
