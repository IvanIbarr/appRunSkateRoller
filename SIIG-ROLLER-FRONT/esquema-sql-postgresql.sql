-- ============================================================
-- Esquema de Base de Datos PostgreSQL - RunSkateRoller
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para funcionalidades geoespaciales

-- ============================================================
-- TIPOS ENUM
-- ============================================================

CREATE TYPE tipo_sexo AS ENUM ('masculino', 'femenino', 'ambos');
CREATE TYPE tipo_nacionalidad AS ENUM ('español', 'inglés');
CREATE TYPE tipo_perfil AS ENUM ('administrador', 'liderGrupo', 'roller');
CREATE TYPE estado_ruta AS ENUM ('planificada', 'enProgreso', 'completada');
CREATE TYPE estado_grupo AS ENUM ('activo', 'finalizado', 'cancelado');
CREATE TYPE estado_producto AS ENUM ('disponible', 'vendido', 'reservado');
CREATE TYPE estado_transaccion AS ENUM ('pendiente', 'completada', 'cancelada', 'reembolsada');

-- ============================================================
-- TABLA: USUARIOS
-- ============================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    edad INTEGER NOT NULL CHECK (edad >= 13),
    cumpleaños DATE NOT NULL,
    sexo tipo_sexo NOT NULL,
    nacionalidad tipo_nacionalidad NOT NULL,
    tipo_perfil tipo_perfil NOT NULL DEFAULT 'roller',
    foto_perfil TEXT,
    logo TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo_perfil ON usuarios(tipo_perfil);
CREATE INDEX idx_usuarios_fecha_registro ON usuarios(fecha_registro);

-- ============================================================
-- TABLA: RUTAS
-- ============================================================

CREATE TABLE rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    origen_lat DECIMAL(10, 8) NOT NULL,
    origen_lng DECIMAL(11, 8) NOT NULL,
    destino_lat DECIMAL(10, 8) NOT NULL,
    destino_lng DECIMAL(11, 8) NOT NULL,
    distancia DECIMAL(10, 2), -- en kilómetros
    duracion_estimada INTEGER, -- en minutos
    creador_id UUID NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado estado_ruta NOT NULL DEFAULT 'planificada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rutas_creador FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para rutas
CREATE INDEX idx_rutas_creador_id ON rutas(creador_id);
CREATE INDEX idx_rutas_estado ON rutas(estado);
CREATE INDEX idx_rutas_fecha_creacion ON rutas(fecha_creacion);
-- Índice geoespacial para búsquedas por ubicación
CREATE INDEX idx_rutas_origen_geo ON rutas USING GIST (ST_MakePoint(origen_lng, origen_lat));
CREATE INDEX idx_rutas_destino_geo ON rutas USING GIST (ST_MakePoint(destino_lng, destino_lat));

-- ============================================================
-- TABLA: RECORRIDOS
-- ============================================================

CREATE TABLE recorridos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL,
    ruta_id UUID,
    distancia_real DECIMAL(10, 2), -- en kilómetros
    duracion_real INTEGER, -- en segundos
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    velocidad_promedio DECIMAL(6, 2), -- en km/h
    velocidad_maxima DECIMAL(6, 2), -- en km/h
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recorridos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_recorridos_ruta FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE SET NULL
);

-- Índices para recorridos
CREATE INDEX idx_recorridos_usuario_id ON recorridos(usuario_id);
CREATE INDEX idx_recorridos_ruta_id ON recorridos(ruta_id);
CREATE INDEX idx_recorridos_fecha_inicio ON recorridos(fecha_inicio);
CREATE INDEX idx_recorridos_fecha_inicio_usuario ON recorridos(usuario_id, fecha_inicio);

-- ============================================================
-- TABLA: PUNTOS_GPS
-- ============================================================

CREATE TABLE puntos_gps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recorrido_id UUID NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    orden INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_puntos_gps_recorrido FOREIGN KEY (recorrido_id) REFERENCES recorridos(id) ON DELETE CASCADE
);

-- Índices para puntos_gps
CREATE INDEX idx_puntos_gps_recorrido_id ON puntos_gps(recorrido_id);
CREATE INDEX idx_puntos_gps_recorrido_orden ON puntos_gps(recorrido_id, orden);
-- Índice geoespacial
CREATE INDEX idx_puntos_gps_geo ON puntos_gps USING GIST (ST_MakePoint(lng, lat));

-- ============================================================
-- TABLA: GRUPOS_RODADAS
-- ============================================================

CREATE TABLE grupos_rodadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    lider_id UUID NOT NULL,
    ruta_id UUID NOT NULL,
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    estado estado_grupo NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grupos_lider FOREIGN KEY (lider_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_grupos_ruta FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE RESTRICT
);

-- Índices para grupos_rodadas
CREATE INDEX idx_grupos_lider_id ON grupos_rodadas(lider_id);
CREATE INDEX idx_grupos_ruta_id ON grupos_rodadas(ruta_id);
CREATE INDEX idx_grupos_estado ON grupos_rodadas(estado);
CREATE INDEX idx_grupos_fecha_inicio ON grupos_rodadas(fecha_hora_inicio);

-- ============================================================
-- TABLA: PARTICIPANTES_GRUPO
-- ============================================================

CREATE TABLE participantes_grupo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha_union TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participantes_grupo FOREIGN KEY (grupo_id) REFERENCES grupos_rodadas(id) ON DELETE CASCADE,
    CONSTRAINT fk_participantes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT uq_participante_grupo UNIQUE (grupo_id, usuario_id)
);

