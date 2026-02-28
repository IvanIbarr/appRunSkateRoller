// Script para probar la conexión a la base de datos
require('dotenv').config();
const {Pool} = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'siig_roller_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

console.log('=== PROBANDO CONEXIÓN A POSTGRESQL ===');
console.log('');
console.log('Configuración:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || 5432}`);
console.log(`  Database: ${process.env.DB_NAME || 'siig_roller_db'}`);
console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
console.log('');

pool.query('SELECT NOW()')
  .then(result => {
    console.log('✅ CONEXIÓN EXITOSA!');
    console.log(`   Fecha/Hora del servidor: ${result.rows[0].now}`);
    console.log('');
    console.log('La base de datos está funcionando correctamente.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ ERROR DE CONEXIÓN:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('Posibles causas:');
    console.error('  1. PostgreSQL no está corriendo');
    console.error('  2. La base de datos no existe');
    console.error('  3. Usuario/contraseña incorrectos');
    console.error('  4. Puerto incorrecto');
    console.error('');
    process.exit(1);
  });

