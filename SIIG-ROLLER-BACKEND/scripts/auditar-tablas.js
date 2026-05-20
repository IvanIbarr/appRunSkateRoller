const {Pool} = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'siig_roller_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

const expectedTables = [
  'usuarios',
  'rutas',
  'recorridos',
  'puntos_gps',
  'grupos_rodadas',
  'participantes_grupo',
  'eventos',
  'participantes_evento',
  'productos',
  'productos_imagenes',
  'transacciones',
  'seguimientos',
  'seguimiento_puntos',
  'mensajes',
];

async function run() {
  try {
    const tablesResult = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    );
    const tables = tablesResult.rows.map(row => row.table_name);
    const missing = expectedTables.filter(t => !tables.includes(t));
    const extras = tables.filter(
      t =>
        !expectedTables.includes(t) &&
        t !== 'vista_estadisticas_usuarios' &&
        t !== 'vista_productos_con_imagen',
    );

    const users = await pool.query('SELECT COUNT(*)::int AS c FROM usuarios');
    const seguimientos = await pool.query(
      'SELECT COUNT(*)::int AS c FROM seguimientos',
    );
    const puntos = await pool.query(
      'SELECT COUNT(*)::int AS c FROM seguimiento_puntos',
    );

    console.log('=== AUDITORIA DE TABLAS ===');
    console.log(`Tablas detectadas (incluye vistas): ${tables.length}`);
    console.log(
      `Faltantes: ${missing.length > 0 ? missing.join(', ') : 'NINGUNA'}`,
    );
    console.log(`Extras inesperadas: ${extras.length > 0 ? extras.join(', ') : 'NINGUNA'}`);
    console.log('---');
    console.log(`Usuarios: ${users.rows[0].c}`);
    console.log(`Seguimientos: ${seguimientos.rows[0].c}`);
    console.log(`Puntos GPS seguimiento: ${puntos.rows[0].c}`);
  } catch (error) {
    console.error('Error auditando tablas:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
