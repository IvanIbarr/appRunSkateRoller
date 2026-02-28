const {pool} = require('../src/config/database');

const run = async () => {
  try {
    await pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS telefono TEXT
    `);
    console.log('✅ Columna telefono creada/ya existente');
  } catch (error) {
    console.error('❌ Error al crear columna telefono:', error);
  } finally {
    await pool.end();
  }
};

run();
