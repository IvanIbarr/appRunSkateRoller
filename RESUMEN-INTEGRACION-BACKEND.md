# Resumen - Integración Backend con Frontend

## ✅ Estado: COMPLETADO

La capa de presentación (frontend) ahora está integrada con el backend y la base de datos PostgreSQL.

---

## 📦 Componentes Creados

### Backend (SIIG-ROLLER-BACKEND)

✅ **Estructura completa del backend:**
- `src/config/database.js` - Conexión a PostgreSQL
- `src/models/Usuario.js` - Modelo de usuario
- `src/services/authService.js` - Lógica de autenticación
- `src/controllers/authController.js` - Controladores
- `src/routes/authRoutes.js` - Rutas de API
- `src/middleware/authMiddleware.js` - Middleware JWT
- `src/server.js` - Servidor Express

✅ **Funcionalidades implementadas:**
- Login de usuarios
- Registro de usuarios
- Hash de contraseñas con bcrypt
- Autenticación JWT
- Validación de datos
- CORS configurado
- Seguridad con Helmet

### Frontend (SIIG-ROLLER-FRONT)

✅ **Actualizaciones realizadas:**
- `src/config/api.ts` - Configuración de API
- `src/services/apiService.ts` - Servicio HTTP genérico
- `src/services/authService.ts` - Actualizado para usar API real
- `src/types/index.ts` - Tipos actualizados

---

## 🔧 Configuración

### Backend

**Archivo `.env`:**
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

### Frontend

**Configuración de API:**
- URL base: `http://localhost:3001/api` (desarrollo)
- Endpoints configurados automáticamente

---

## 🚀 Cómo Ejecutar

### 1. Iniciar Backend

```bash
cd SIIG-ROLLER-BACKEND
npm install  # Solo la primera vez
npm run dev  # Desarrollo (con auto-reload)
```

El backend estará en: `http://localhost:3001`

### 2. Crear Usuarios de Prueba (Solo primera vez)

```bash
cd SIIG-ROLLER-BACKEND
node scripts/crear-usuarios-prueba.js
```

### 3. Iniciar Frontend

```bash
cd SIIG-ROLLER-FRONT
npm start  # Metro Bundler
```

En otra terminal:
```bash
npm run android  # Para Android
# o
npm run web      # Para web
```

---

## 📡 Endpoints de API

### POST `/api/auth/login`
Login de usuario

**Request:**
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

### POST `/api/auth/registro`
Registro de nuevo usuario

**Request:**
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

### GET `/api/auth/me`
Obtener usuario actual (requiere token)

**Headers:**
```
Authorization: Bearer <token>
```

---

## 👥 Usuarios de Prueba

Los siguientes usuarios están creados en la base de datos:

1. **Administrador**
   - Email: `admin@roller.com`
   - Password: `admin123`
   - Tipo: `administrador`

2. **Líder de Grupo**
   - Email: `lider@roller.com`
   - Password: `lider123`
   - Tipo: `liderGrupo`

3. **Roller**
   - Email: `roller@roller.com`
   - Password: `roller123`
   - Tipo: `roller`

---

## ✅ Funcionalidades Implementadas

### Autenticación
- ✅ Login con email y contraseña
- ✅ Registro con todos los campos requeridos
- ✅ Hash de contraseñas (bcrypt)
- ✅ Tokens JWT
- ✅ Validación de datos
- ✅ Manejo de errores

### Perfiles
- ✅ Tres tipos de perfil: administrador, liderGrupo, roller
- ✅ Campos: edad, cumpleaños, sexo, correo, nacionalidad
- ✅ Logo del perfil

### Integración
- ✅ Frontend conectado al backend
- ✅ Persistencia en PostgreSQL
- ✅ Autenticación JWT
- ✅ Caché local (AsyncStorage)

---

## 🔄 Flujo de Autenticación

1. **Usuario ingresa credenciales** → Frontend (LoginScreen)
2. **Frontend envía request** → Backend (`/api/auth/login`)
3. **Backend verifica credenciales** → PostgreSQL
4. **Backend genera token JWT** → Responde al Frontend
5. **Frontend guarda token** → AsyncStorage
6. **Frontend navega** → HomeScreen

---

## 📝 Próximos Pasos Sugeridos

1. ✅ Backend funcionando
2. ✅ Frontend conectado
3. 🔄 Agregar validación de fecha de cumpleaños
4. 🔄 Implementar refresh tokens
5. 🔄 Agregar recuperación de contraseña
6. 🔄 Mejorar manejo de errores
7. 🔄 Agregar tests

---

## 🐛 Troubleshooting

### El backend no inicia
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que la base de datos `siig_roller_db` exista

### El frontend no se conecta
- Verifica que el backend esté corriendo en puerto 3001
- Verifica la configuración de CORS en el backend
- Revisa la consola del navegador/terminal para errores

### Error 401 (No autorizado)
- Verifica que el token esté guardado correctamente
- Verifica que el token no haya expirado
- Intenta cerrar sesión y volver a iniciar

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales
- Verifica que las tablas estén creadas

