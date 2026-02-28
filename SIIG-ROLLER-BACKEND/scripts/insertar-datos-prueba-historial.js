const {pool} = require('../src/config/database');
const crypto = require('crypto');

// Función para calcular distancia entre dos puntos GPS
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Función para generar puntos GPS a lo largo de una ruta
function generateRoutePoints(startLat, startLon, endLat, endLon, numPoints = 20) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = startLat + (endLat - startLat) * ratio;
    const lon = startLon + (endLon - startLon) * ratio;
    // Agregar pequeña variación aleatoria para simular movimiento real
    const latVariation = (Math.random() - 0.5) * 0.001;
    const lonVariation = (Math.random() - 0.5) * 0.001;
    points.push({
      lat: lat + latVariation,
      lon: lon + lonVariation,
    });
  }
  return points;
}

async function insertarDatosPrueba() {
  try {
    console.log('🔄 Buscando usuario ivanna@gmail.com...');

    // Buscar usuario por email
    const userResult = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      ['ivanna@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ Usuario ivanna@gmail.com no encontrado');
      console.log('💡 Asegúrate de que el usuario existe en la base de datos');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    console.log(`✅ Usuario encontrado: ${userId}`);

    // Rutas de ejemplo (Ciudad de México)
    const rutas = [
      {
        origen: 'Parque Chapultepec, Ciudad de México',
        destino: 'Zócalo, Centro Histórico, Ciudad de México',
        startLat: 19.4210,
        startLon: -99.1870,
        endLat: 19.4326,
        endLon: -99.1332,
        fechaOffset: 0, // Hoy
      },
      {
        origen: 'Polanco, Ciudad de México',
        destino: 'Roma Norte, Ciudad de México',
        startLat: 19.4330,
        startLon: -99.1940,
        endLat: 19.4170,
        endLon: -99.1630,
        fechaOffset: -7, // Hace 7 días
      },
      {
        origen: 'Coyoacán, Ciudad de México',
        destino: 'San Ángel, Ciudad de México',
        startLat: 19.3500,
        startLon: -99.1610,
        endLat: 19.3450,
        endLon: -99.1950,
        fechaOffset: -30, // Hace 30 días
      },
    ];

    console.log('\n📝 Creando 3 seguimientos de prueba...\n');

    for (let i = 0; i < rutas.length; i++) {
      const ruta = rutas[i];
      const seguimientoId = crypto.randomUUID();

      // Calcular fechas
      const ahora = new Date();
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(fechaInicio.getDate() + ruta.fechaOffset);
      fechaInicio.setHours(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);

      const fechaFin = new Date(fechaInicio);
      const duracionMinutos = 30 + Math.floor(Math.random() * 60); // 30-90 minutos
      fechaFin.setMinutes(fechaFin.getMinutes() + duracionMinutos);

      console.log(`📌 Seguimiento ${i + 1}:`);
      console.log(`   Origen: ${ruta.origen}`);
      console.log(`   Destino: ${ruta.destino}`);
      console.log(`   Fecha: ${fechaInicio.toLocaleString('es-ES')}`);

      // Crear seguimiento
      await pool.query(
        `INSERT INTO seguimientos (id, usuario_id, origen, destino, activo, creado_en, finalizado_en)
         VALUES ($1, $2::uuid, $3, $4, false, $5, $6)`,
        [seguimientoId, userId, ruta.origen, ruta.destino, fechaInicio, fechaFin]
      );

      // Generar puntos GPS a lo largo de la ruta
      const puntos = generateRoutePoints(
        ruta.startLat,
        ruta.startLon,
        ruta.endLat,
        ruta.endLon,
        25 // 25 puntos por ruta
      );

      // Calcular tiempo entre puntos
      const tiempoTotal = (fechaFin - fechaInicio) / 1000; // en segundos
      const intervalo = tiempoTotal / puntos.length;

      // Insertar puntos GPS
      let timestampInicio = fechaInicio.getTime();
      for (let j = 0; j < puntos.length; j++) {
        const punto = puntos[j];
        const timestamp = timestampInicio + (j * intervalo * 1000);
        
        // Calcular velocidad (m/s) - variar entre 2-8 m/s (7-29 km/h típico para patines)
        const velocidad = 2 + Math.random() * 6;
        
        // Calcular precisión GPS (5-15 metros)
        const precision = 5 + Math.random() * 10;

        await pool.query(
          `INSERT INTO seguimiento_puntos 
           (seguimiento_id, latitud, longitud, precision, velocidad, timestamp, creado_en)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)`,
          [
            seguimientoId,
            punto.lat,
            punto.lon,
            precision,
            velocidad,
            Math.floor(timestamp), // Asegurar que sea entero
            new Date(Math.floor(timestamp)),
          ]
        );
      }

      // Calcular estadísticas
      const distanciaTotal = calculateDistance(
        ruta.startLat,
        ruta.startLon,
        ruta.endLat,
        ruta.endLon
      );

      console.log(`   ✅ Creado con ${puntos.length} puntos GPS`);
      console.log(`   📏 Distancia aproximada: ${(distanciaTotal / 1000).toFixed(2)} km`);
      console.log(`   ⏱️  Duración: ${duracionMinutos} minutos\n`);
    }

    console.log('✨ ¡Datos de prueba insertados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   - 3 seguimientos finalizados creados');
    console.log('   - 1 recorrido de hoy');
    console.log('   - 1 recorrido de hace 7 días');
    console.log('   - 1 recorrido de hace 30 días');
    console.log('\n💡 Ahora puedes ver el historial en la app con el usuario ivanna@gmail.com');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error insertando datos:', error);
    await pool.end();
    process.exit(1);
  }
}

// Ejecutar
insertarDatosPrueba();

