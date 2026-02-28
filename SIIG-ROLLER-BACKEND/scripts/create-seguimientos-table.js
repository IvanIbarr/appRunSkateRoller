const {pool} = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function createSeguimientosTables() {
  try {
    console.log('🔄 Iniciando creación de tablas de seguimiento...');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'create-seguimientos-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Ejecutar comandos SQL en orden
    console.log('📝 Creando tabla seguimientos...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seguimientos (
        id UUID PRIMARY KEY,
        usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        origen TEXT,
        destino TEXT,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT NOW(),
        finalizado_en TIMESTAMP,
        CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabla seguimientos creada');

    console.log('📝 Creando tabla seguimiento_puntos...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seguimiento_puntos (
        id SERIAL PRIMARY KEY,
        seguimiento_id UUID NOT NULL REFERENCES seguimientos(id) ON DELETE CASCADE,
        latitud DECIMAL(10, 8) NOT NULL,
        longitud DECIMAL(11, 8) NOT NULL,
        precision DECIMAL(10, 2),
        velocidad DECIMAL(10, 2),
        timestamp BIGINT,
        creado_en TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_seguimiento FOREIGN KEY (seguimiento_id) REFERENCES seguimientos(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabla seguimiento_puntos creada');

    console.log('📝 Creando índices...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_seguimientos_usuario ON seguimientos(usuario_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_seguimientos_activo ON seguimientos(activo);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_seguimiento_puntos_seguimiento ON seguimiento_puntos(seguimiento_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_seguimiento_puntos_creado ON seguimiento_puntos(creado_en);
    `);
    console.log('✅ Índices creados');

    // Verificar que las tablas se crearon
    console.log('\n🔍 Verificando tablas creadas...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('seguimientos', 'seguimiento_puntos')
      ORDER BY table_name;
    `);

    if (result.rows.length === 2) {
      console.log('✅ Tablas creadas correctamente:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Algunas tablas pueden no haberse creado:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // Verificar índices
    console.log('\n🔍 Verificando índices...');
    const indexResult = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('seguimientos', 'seguimiento_puntos')
      ORDER BY indexname;
    `);

    if (indexResult.rows.length > 0) {
      console.log('✅ Índices creados:');
      indexResult.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
    }

    console.log('\n✨ Proceso completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear las tablas:', error);
    process.exit(1);
  }
}

// Ejecutar
createSeguimientosTables();

