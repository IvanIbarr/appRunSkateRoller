/**
 * Respaldo lógico PostgreSQL → SQL (INSERT) sin depender de pg_dump en PATH.
 * Uso: node scripts/backup-db.js [ruta-salida.sql]
 */
const fs = require('fs');
const path = require('path');
const {pool} = require('../src/config/database');

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
  const fecha = new Date().toISOString().slice(0, 10);
  const defaultDir = path.join(__dirname, '..', '..', 'backups', fecha);
  const defaultFile = path.join(defaultDir, `siig_roller_db-${fecha}.sql`);
  const outFile = process.argv[2] ? path.resolve(process.argv[2]) : defaultFile;
  fs.mkdirSync(path.dirname(outFile), {recursive: true});

  const tablesRes = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  const lines = [
    `-- Backup SIIG Roller`,
    `-- Fecha: ${new Date().toISOString()}`,
    `-- Base: ${process.env.DB_NAME || 'siig_roller_db'}`,
    '',
  ];

  for (const row of tablesRes.rows) {
    const table = row.tablename;
    const dataRes = await pool.query(`SELECT * FROM "${table}"`);
    lines.push(`-- Tabla: ${table} (${dataRes.rowCount} filas)`);
    if (dataRes.rowCount === 0) {
      lines.push('');
      continue;
    }
    const cols = Object.keys(dataRes.rows[0]);
    const colList = cols.map((c) => `"${c}"`).join(', ');
    for (const r of dataRes.rows) {
      const vals = cols.map((c) => sqlLiteral(r[c])).join(', ');
      lines.push(`INSERT INTO "${table}" (${colList}) VALUES (${vals});`);
    }
    lines.push('');
  }

  fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
  const stat = fs.statSync(outFile);
  console.log(`✅ Backup guardado: ${outFile}`);
  console.log(`   Tamaño: ${(stat.size / 1024).toFixed(1)} KB`);
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Error en backup:', err.message);
  process.exit(1);
});
