const {pool} = require('../src/config/database');

async function agregarColumnaAvatar() {
  try {
    console.log('🔄 Agregando columna avatar a la tabla usuarios...\n');

    // Paso 1: Agregar columna avatar
    console.log('📋 Paso 1: Agregando columna avatar...');
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'usuarios' 
          AND column_name = 'avatar'
        ) THEN
          ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(10);
          COMMENT ON COLUMN usuarios.avatar IS 'Avatar del usuario (emoji o identificador)';
          RAISE NOTICE 'Columna avatar agregada exitosamente';
        ELSE
          RAISE NOTICE 'La columna avatar ya existe';
        END IF;
      END$$;
    `);
    console.log('✅ Columna avatar verificada/agregada');

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('📊 Columna agregada:');
    console.log('   - avatar (VARCHAR(10), nullable)');

    // Verificar que la columna existe
    console.log('\n🔍 Verificando columna...');
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      AND column_name = 'avatar';
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Columna encontrada en la base de datos:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error al agregar columna:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
agregarColumnaAvatar()
  .then(() => {
    console.log('\n🎉 Script ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

