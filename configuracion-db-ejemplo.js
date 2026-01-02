/**
 * Ejemplo de configuración de conexión a PostgreSQL
 * Para usar en tu backend (Node.js + Express)
 */

// Opción 1: Usando el cliente 'pg' (node-postgres)
const {Pool} = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'siig_roller_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'tu_contraseña_aqui',
  max: 20, // máximo de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Ejemplo de consulta
async function ejemploConsulta() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa:', result.rows[0]);
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

module.exports = pool;

// ============================================================
// Opción 2: Usando TypeORM (si usas TypeScript)
// ============================================================

/*
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  username: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'tu_contraseña_aqui',
  database: process.env.PGDATABASE || 'siig_roller_db',
  entities: [__dirname + '/entities/**/*.ts'],
  synchronize: false, // IMPORTANTE: false en producción
  logging: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
*/

// ============================================================
// Opción 3: Usando Sequelize (si prefieres Sequelize)
// ============================================================

/*
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PGDATABASE || 'siig_roller_db',
  process.env.PGUSER || 'postgres',
  process.env.PGPASSWORD || 'tu_contraseña_aqui',
  {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    logging: console.log, // Cambiar a false en producción
  }
);

// Probar conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
}

testConnection();

module.exports = sequelize;
*/

// ============================================================
// Variables de Entorno (.env)
// ============================================================

/*
PGHOST=localhost
PGPORT=5432
PGDATABASE=siig_roller_db
PGUSER=postgres
PGPASSWORD=tu_contraseña_segura_aqui
NODE_ENV=development
*/

