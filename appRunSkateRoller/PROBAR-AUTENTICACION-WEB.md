# Probar Autenticación y Perfiles - Versión Web

## 🚀 Instrucciones para Probar

### 1. Asegúrate de que el Backend esté corriendo

El backend debe estar en: `http://localhost:3001`

Verifica con:
- Abre tu navegador en: `http://localhost:3001/health`
- Deberías ver: `{"status":"ok","database":"connected",...}`

### 2. Asegúrate de que el Frontend esté corriendo

El frontend debe estar en: `http://localhost:3000` (o el puerto que webpack asigne)

### 3. Abre la Aplicación en el Navegador

Abre Chrome o tu navegador preferido en: `http://localhost:3000`

---

## 🧪 Pruebas de Autenticación

### Prueba 1: Login con Usuario Existente

1. **En la pantalla de Login, ingresa:**
   - Email: `admin@roller.com`
   - Password: `admin123`

2. **Haz clic en "Iniciar Sesión"**

3. **Resultado esperado:**
   - Deberías ser redirigido a la pantalla Home
   - Verás la información del usuario:
     - Tipo de perfil: Administrador
     - Email: admin@roller.com
     - Edad: 30
     - Logo del perfil

### Prueba 2: Login con Otro Usuario

1. **Cierra sesión** (botón en Home)

2. **Intenta login con:**
   - Email: `lider@roller.com`
   - Password: `lider123`

3. **Resultado esperado:**
   - Tipo de perfil: Líder de Grupo

### Prueba 3: Login con Usuario Roller

1. **Cierra sesión**

2. **Intenta login con:**
   - Email: `roller@roller.com`
   - Password: `roller123`

3. **Resultado esperado:**
   - Tipo de perfil: Roller

---

## 📝 Pruebas de Registro

### Prueba 4: Registro de Nuevo Usuario

1. **En la pantalla de Login, haz clic en "Regístrate"**

2. **Completa el formulario:**
   - Email: `test@roller.com`
   - Password: `test123`
   - Confirmar Password: `test123`
   - Edad: `25`
   - Cumpleaños: Selecciona una fecha
   - Sexo: Selecciona una opción
   - Nacionalidad: Selecciona una opción
   - Tipo de Perfil: Selecciona una opción

3. **Haz clic en "Crear Cuenta"**

4. **Resultado esperado:**
   - Deberías ser redirigido a la pantalla Home
   - Verás la información del nuevo usuario
   - El usuario se guardará en PostgreSQL

### Prueba 5: Validaciones de Registro

1. **Intenta registrar con email ya existente:**
   - Email: `admin@roller.com`
   - Deberías ver un error: "El email ya está registrado"

2. **Intenta registrar con contraseñas que no coinciden:**
   - Password: `test123`
   - Confirmar Password: `test456`
   - Deberías ver un error

3. **Intenta registrar con campos vacíos:**
   - Deberías ver errores de validación

---

## 🔍 Verificar en la Base de Datos

Para verificar que los datos se guardan correctamente:

```powershell
$env:PATH += ";D:\curso kotlin\recursos de la app roller\PostgreSQL\16\bin"
$env:PGPASSWORD="admin123"
psql -U postgres -d siig_roller_db -c "SELECT email, tipo_perfil, edad FROM usuarios ORDER BY created_at DESC LIMIT 5;"
```

---

## 🐛 Troubleshooting

### Error: "No se puede acceder a este sitio web"

- Verifica que el backend esté corriendo en puerto 3001
- Verifica que el frontend esté corriendo
- Abre las herramientas de desarrollador (F12) y revisa la consola

### Error: "Network request failed" o CORS

- Verifica que el backend esté corriendo
- Verifica la URL en `src/config/api.ts`
- Revisa la consola del navegador para ver el error exacto

### Error: "Credenciales incorrectas"

- Verifica que los usuarios de prueba existan:
  ```bash
  cd SIIG-ROLLER-BACKEND
  node scripts/crear-usuarios-prueba.js
  ```

### La aplicación no carga

- Verifica que webpack esté corriendo sin errores
- Revisa la consola del terminal donde ejecutaste `npm run web`
- Asegúrate de que no haya errores de compilación

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo en http://localhost:3001
- [ ] Frontend corriendo en http://localhost:3000
- [ ] Puedo hacer login con admin@roller.com
- [ ] Puedo ver mi perfil en Home
- [ ] Puedo cerrar sesión
- [ ] Puedo registrar un nuevo usuario
- [ ] Los nuevos usuarios se guardan en la BD
- [ ] Las validaciones funcionan correctamente

---

## 📊 Flujo Completo de Prueba

1. ✅ Abre http://localhost:3000
2. ✅ Haz login con `admin@roller.com` / `admin123`
3. ✅ Verifica que ves el perfil del administrador
4. ✅ Cierra sesión
5. ✅ Haz clic en "Regístrate"
6. ✅ Crea un nuevo usuario
7. ✅ Verifica que puedes iniciar sesión con el nuevo usuario
8. ✅ Verifica en la BD que el usuario se guardó

¡Listo! 🎉

