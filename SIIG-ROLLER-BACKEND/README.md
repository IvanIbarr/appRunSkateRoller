# SIIG-ROLLER-BACKEND

Backend API para SIIG Roller - Autenticación y Perfiles

## Descripción

Backend desarrollado con Node.js y Express que proporciona la API REST para la aplicación SIIG Roller. Incluye autenticación, gestión de usuarios y perfiles conectados a PostgreSQL.

## Stack Tecnológico

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos relacional
- **pg** - Cliente PostgreSQL para Node.js
- **bcrypt** - Hash de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **express-validator** - Validación de datos
- **helmet** - Seguridad HTTP
- **cors** - Configuración CORS

## Estructura del Proyecto

```
SIIG-ROLLER-BACKEND/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── models/
│   │   └── Usuario.js           # Modelo de Usuario
│   ├── services/
│   │   └── authService.js       # Lógica de negocio de autenticación
│   ├── controllers/
│   │   └── authController.js    # Controladores de autenticación
│   ├── routes/
│   │   └── authRoutes.js        # Rutas de autenticación
│   ├── middleware/
│   │   └── authMiddleware.js    # Middleware de autenticación JWT
│   └── server.js                # Punto de entrada del servidor
├── .env                         # Variables de entorno (no commiteado)
├── .env.example                 # Ejemplo de variables de entorno
└── package.json
```

## Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
   - Copia `.env.example` a `.env`
   - Ajusta las variables según tu configuración

3. **Asegúrate de que PostgreSQL esté corriendo:**
   - Base de datos: `siig_roller_db`
   - Usuario: `postgres`
   - Contraseña: `admin123` (o la que configuraste)

## Ejecutar

### Desarrollo (con nodemon - auto-reload):
```bash
npm run dev
```

### Producción:
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3001`

## Endpoints de API

### Autenticación

#### POST `/api/auth/login`
Iniciar sesión

**Body:**
```json
{
  "email": "admin@roller.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "usuario": {
    "id": "uuid",
    "email": "admin@roller.com",
    "edad": 30,
    "tipoPerfil": "administrador",
    ...
  },
  "token": "jwt_token_here"
}
```

#### POST `/api/auth/registro`
Registrar nuevo usuario

**Body:**
```json
{
  "email": "nuevo@roller.com",
  "password": "password123",
  "confirmPassword": "password123",
  "edad": 25,
  "cumpleaños": "1999-01-15",
  "sexo": "masculino",
  "nacionalidad": "español",
  "tipoPerfil": "roller"
}
```

**Response:**
```json
{
  "success": true,
  "usuario": { ... },
  "token": "jwt_token_here"
}
```

#### GET `/api/auth/me`
Obtener usuario actual (requiere autenticación)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "usuario": { ... }
}
```

### Health Check

#### GET `/health`
Verificar estado del servidor y conexión a la base de datos

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=siig_roller_db
DB_USER=postgres
DB_PASSWORD=admin123

JWT_SECRET=tu_secret_jwt_muy_seguro
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

## Seguridad

- ✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
- ✅ Tokens JWT para autenticación
- ✅ Helmet para seguridad HTTP
- ✅ Validación de datos con express-validator
- ✅ CORS configurado

## Próximos Pasos

- [ ] Implementar rate limiting
- [ ] Agregar logging estructurado
- [ ] Implementar tests
- [ ] Documentación con Swagger
- [ ] Refresh tokens
- [ ] Recuperación de contraseña

