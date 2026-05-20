/**
 * Clona la BD actual a UTF-8 conservando el esquema real (emojis en chat).
 * node scripts/migrate-db-to-utf8.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {Pool} = require('pg');

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'admin123';
const sourceDb = process.env.DB_NAME || 'siig_roller_db';
const targetDb = process.env.DB_NAME_UTF8 || `${sourceDb}_utf8`;

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function getEncoding(pool, dbName) {
  const r = await pool.query(
    `SELECT pg_encoding_to_char(encoding) AS enc FROM pg_database WHERE datname = $1`,
    [dbName],
  );
  return r.rows[0]?.enc;
}

async function copyEnums(source, target) {
  const enums = await source.query(`
    SELECT t.typname AS name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
  `);
  for (const row of enums.rows) {
    const raw = row.labels;
    const list = Array.isArray(raw)
      ? raw
      : String(raw || '')
          .replace(/^\{|\}$/g, '')
          .split(',')
          .filter(Boolean);
    const labels = list.map((l) => `'${String(l).replace(/'/g, "''")}'`).join(', ');
    await target.query(`DROP TYPE IF EXISTS ${quoteIdent(row.name)} CASCADE`);
    await target.query(`CREATE TYPE ${quoteIdent(row.name)} AS ENUM (${labels})`);
    console.log(`  tipo ${row.name}`);
  }
}

async function listTables(pool) {
  const r = await pool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  return r.rows.map((x) => x.tablename);
}

async function getCreateTableSql(pool, table) {
  const cols = await pool.query(
    `
    SELECT
      column_name,
      data_type,
      udt_name,
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
    `,
    [table],
  );

  const parts = cols.rows.map((c) => {
    let type = c.data_type;
    if (type === 'USER-DEFINED') type = c.udt_name;
    if (type === 'character varying' && c.character_maximum_length) {
      type = `varchar(${c.character_maximum_length})`;
    }
    let line = `${quoteIdent(c.column_name)} ${type}`;
    if (c.is_nullable === 'NO') line += ' NOT NULL';
    if (c.column_default && !String(c.column_default).includes('nextval')) {
      line += ` DEFAULT ${c.column_default}`;
    }
    return line;
  });

  return `CREATE TABLE IF NOT EXISTS ${quoteIdent(table)} (\n  ${parts.join(',\n  ')}\n);`;
}

async function copyTable(source, target, table) {
  const res = await source.query(`SELECT * FROM ${quoteIdent(table)}`);
  if (res.rowCount === 0) return;
  const cols = Object.keys(res.rows[0]);
  const colList = cols.map((c) => quoteIdent(c)).join(', ');
  const chunk = 100;
  for (let i = 0; i < res.rows.length; i += chunk) {
    const slice = res.rows.slice(i, i + chunk);
    const placeholders = [];
    const values = [];
    let p = 1;
    for (const row of slice) {
      const ph = cols.map(() => `$${p++}`).join(', ');
      placeholders.push(`(${ph})`);
      for (const c of cols) values.push(row[c]);
    }
    await target.query(
      `INSERT INTO ${quoteIdent(table)} (${colList}) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }
}

async function main() {
  const source = new Pool({host, port, database: sourceDb, user, password});
  const enc = await getEncoding(source, sourceDb);
  console.log(`Origen "${sourceDb}": ${enc}`);
  if (enc === 'UTF8') {
    console.log('La base ya es UTF-8.');
    await source.end();
    return;
  }

  const admin = new Pool({host, port, database: 'postgres', user, password});
  const targetEnc = await getEncoding(admin, targetDb);
  if (!targetEnc) {
    console.log(`Creando ${targetDb} (UTF-8)…`);
    await admin.query(
      `CREATE DATABASE ${quoteIdent(targetDb)} ENCODING 'UTF8' TEMPLATE template0`,
    );
  } else {
    console.log(`BD destino "${targetDb}" ya existe (${targetEnc}). Vacíala o usa otro nombre.`);
  }
  await admin.end();

  const target = new Pool({host, port, database: targetDb, user, password});
  await target.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  console.log('Copiando tipos ENUM…');
  await copyEnums(source, target);

  const tables = await listTables(source);
  console.log(`Clonando ${tables.length} tablas…`);

  await target.query('SET session_replication_role = replica');
  for (const table of tables) {
    const ddl = await getCreateTableSql(source, table);
    await target.query(`DROP TABLE IF EXISTS ${quoteIdent(table)} CASCADE`);
    await target.query(ddl);
    await copyTable(source, target, table);
    console.log(`  ✓ ${table}`);
  }
  await target.query('SET session_replication_role = DEFAULT');

  const seqs = await source.query(`
    SELECT sequence_name FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  `);
  for (const {sequence_name: seq} of seqs.rows) {
    const tbl = seq.replace(/_id_seq$/, '');
    try {
      const maxR = await target.query(
        `SELECT COALESCE(MAX(id), 0) AS m FROM ${quoteIdent(tbl)}`,
      );
      const next = Number(maxR.rows[0]?.m || 0) + 1;
      await target.query(`CREATE SEQUENCE IF NOT EXISTS ${quoteIdent(seq)}`);
      await target.query(`SELECT setval('${seq}', ${next}, false)`);
    } catch {
      /* tabla sin columna id */
    }
  }

  await source.end();
  await target.end();

  const envPath = path.join(__dirname, '..', '.env');
  let envBody = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (/^DB_NAME=/m.test(envBody)) {
    envBody = envBody.replace(/^DB_NAME=.*/m, `DB_NAME=${targetDb}`);
  } else {
    envBody += `\nDB_HOST=${host}\nDB_PORT=${port}\nDB_USER=${user}\nDB_PASSWORD=${password}\nDB_NAME=${targetDb}\n`;
  }
  fs.writeFileSync(envPath, envBody, 'utf8');

  console.log('\n✅ Migración UTF-8 completada.');
  console.log(`   .env → DB_NAME=${targetDb}`);
  console.log('   Reinicia el backend.');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
