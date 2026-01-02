-- ============================================================
-- Script de Verificación de Instalación
-- RunSkateRoller - PostgreSQL
-- ============================================================
-- Ejecuta este script para verificar que todo esté correctamente instalado

-- 1. Verificar que estamos en la base de datos correcta
SELECT current_database();

-- 2. Verificar extensiones instaladas
SELECT * FROM pg_extension;

-- 3. Verificar que PostGIS esté instalado
SELECT PostGIS_version();

-- 4. Verificar que UUID esté disponible
SELECT uuid_generate_v4() as uuid_test;

-- 5. Listar todas las tablas creadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 6. Contar registros en cada tabla
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'rutas', COUNT(*) FROM rutas
UNION ALL
SELECT 'recorridos', COUNT(*) FROM recorridos
UNION ALL
SELECT 'puntos_gps', COUNT(*) FROM puntos_gps
UNION ALL
SELECT 'grupos_rodadas', COUNT(*) FROM grupos_rodadas
UNION ALL
SELECT 'participantes_grupo', COUNT(*) FROM participantes_grupo
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'productos_imagenes', COUNT(*) FROM productos_imagenes
UNION ALL
SELECT 'transacciones', COUNT(*) FROM transacciones
UNION ALL
SELECT 'eventos', COUNT(*) FROM eventos
UNION ALL
SELECT 'participantes_evento', COUNT(*) FROM participantes_evento;

-- 7. Verificar estructura de la tabla usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 8. Verificar índices creados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 9. Verificar foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 10. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 11. Probar inserción de datos de prueba
-- (Solo si quieres datos de prueba)

-- Usuario de prueba
INSERT INTO usuarios (
    email, 
    password_hash, 
    edad, 
    cumpleaños, 
    sexo, 
    nacionalidad, 
    tipo_perfil,
    logo
) VALUES (
    'admin@roller.com',
    '$2b$10$ejemplo_hash_aqui',  -- Reemplaza con hash real
    30,
    '1994-01-15',
    'masculino',
    'español',
    'administrador',
    'assets/logo.jpeg'
) ON CONFLICT (email) DO NOTHING;

-- 12. Verificar vista de estadísticas
SELECT * FROM vista_estadisticas_usuarios LIMIT 5;

-- Mensaje de éxito
SELECT '✅ Instalación verificada correctamente!' as mensaje;

