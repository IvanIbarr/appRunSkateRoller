# Instrucciones Backend - SIIG Roller

## Configuración Inicial

### 1. Instalar Dependencias

```bash
cd SIIG-ROLLER-BACKEND
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=siig_roller_db
DB_USER=postgres
DB_PASSWORD=admin123

JWT_SECRET=siig_roller_secret_key_2024_cambiar_en_produccion
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### 3. Crear Usuarios de Prueba

```bash
node scripts/crear-usuarios-prueba.js
```

Esto creará 3 usuarios de prueba:
- `admin@roller.com` / `admin123` (administrador)
- `lider@roller.com` / `lider123` (liderGrupo)
- `roller@roller.com` / `roller123` (roller)

### 4. Iniciar el Servidor

**Desarrollo (con auto-reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará en: `http://localhost:3001`

## Verificar que Funciona

### Health Check

Abre tu navegador o usa curl:

```bash
curl http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### Probar Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roller.com","password":"admin123"}'
```

## Integración con Frontend

El frontend está configurado para conectarse a `http://localhost:3001/api`

**Asegúrate de:**
1. ✅ Backend corriendo en puerto 3001
2. ✅ Base de datos PostgreSQL conectada
3. ✅ Usuarios de prueba creados
4. ✅ Frontend configurado para usar la API

## Estructura del Proyecto

```
SIIG-ROLLER-BACKEND/
├── src/
│   ├── config/           # Configuración (DB)
│   ├── models/           # Modelos de datos
│   ├── services/         # Lógica de negocio
│   ├── controllers/      # Controladores
│   ├── routes/           # Rutas
│   ├── middleware/       # Middleware (auth, etc.)
│   └── server.js         # Servidor principal
├── scripts/              # Scripts utilitarios
└── package.json
```

## Endpoints Disponibles

### POST `/api/auth/login`
Login de usuario

### POST `/api/auth/registro`
Registro de nuevo usuario

### GET `/api/auth/me`
Obtener usuario actual (requiere autenticación)

### GET `/health`
Health check del servidor

## Troubleshooting

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que la base de datos `siig_roller_db` exista

### Error: "password authentication failed"
- Verifica la contraseña en `.env`
- Por defecto debería ser: `admin123`

### Error: CORS
- Verifica que `CORS_ORIGIN` en `.env` coincida con la URL del frontend
- Por defecto: `http://localhost:3000`

