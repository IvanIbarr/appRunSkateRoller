# Guía para Iniciar el Backend

## Pasos para iniciar el servidor

### 1. Verificar que PostgreSQL esté corriendo
```powershell
# Verificar si PostgreSQL está corriendo
Get-Service -Name postgresql*
```

Si no está corriendo, inícialo:
```powershell
Start-Service postgresql-x64-16  # Ajusta el nombre según tu versión
```

### 2. Navegar al directorio del backend
```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-BACKEND"
```

### 3. Verificar variables de entorno (opcional)
Crea un archivo `.env` si no existe:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=siig_roller_db
DB_USER=postgres
DB_PASSWORD=admin123
PORT=3001
```

### 4. Iniciar el servidor

**Opción A: Modo desarrollo (con nodemon - auto-reload)**
```powershell
npm run dev
```

**Opción B: Modo producción**
```powershell
npm start
```

**Opción C: Directamente con Node**
```powershell
node src/server.js
```

### 5. Verificar que está funcionando

Abre otra terminal y ejecuta:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET
```

Deberías ver una respuesta JSON con el estado del servidor.

## Solución de Problemas

### Error: "No se puede conectar a PostgreSQL"
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env` o en `src/config/database.js`
- Prueba conectarte manualmente con psql

### Error: "Puerto 3001 en uso"
```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr :3001

# Matar el proceso (reemplaza PID con el número que aparezca)
taskkill /PID <PID> /F
```

### Error: "Cannot find module"
```powershell
# Reinstalar dependencias
npm install
```

## Verificación Rápida

Una vez iniciado, deberías ver en la consola:
```
✅ Conectado a PostgreSQL
✅ Conexión a la base de datos exitosa: [fecha]
🚀 Servidor corriendo en http://localhost:3001
📊 Ambiente: development
```

