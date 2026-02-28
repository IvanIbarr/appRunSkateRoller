const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'siig_roller_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
  max: 20, // máximo de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Probar la conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos exitosa:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};

