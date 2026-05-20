/**
 * Genera recorridos con muchos km para sacx2003@gmail.com (lider del ranking en Historial).
 * Uso: node scripts/seed-leaderboard-sacx.js
 */
const {Pool} = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'siig_roller_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

const TARGET_EMAIL = 'sacx2003@gmail.com';
const RIDES_COUNT = 12;
const POINTS_PER_RIDE = 45;
const STEP_DEG = 0.014; // ~1.5 km entre puntos → ~60+ km por recorrido

const run = async () => {
  const userRes = await pool.query('SELECT id, email FROM usuarios WHERE LOWER(email) = LOWER($1)', [
    TARGET_EMAIL,
  ]);
  const user = userRes.rows[0];
  if (!user) {
    console.error(`No se encontró usuario ${TARGET_EMAIL}`);
    process.exit(1);
  }

  const now = new Date();
  let totalSeguimientos = 0;
  let totalPuntos = 0;
  const baseLat = 19.4326;
  const baseLng = -99.1332;

  for (let r = 0; r < RIDES_COUNT; r += 1) {
    const dayDate = new Date(now.getTime() - (r % 7) * 24 * 60 * 60 * 1000);
    dayDate.setHours(17 + (r % 3), 30, 0, 0);
    const endDate = new Date(dayDate.getTime() + 90 * 60 * 1000);

    const seguimientoId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO seguimientos (id, usuario_id, origen, destino, activo, creado_en, finalizado_en)
       VALUES ($1, $2, $3, $4, false, $5, $6)`,
      [
        seguimientoId,
        user.id,
        `Ruta Pro ${r + 1} - Inicio`,
        `Ruta Pro ${r + 1} - Meta`,
        dayDate,
        endDate,
      ],
    );
    totalSeguimientos += 1;

    for (let i = 0; i < POINTS_PER_RIDE; i += 1) {
      const t = new Date(dayDate.getTime() + i * 2 * 60 * 1000);
      const lat = baseLat + r * 0.002 + i * STEP_DEG;
      const lng = baseLng + Math.sin(i / 4) * 0.004;
      const speed = 3.5 + (i % 5) * 0.4;

      await pool.query(
        `INSERT INTO seguimiento_puntos
         (seguimiento_id, latitud, longitud, precision, velocidad, timestamp, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [seguimientoId, lat, lng, 6, speed, Math.floor(t.getTime()), t],
      );
      totalPuntos += 1;
    }
  }

  console.log(`Usuario: ${user.email} (${user.id})`);
  console.log(`Seguimientos creados: ${totalSeguimientos}`);
  console.log(`Puntos GPS creados: ${totalPuntos}`);
  console.log('Recarga Historial (filtro Semana) para ver el podio actualizado.');
  await pool.end();
};

run().catch(async (error) => {
  console.error('Error:', error.message);
  await pool.end();
  process.exit(1);
});
