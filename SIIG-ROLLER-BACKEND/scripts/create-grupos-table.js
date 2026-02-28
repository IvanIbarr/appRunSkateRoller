const {pool} = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function crearTablaGrupos() {
  try {
    console.log('🔄 Creando tabla grupos y columna grupo_id...\n');

    // Paso 1: Crear la tabla grupos primero
    console.log('📋 Paso 1: Creando tabla grupos...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grupos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre_grupo VARCHAR(255) NOT NULL,
        lider_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_grupos_lider FOREIGN KEY (lider_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT unique_lider_grupo UNIQUE (lider_id)
      );
    `);
    console.log('✅ Tabla grupos creada');

    // Paso 2: Agregar columna grupo_id a usuarios (si no existe)
    console.log('📋 Paso 2: Agregando columna grupo_id a usuarios...');
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'usuarios' 
          AND column_name = 'grupo_id'
        ) THEN
          ALTER TABLE usuarios ADD COLUMN grupo_id UUID;
          RAISE NOTICE 'Columna grupo_id agregada exitosamente';
        ELSE
          RAISE NOTICE 'La columna grupo_id ya existe';
        END IF;
      END$$;
    `);

    // Agregar la foreign key constraint después de que existe la columna
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_usuarios_grupo'
          ) THEN
            ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_grupo 
            FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL;
          END IF;
        END$$;
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('⚠️  La constraint fk_usuarios_grupo ya existe o hubo un error:', error.message);
      }
    }

    console.log('✅ Columna grupo_id agregada');

    // Paso 3: Crear índices
    console.log('📋 Paso 3: Creando índices...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grupos_lider_id ON grupos(lider_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_grupo_id ON usuarios(grupo_id);`);
    console.log('✅ Índices creados');

    // Paso 4: Crear función y trigger para updated_at
    console.log('📋 Paso 4: Creando función y trigger para updated_at...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_grupos_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_grupos_updated_at ON grupos;
      CREATE TRIGGER trigger_update_grupos_updated_at
        BEFORE UPDATE ON grupos
        FOR EACH ROW
        EXECUTE FUNCTION update_grupos_updated_at();
    `);
    console.log('✅ Función y trigger creados');

    // Paso 5: Verificar que todo se creó correctamente
    console.log('📋 Paso 5: Verificando creación...\n');
    const checkTable = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grupos'"
    );

    if (checkTable.rows.length > 0) {
      console.log('✅ Tabla grupos existe');
    } else {
      console.log('❌ Error: La tabla grupos no se encontró');
    }

    // Verificar que la columna se agregó
    const checkColumn = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'grupo_id'"
    );

    if (checkColumn.rows.length > 0) {
      console.log('✅ Columna grupo_id existe en usuarios');
    } else {
      console.log('❌ Error: La columna grupo_id no se encontró');
    }

    console.log('\n✅ ¡Proceso completado exitosamente!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla grupos:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  }
}

// Ejecutar
crearTablaGrupos();