-- Índices para participantes_grupo
CREATE INDEX idx_participantes_grupo_id ON participantes_grupo(grupo_id);
CREATE INDEX idx_participantes_usuario_id ON participantes_grupo(usuario_id);

-- ============================================================
-- TABLA: PRODUCTOS (Marketplace)
-- ============================================================

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    estado estado_producto NOT NULL DEFAULT 'disponible',
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_productos_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para productos
CREATE INDEX idx_productos_vendedor_id ON productos(vendedor_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_fecha_publicacion ON productos(fecha_publicacion);
CREATE INDEX idx_productos_titulo ON productos USING GIN (to_tsvector('spanish', titulo));

-- ============================================================
-- TABLA: PRODUCTOS_IMAGENES
-- ============================================================

CREATE TABLE productos_imagenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL,
    url_imagen TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_productos_imagenes_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Índices para productos_imagenes
CREATE INDEX idx_productos_imagenes_producto_id ON productos_imagenes(producto_id);
CREATE INDEX idx_productos_imagenes_orden ON productos_imagenes(producto_id, orden);

-- ============================================================
-- TABLA: TRANSACCIONES
-- ============================================================

CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL,
    comprador_id UUID NOT NULL,
    vendedor_id UUID NOT NULL,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto >= 0),
    estado estado_transaccion NOT NULL DEFAULT 'pendiente',
    fecha_transaccion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transacciones_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transacciones_comprador FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transacciones_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_comprador_vendedor CHECK (comprador_id != vendedor_id)
);

-- Índices para transacciones
CREATE INDEX idx_transacciones_producto_id ON transacciones(producto_id);
CREATE INDEX idx_transacciones_comprador_id ON transacciones(comprador_id);
CREATE INDEX idx_transacciones_vendedor_id ON transacciones(vendedor_id);
CREATE INDEX idx_transacciones_estado ON transacciones(estado);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha_transaccion);

-- ============================================================
-- TABLA: EVENTOS
-- ============================================================

CREATE TABLE eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    punto_encuentro_lat DECIMAL(10, 8) NOT NULL,
    punto_encuentro_lng DECIMAL(11, 8) NOT NULL,
    punto_encuentro_direccion VARCHAR(500),
    organizador_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eventos_organizador FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- Índices para eventos
CREATE INDEX idx_eventos_organizador_id ON eventos(organizador_id);
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_fecha_hora ON eventos(fecha, hora);
-- Índice geoespacial
CREATE INDEX idx_eventos_geo ON eventos USING GIST (ST_MakePoint(punto_encuentro_lng, punto_encuentro_lat));

-- ============================================================
-- TABLA: PARTICIPANTES_EVENTO
-- ============================================================

CREATE TABLE participantes_evento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participantes_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_participantes_evento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT uq_participante_evento UNIQUE (evento_id, usuario_id)
);

-- Índices para participantes_evento
CREATE INDEX idx_participantes_evento_id ON participantes_evento(evento_id);
CREATE INDEX idx_participantes_evento_usuario_id ON participantes_evento(usuario_id);

-- ============================================================
-- TRIGGERS para updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rutas_updated_at BEFORE UPDATE ON rutas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recorridos_updated_at BEFORE UPDATE ON recorridos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grupos_rodadas_updated_at BEFORE UPDATE ON grupos_rodadas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacciones_updated_at BEFORE UPDATE ON transacciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: Estadísticas de usuarios
CREATE OR REPLACE VIEW vista_estadisticas_usuarios AS
SELECT 
    u.id,
    u.email,
    u.tipo_perfil,
    COUNT(DISTINCT r.id) AS total_recorridos,
    COALESCE(SUM(r.distancia_real), 0) AS total_kilometros,
    COALESCE(AVG(r.velocidad_promedio), 0) AS velocidad_promedio_general,
    COUNT(DISTINCT CASE WHEN r.fecha_inicio >= CURRENT_DATE - INTERVAL '7 days' THEN r.id END) AS recorridos_semana,
    COUNT(DISTINCT CASE WHEN r.fecha_inicio >= CURRENT_DATE - INTERVAL '30 days' THEN r.id END) AS recorridos_mes
FROM usuarios u
LEFT JOIN recorridos r ON u.id = r.usuario_id
GROUP BY u.id, u.email, u.tipo_perfil;

-- Vista: Productos con primera imagen
CREATE OR REPLACE VIEW vista_productos_con_imagen AS
SELECT 
    p.*,
    pi.url_imagen AS imagen_principal
FROM productos p
LEFT JOIN LATERAL (
    SELECT url_imagen 
    FROM productos_imagenes 
    WHERE producto_id = p.id 
    ORDER BY orden 
    LIMIT 1
) pi ON true;

-- ============================================================
-- COMENTARIOS SOBRE LAS TABLAS
-- ============================================================

COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE rutas IS 'Rutas planificadas para recorridos';
COMMENT ON TABLE recorridos IS 'Historial de recorridos realizados por los usuarios';
COMMENT ON TABLE puntos_gps IS 'Puntos GPS registrados durante un recorrido';
COMMENT ON TABLE grupos_rodadas IS 'Grupos de usuarios rodando juntos';
COMMENT ON TABLE participantes_grupo IS 'Relación muchos a muchos entre usuarios y grupos';
COMMENT ON TABLE productos IS 'Productos del marketplace';
COMMENT ON TABLE productos_imagenes IS 'Imágenes asociadas a los productos';
COMMENT ON TABLE transacciones IS 'Transacciones de compra/venta en el marketplace';
COMMENT ON TABLE eventos IS 'Eventos del calendario comunitario';
COMMENT ON TABLE participantes_evento IS 'Relación muchos a muchos entre usuarios y eventos';

