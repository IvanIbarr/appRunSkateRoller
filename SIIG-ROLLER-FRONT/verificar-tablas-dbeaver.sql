-- ============================================================
-- Script de Verificación para DBeaver
-- Ejecuta este script en DBeaver para verificar las tablas
-- ============================================================

-- 1. Verificar que estás en la base de datos correcta
SELECT current_database() as base_datos_actual;

-- 2. Verificar el esquema actual
SELECT current_schema() as esquema_actual;

-- 3. Listar TODAS las tablas en el esquema public
SELECT 
    table_name as nombre_tabla,
    table_type as tipo
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Contar cuántas tablas hay
SELECT 
    COUNT(*) as total_tablas,
    COUNT(*) FILTER (WHERE table_type = 'BASE TABLE') as tablas_base,
    COUNT(*) FILTER (WHERE table_type = 'VIEW') as vistas
FROM information_schema.tables
WHERE table_schema = 'public';

-- 5. Ver estructura de la tabla usuarios
SELECT 
    column_name as columna,
    data_type as tipo_dato,
    is_nullable as permite_nulo,
    column_default as valor_defecto
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- 6. Listar todas las tablas con su dueño
SELECT 
    schemaname as esquema,
    tablename as tabla,
    tableowner as dueño
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. Verificar extensiones instaladas
SELECT * FROM pg_extension;

-- 8. Verificar tipos ENUM creados
SELECT 
    typname as tipo_enum,
    array_to_string(
        ARRAY(
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = pg_type.oid 
            ORDER BY enumsortorder
        ), 
        ', '
    ) as valores
FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;

-- ============================================================
-- Si las tablas aparecen aquí pero no en DBeaver:
-- ============================================================
-- 1. Click derecho en la conexión → "Refresh"
-- 2. O click derecho en "Databases" → "siig_roller_db" → "Refresh"
-- 3. O expande: Databases → siig_roller_db → Schemas → public → Tables

