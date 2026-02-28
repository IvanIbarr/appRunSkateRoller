# 🚀 Guía Rápida - Probar Autenticación en Web

## Paso 1: Iniciar el Backend

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-BACKEND"
npm run dev
```

Deberías ver:
```
✅ Conectado a PostgreSQL
🚀 Servidor corriendo en http://localhost:3001
```

## Paso 2: Iniciar el Frontend (Web)

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run web
```

Deberías ver algo como:
```
webpack compiled successfully
```

## Paso 3: Abrir en el Navegador

Abre Chrome y ve a: **http://localhost:3000**

---

## 🧪 Pruebas Rápidas

### ✅ Prueba 1: Login

1. En la pantalla de Login, ingresa:
   - **Email:** `admin@roller.com`
   - **Password:** `admin123`

2. Haz clic en **"Iniciar Sesión"**

3. **Resultado esperado:**
   - ✅ Redirige a Home
   - ✅ Muestra el perfil del administrador
   - ✅ Muestra: Email, Edad, Tipo de Perfil

### ✅ Prueba 2: Registro

1. Haz clic en **"Regístrate"**

2. Completa el formulario:
   - Email: `test@roller.com`
   - Password: `test123`
   - Confirmar Password: `test123`
   - Edad: `25`
   - Cumpleaños: (selecciona una fecha)
   - Sexo: (selecciona una opción)
   - Nacionalidad: (selecciona una opción)
   - Tipo de Perfil: `roller`

3. Haz clic en **"Crear Cuenta"**

4. **Resultado esperado:**
   - ✅ Redirige a Home
   - ✅ Muestra el nuevo usuario creado
   - ✅ Usuario guardado en PostgreSQL

### ✅ Prueba 3: Cerrar Sesión

1. En Home, haz clic en **"Cerrar Sesión"**

2. **Resultado esperado:**
   - ✅ Vuelve a la pantalla de Login
   - ✅ Token eliminado

### ✅ Prueba 4: Login con Nuevo Usuario

1. Inicia sesión con el usuario que acabas de crear:
   - Email: `test@roller.com`
   - Password: `test123`

2. **Resultado esperado:**
   - ✅ Login exitoso
   - ✅ Muestra el perfil correcto

---

## 🔍 Verificar en la Base de Datos

Para verificar que los datos se guardan:

```powershell
$env:PATH += ";D:\curso kotlin\recursos de la app roller\PostgreSQL\16\bin"
$env:PGPASSWORD="admin123"
psql -U postgres -d siig_roller_db -c "SELECT email, tipo_perfil, edad, created_at FROM usuarios ORDER BY created_at DESC LIMIT 5;"
```

---

## 🐛 Si Algo No Funciona

### Error: "No se puede acceder a este sitio web"

**Backend no está corriendo:**
- Verifica en la terminal del backend
- Verifica: http://localhost:3001/health
- Debe mostrar: `{"status":"ok","database":"connected"}`

**Frontend no está corriendo:**
- Verifica en la terminal del frontend
- Verifica que webpack compile sin errores
- Revisa el puerto (debería ser 3000)

### Error: "Network request failed" o CORS

- Abre la consola del navegador (F12)
- Revisa la pestaña "Network"
- Verifica que el backend esté en puerto 3001
- Verifica que no haya errores de CORS

### Error: "Credenciales incorrectas"

- Verifica que los usuarios de prueba existan:
  ```bash
  cd SIIG-ROLLER-BACKEND
  node scripts/crear-usuarios-prueba.js
  ```

---

## ✅ Checklist

- [ ] Backend corriendo en http://localhost:3001
- [ ] Frontend corriendo en http://localhost:3000
- [ ] Puedo hacer login con admin@roller.com
- [ ] Puedo ver mi perfil en Home
- [ ] Puedo cerrar sesión
- [ ] Puedo registrar un nuevo usuario
- [ ] Los nuevos usuarios se guardan en la BD

---

## 📊 Usuarios de Prueba Disponibles

1. **Administrador**
   - Email: `admin@roller.com`
   - Password: `admin123`

2. **Líder de Grupo**
   - Email: `lider@roller.com`
   - Password: `lider123`

3. **Roller**
   - Email: `roller@roller.com`
   - Password: `roller123`

---

¡Listo para probar! 🎉

