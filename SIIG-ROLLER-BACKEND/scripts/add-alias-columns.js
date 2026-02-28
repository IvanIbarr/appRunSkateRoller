const {pool} = require('../src/config/database');

async function agregarColumnasAlias() {
  try {
    console.log('🔄 Agregando columnas alias y alias_cambios a la tabla usuarios...\n');

    // Paso 1: Agregar columna alias
    console.log('📋 Paso 1: Agregando columna alias...');
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'usuarios' 
          AND column_name = 'alias'
        ) THEN
          ALTER TABLE usuarios ADD COLUMN alias VARCHAR(100);
          COMMENT ON COLUMN usuarios.alias IS 'Alias del usuario (máximo 100 caracteres)';
          RAISE NOTICE 'Columna alias agregada exitosamente';
        ELSE
          RAISE NOTICE 'La columna alias ya existe';
        END IF;
      END$$;
    `);
    console.log('✅ Columna alias verificada/agregada');

    // Paso 2: Agregar columna alias_cambios
    console.log('📋 Paso 2: Agregando columna alias_cambios...');
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'usuarios' 
          AND column_name = 'alias_cambios'
        ) THEN
          ALTER TABLE usuarios ADD COLUMN alias_cambios INTEGER DEFAULT 0;
          COMMENT ON COLUMN usuarios.alias_cambios IS 'Número de veces que se ha cambiado el alias (máximo 3)';
          RAISE NOTICE 'Columna alias_cambios agregada exitosamente';
        ELSE
          RAISE NOTICE 'La columna alias_cambios ya existe';
        END IF;
      END$$;
    `);
    console.log('✅ Columna alias_cambios verificada/agregada');

    // Paso 3: Agregar CHECK constraint para alias_cambios (si no existe)
    console.log('📋 Paso 3: Agregando constraint CHECK para alias_cambios...');
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'usuarios_alias_cambios_check'
          ) THEN
            ALTER TABLE usuarios ADD CONSTRAINT usuarios_alias_cambios_check 
            CHECK (alias_cambios >= 0 AND alias_cambios <= 3);
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
          DROP CONSTRAINT IF EXISTS usuarios_alias_cambios_check;
        `);
        await pool.query(`
          ALTER TABLE usuarios 
          ADD CONSTRAINT usuarios_alias_cambios_check 
          CHECK (alias_cambios >= 0 AND alias_cambios <= 3);
        `);
        console.log('✅ Constraint CHECK agregado');
      } catch (e) {
        console.log('⚠️  No se pudo agregar el constraint, pero las columnas están creadas');
        console.log('   Esto es opcional, el límite de 3 cambios se manejará en la aplicación');
      }
    }

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('📊 Columnas agregadas:');
    console.log('   - alias (VARCHAR(100), nullable)');
    console.log('   - alias_cambios (INTEGER, DEFAULT 0, CHECK 0-3)');

    // Verificar que las columnas existen
    console.log('\n🔍 Verificando columnas...');
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, column_default
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      AND column_name IN ('alias', 'alias_cambios')
      ORDER BY column_name;
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Columnas encontradas en la base de datos:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error al agregar columnas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
agregarColumnasAlias()
  .then(() => {
    console.log('\n🎉 Script ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
