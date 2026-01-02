# Instrucciones Completas - Autenticación con Base de Datos

## ✅ Estado: Sistema Completo Implementado

La capa de presentación está integrada con el backend y la base de datos PostgreSQL.

---

## 📋 Pasos para Ejecutar el Sistema Completo

### 1. Asegúrate de que PostgreSQL esté corriendo

```powershell
# Verificar que el servicio esté activo
Get-Service postgresql*
```

Si no está corriendo, inícialo desde los servicios de Windows.

### 2. Verificar que la base de datos existe

```powershell
$env:PATH += ";D:\curso kotlin\recursos de la app roller\PostgreSQL\16\bin"
$env:PGPASSWORD="admin123"
psql -U postgres -d siig_roller_db -c "\dt"
```

Debes ver 11 tablas.

### 3. Iniciar el Backend

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-BACKEND"
npm install  # Solo la primera vez
npm run dev
```

Deberías ver:
```
✅ Conectado a PostgreSQL
✅ Conexión a la base de datos exitosa
🚀 Servidor corriendo en http://localhost:3001
```

### 4. Crear Usuarios de Prueba (Solo primera vez)

En otra terminal:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-BACKEND"
node scripts/crear-usuarios-prueba.js
```

Verás:
```
✅ Usuario creado: admin@roller.com (administrador)
✅ Usuario creado: lider@roller.com (liderGrupo)
✅ Usuario creado: roller@roller.com (roller)
```

### 5. Iniciar el Frontend

#### Para Web:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm start  # Metro Bundler en una terminal
npm run web  # En otra terminal
```

Abre: `http://localhost:3000`

#### Para Android:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm start  # Metro Bundler
npm run android  # En otra terminal
```

---

## 🧪 Probar la Aplicación

### Login

1. Abre la aplicación
2. Ingresa:
   - Email: `admin@roller.com`
   - Password: `admin123`
3. Haz clic en "Iniciar Sesión"
4. Deberías ver la pantalla Home con la información del usuario

### Registro

1. En la pantalla de Login, haz clic en "Regístrate"
2. Completa el formulario:
   - Email: `nuevo@roller.com`
   - Password: `password123`
   - Confirmar Password: `password123`
   - Edad: `25`
   - Sexo: Selecciona una opción
   - Nacionalidad: Selecciona una opción
   - Tipo de Perfil: Selecciona una opción
3. Haz clic en "Crear Cuenta"
4. Deberías ser redirigido al Home

---

## 🔍 Verificar que Todo Funciona

### Backend

1. **Health Check:**
   - Abre: `http://localhost:3001/health`
   - Deberías ver: `{"status":"ok","database":"connected",...}`

2. **Probar Login con curl:**
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@roller.com\",\"password\":\"admin123\"}'
```

### Base de Datos

Ver usuarios creados:

```powershell
$env:PATH += ";D:\curso kotlin\recursos de la app roller\PostgreSQL\16\bin"
$env:PGPASSWORD="admin123"
psql -U postgres -d siig_roller_db -c "SELECT email, tipo_perfil FROM usuarios;"
```

---

## ⚠️ Notas Importantes

### Para Android/Dispositivo Físico

Si pruebas en un dispositivo físico o emulador Android:

1. **Cambiar localhost por IP:**
   - Encuentra tu IP local: `ipconfig` (busca IPv4)
   - Ejemplo: `192.168.1.100`
   - Edita `src/config/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://192.168.1.100:3001/api';
   ```

2. **Asegúrate de que el dispositivo y la computadora estén en la misma red WiFi**

### CORS

El backend está configurado para aceptar requests desde `http://localhost:3000`

Si usas otra URL, edita `.env` en el backend:
```
CORS_ORIGIN=http://tu-url-aqui:puerto
```

---

## 📁 Estructura del Proyecto

```
D:\curso kotlin\recursos de la app roller\
├── SIIG-ROLLER-FRONT/        # Frontend React Native
│   ├── src/
│   │   ├── config/
│   │   │   └── api.ts        # Configuración API
│   │   ├── services/
│   │   │   ├── apiService.ts # Servicio HTTP
│   │   │   └── authService.ts # Autenticación
│   │   └── ...
│   └── ...
│
└── SIIG-ROLLER-BACKEND/       # Backend Node.js/Express
    ├── src/
    │   ├── config/
    │   │   └── database.js    # Conexión PostgreSQL
    │   ├── models/
    │   │   └── Usuario.js     # Modelo de usuario
    │   ├── services/
    │   │   └── authService.js # Lógica de autenticación
    │   ├── controllers/
    │   │   └── authController.js
    │   ├── routes/
    │   │   └── authRoutes.js
    │   ├── middleware/
    │   │   └── authMiddleware.js
    │   └── server.js
    └── ...
```

---

## ✅ Checklist de Verificación

- [ ] PostgreSQL corriendo
- [ ] Base de datos `siig_roller_db` existe
- [ ] Tablas creadas (11 tablas)
- [ ] Backend corriendo en puerto 3001
- [ ] Usuarios de prueba creados
- [ ] Frontend corriendo
- [ ] Puedes hacer login
- [ ] Puedes registrar nuevos usuarios
- [ ] La información se guarda en PostgreSQL

---

## 🐛 Solución de Problemas

### Backend no se conecta a la BD
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales en `.env`
- Verifica que la BD `siig_roller_db` exista

### Frontend no se conecta al backend
- Verifica que el backend esté corriendo
- Verifica la URL en `src/config/api.ts`
- Si usas dispositivo físico, usa la IP local en lugar de localhost

### Error 401/403
- El token puede haber expirado
- Cierra sesión y vuelve a iniciar
- Verifica que el backend esté generando tokens correctamente

---

## 🎉 ¡Listo!

El sistema de autenticación y perfiles está completamente funcional con:
- ✅ Frontend React Native
- ✅ Backend Node.js/Express
- ✅ Base de datos PostgreSQL
- ✅ Autenticación JWT
- ✅ Hash de contraseñas
- ✅ Validación de datos

