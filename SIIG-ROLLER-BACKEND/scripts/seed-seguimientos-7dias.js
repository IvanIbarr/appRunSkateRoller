const {Pool} = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'siig_roller_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

const emails = [
  'admin@roller.com',
  'ivanna@gmail.com',
  'lider@roller.com',
  'roller@roller.com',
  'sacx2003@gmail.com',
  'yunuem2018@gmail.com',
  'yunghappy@gmail.com',
  'anyahappy@gmail.com',
  'anyaamelieibarrag@gmail.com',
];

const baseLat = 19.4326;
const baseLng = -99.1332;

const run = async () => {
  const res = await pool.query(
    'SELECT id, email FROM usuarios WHERE email = ANY($1)',
    [emails],
  );
  const users = res.rows;
  if (users.length === 0) {
    console.log('No se encontraron usuarios.');
    await pool.end();
    return;
  }

  const now = new Date();
  let totalSeguimientos = 0;
  let totalPuntos = 0;

  for (const user of users) {
    for (let d = 0; d < 7; d += 1) {
      const dayDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      dayDate.setHours(18, 0, 0, 0);
      const endDate = new Date(dayDate.getTime() + 45 * 60 * 1000);

      const seguimientoId = crypto.randomUUID();
      const origen = `Inicio Ruta ${7 - d}`;
      const destino = `Destino Ruta ${7 - d}`;

      await pool.query(
        'INSERT INTO seguimientos (id, usuario_id, origen, destino, activo, creado_en, finalizado_en) VALUES ($1, $2, $3, $4, false, $5, $6)',
        [seguimientoId, user.id, origen, destino, dayDate, endDate],
      );
      totalSeguimientos += 1;

      const pointsCount = 8;
      for (let i = 0; i < pointsCount; i += 1) {
        const t = new Date(dayDate.getTime() + i * 5 * 60 * 1000);
        const lat = baseLat + (Math.random() - 0.5) * 0.01 + d * 0.001;
        const lng = baseLng + (Math.random() - 0.5) * 0.01 + d * 0.001;
        const precision = 5 + Math.random() * 7;
        const speed = 2.5 + Math.random() * 3.5;

        await pool.query(
          'INSERT INTO seguimiento_puntos (seguimiento_id, latitud, longitud, precision, velocidad, timestamp, creado_en) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [seguimientoId, lat, lng, precision, speed, Math.floor(t.getTime()), t],
        );
        totalPuntos += 1;
      }
    }
  }

  console.log(`Seguimientos creados: ${totalSeguimientos}`);
  console.log(`Puntos creados: ${totalPuntos}`);
  await pool.end();
};

run().catch(async (error) => {
  console.error('Error:', error.message);
  await pool.end();
  process.exit(1);
});
