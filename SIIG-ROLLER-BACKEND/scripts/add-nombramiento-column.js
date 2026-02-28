const {pool} = require('../src/config/database');

async function agregarColumnaNombramiento() {
  try {
    console.log('🔄 Agregando columna nombramiento a la tabla usuarios...\n');

    // Paso 1: Agregar columna nombramiento
    console.log('📋 Paso 1: Agregando columna nombramiento...');
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'usuarios' 
          AND column_name = 'nombramiento'
        ) THEN
          ALTER TABLE usuarios ADD COLUMN nombramiento VARCHAR(20);
          COMMENT ON COLUMN usuarios.nombramiento IS 'Nombramiento del usuario (colider, veterano, nuevo)';
          RAISE NOTICE 'Columna nombramiento agregada exitosamente';
        ELSE
          RAISE NOTICE 'La columna nombramiento ya existe';
        END IF;
      END$$;
    `);
    console.log('✅ Columna nombramiento verificada/agregada');

    // Paso 2: Agregar CHECK constraint
    console.log('📋 Paso 2: Agregando constraint CHECK para nombramiento...');
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'usuarios_nombramiento_check'
          ) THEN
            ALTER TABLE usuarios ADD CONSTRAINT usuarios_nombramiento_check 
            CHECK (nombramiento IS NULL OR nombramiento IN ('colider', 'veterano', 'nuevo'));
            RAISE NOTICE 'Constraint CHECK agregado exitosamente';
          ELSE
            RAISE NOTICE 'El constraint CHECK ya existe';
          END IF;
        END$$;
      `);
      console.log('✅ Constraint CHECK verificado/agregado');
    } catch (constraintError) {
      // Si ya existe el constraint con otro nombre o hay un error, intentar agregarlo directamente
      console.log('⚠️  Intentando agregar constraint directamente...');
      try {
        await pool.query(`
          ALTER TABLE usuarios 
          DROP CONSTRAINT IF EXISTS usuarios_nombramiento_check;
        `);
        await pool.query(`
          ALTER TABLE usuarios 
          ADD CONSTRAINT usuarios_nombramiento_check 
          CHECK (nombramiento IS NULL OR nombramiento IN ('colider', 'veterano', 'nuevo'));
        `);
        console.log('✅ Constraint CHECK agregado');
      } catch (e) {
        console.log('⚠️  No se pudo agregar el constraint, pero la columna está creada');
        console.log('   Esto es opcional, los valores se validarán en la aplicación');
      }
    }

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('📊 Columna agregada:');
    console.log('   - nombramiento (VARCHAR(20), nullable, CHECK: colider/veterano/nuevo)');

    // Verificar que la columna existe
    console.log('\n🔍 Verificando columna...');
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      AND column_name = 'nombramiento';
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
agregarColumnaNombramiento()
  .then(() => {
    console.log('\n🎉 Script ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

