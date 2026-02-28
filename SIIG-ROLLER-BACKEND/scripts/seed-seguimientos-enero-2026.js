const {pool} = require('../src/config/database');
const crypto = require('crypto');

const emails = [
  'admin@roller.com',
  'ivanna@gmail.com',
  'lider@roller.com',
  'roller@roller.com',
  'sacx2003@gmail.com',
  'yunuem2018@gmail.com',
  'yunghappy@gmail.com',
  'anyahappy@gmail.com',
];

const routes = [
  {
    origen: 'Parque Chapultepec, Ciudad de México',
    destino: 'Zócalo, Centro Histórico, Ciudad de México',
    startLat: 19.4210,
    startLon: -99.1870,
    endLat: 19.4326,
    endLon: -99.1332,
  },
  {
    origen: 'Polanco, Ciudad de México',
    destino: 'Roma Norte, Ciudad de México',
    startLat: 19.4330,
    startLon: -99.1940,
    endLat: 19.4170,
    endLon: -99.1630,
  },
  {
    origen: 'Coyoacán, Ciudad de México',
    destino: 'San Ángel, Ciudad de México',
    startLat: 19.3500,
    startLon: -99.1610,
    endLat: 19.3450,
    endLon: -99.1950,
  },
  {
    origen: 'Reforma, Ciudad de México',
    destino: 'Condesa, Ciudad de México',
    startLat: 19.4280,
    startLon: -99.1670,
    endLat: 19.4090,
    endLon: -99.1750,
  },
];

const monthStart = new Date(2026, 0, 1, 0, 0, 0, 0);
const monthEnd = new Date(2026, 1, 1, 0, 0, 0, 0); // Feb 1, exclusive

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDateInJanuary = () => {
  const range = monthEnd.getTime() - monthStart.getTime();
  return new Date(monthStart.getTime() + Math.random() * range);
};

const generateRoutePoints = (startLat, startLon, endLat, endLon, numPoints) => {
  const points = [];
  for (let i = 0; i <= numPoints; i += 1) {
    const ratio = i / numPoints;
    const lat = startLat + (endLat - startLat) * ratio;
    const lon = startLon + (endLon - startLon) * ratio;
    const latVariation = (Math.random() - 0.5) * 0.0012;
    const lonVariation = (Math.random() - 0.5) * 0.0012;
    points.push({
      lat: lat + latVariation,
      lon: lon + lonVariation,
    });
  }
  return points;
};

const run = async () => {
  const res = await pool.query(
    'SELECT id, email FROM usuarios WHERE email = ANY($1)',
    [emails],
  );
  const users = res.rows;

  const foundEmails = users.map(u => u.email);
  const missingEmails = emails.filter(e => !foundEmails.includes(e));

  if (missingEmails.length > 0) {
    console.log('⚠️  Emails no encontrados:', missingEmails.join(', '));
  }

  if (users.length === 0) {
    console.log('No se encontraron usuarios para generar historial.');
    await pool.end();
    return;
  }

  let totalSeguimientos = 0;
  let totalPuntos = 0;

  for (const user of users) {
    const target = randomInt(5, 15);
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM seguimientos
       WHERE usuario_id = $1::uuid
         AND creado_en >= $2
         AND creado_en < $3`,
      [user.id, monthStart, monthEnd],
    );
    const existing = countRes.rows[0]?.total || 0;
    const toCreate = Math.max(target - existing, 0);

    if (toCreate === 0) {
      console.log(`ℹ️  ${user.email}: ya tiene ${existing} recorridos en enero 2026`);
      continue;
    }

    for (let i = 0; i < toCreate; i += 1) {
      const route = routes[randomInt(0, routes.length - 1)];
      const startDate = randomDateInJanuary();
      startDate.setHours(randomInt(6, 20), randomInt(0, 59), 0, 0);
      const durationMinutes = randomInt(25, 90);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

      const seguimientoId = crypto.randomUUID();

      await pool.query(
        `INSERT INTO seguimientos
         (id, usuario_id, origen, destino, activo, creado_en, finalizado_en)
         VALUES ($1, $2::uuid, $3, $4, false, $5, $6)`,
        [seguimientoId, user.id, route.origen, route.destino, startDate, endDate],
      );
      totalSeguimientos += 1;

      const pointsCount = randomInt(12, 30);
      const puntos = generateRoutePoints(
        route.startLat,
        route.startLon,
        route.endLat,
        route.endLon,
        pointsCount,
      );
      const totalSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
      const intervalSeconds = totalSeconds / puntos.length;

      for (let p = 0; p < puntos.length; p += 1) {
        const punto = puntos[p];
        const timestamp = Math.floor(
          startDate.getTime() + p * intervalSeconds * 1000,
        );
        const precision = 5 + Math.random() * 10;
        const speed = 2 + Math.random() * 5; // m/s (7-25 km/h aprox)

        await pool.query(
          `INSERT INTO seguimiento_puntos
           (seguimiento_id, latitud, longitud, precision, velocidad, timestamp, creado_en)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)`,
          [
            seguimientoId,
            punto.lat,
            punto.lon,
            precision,
            speed,
            timestamp,
            new Date(timestamp),
          ],
        );
        totalPuntos += 1;
      }
    }

    console.log(
      `✅ ${user.email}: creados ${toCreate} recorridos (enero 2026)`,
    );
  }

  console.log(`\n📊 Total seguimientos creados: ${totalSeguimientos}`);
  console.log(`📍 Total puntos creados: ${totalPuntos}`);

  await pool.end();
};

run().catch(async (error) => {
  console.error('❌ Error:', error);
  await pool.end();
  process.exit(1);
});
