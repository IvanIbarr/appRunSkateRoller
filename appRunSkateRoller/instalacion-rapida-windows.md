# Guía Rápida de Instalación - Windows

## Instalación Rápida de PostgreSQL en Windows

### Paso 1: Descargar e Instalar PostgreSQL

1. **Descarga PostgreSQL 15 o 16:**
   ```
   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   ```

2. **Ejecuta el instalador:**
   - Click en "Download" para Windows x86-64
   - Ejecuta el archivo `.exe` descargado
   - Sigue el asistente:
     - ✅ Marca "Add PostgreSQL to PATH"
     - Puerto: `5432` (default)
     - Usuario: `postgres`
     - **CONTRASEÑA**: Anota esta contraseña (ejemplo: `admin123`)
     - Locale: `Spanish, Mexico`

3. **Completa la instalación** y cierra el instalador.

### Paso 2: Instalar PostGIS

1. **Abre Stack Builder** (debería haberse instalado con PostgreSQL)
2. Selecciona tu instalación de PostgreSQL
3. Expande "Spatial Extensions"
4. Marca "PostGIS Bundle"
5. Sigue el asistente para instalar

**O descarga manualmente:**
```
https://postgis.net/windows_downloads/
```

### Paso 3: Abrir pgAdmin y Crear Base de Datos

1. **Abre pgAdmin 4** desde el menú de inicio
2. **Conecta al servidor:**
   - Click derecho en "Servers" → "Create" → "Server"
   - Name: `Local PostgreSQL`
   - Tab "Connection":
     - Host: `localhost`
     - Port: `5432`
     - Username: `postgres`
     - Password: `tu_contraseña`
   - Click "Save"

3. **Crear la base de datos:**
   - Expande "Servers" → "Local PostgreSQL" → "Databases"
   - Click derecho → "Create" → "Database"
   - Database: `siig_roller_db`
   - Owner: `postgres`
   - Click "Save"

### Paso 4: Ejecutar el Script SQL

1. En pgAdmin, click derecho en `siig_roller_db` → **Query Tool**
2. Abre el archivo `esquema-sql-postgresql.sql`
3. Copia TODO el contenido
4. Pégalo en el Query Tool
5. Click en **Execute** (⚡) o presiona `F5`
6. Espera a que termine (verás mensajes de éxito)

### Paso 5: Verificar Instalación

1. En el Query Tool, ejecuta:
   ```sql
   \dt
   ```
   O usando pgAdmin: Expande `siig_roller_db` → `Schemas` → `public` → `Tables`

2. Deberías ver 11 tablas:
   - usuarios
   - rutas
   - recorridos
   - puntos_gps
   - grupos_rodadas
   - participantes_grupo
   - productos
   - productos_imagenes
   - transacciones
   - eventos
   - participantes_evento

### Paso 6: Ejecutar Script de Verificación (Opcional)

1. En el Query Tool, abre `verificar-instalacion.sql`
2. Ejecuta todo el script
3. Verifica que no haya errores

## ✅ ¡Listo!

Tu base de datos está lista para usar. Para conectarte desde tu aplicación Node.js, usa:

```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'siig_roller_db',
  user: 'postgres',
  password: 'tu_contraseña_aqui'
}
```

## Problemas Comunes

### "psql no se reconoce"
- Reinicia tu terminal/PowerShell
- O agrega manualmente al PATH: `C:\Program Files\PostgreSQL\15\bin`

### "Error de contraseña"
- Verifica que la contraseña sea correcta
- Si la olvidaste, puedes cambiarla desde pgAdmin

### "PostGIS no encontrado"
- Instala PostGIS desde Stack Builder
- O descarga manualmente desde: https://postgis.net/windows_downloads/

