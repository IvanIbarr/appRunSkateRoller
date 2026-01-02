# Solución: DBeaver no muestra las tablas

## ✅ Verificación Realizada

Las tablas **SÍ existen** en la base de datos. Se confirmó:
- ✅ 11 tablas creadas correctamente
- ✅ Base de datos `siig_roller_db` existe
- ✅ Todas las tablas están en el esquema `public`
- ✅ Estructura de tablas correcta

## 🔧 Soluciones para DBeaver

### Solución 1: Refrescar la Conexión (MÁS COMÚN)

1. En DBeaver, haz **click derecho** en tu conexión a PostgreSQL
2. Selecciona **"Refresh"** o **"Actualizar"**
3. Espera a que termine el refresh

O alternativamente:

1. Expande: **Databases** → **siig_roller_db**
2. Click derecho en **siig_roller_db** → **"Refresh"**
3. Expande **Schemas** → **public** → **Tables**

### Solución 2: Verificar que Estás en la Base de Datos Correcta

1. En DBeaver, verifica en la barra superior que estés conectado a:
   - **Host:** `localhost`
   - **Database:** `siig_roller_db` (no `postgres`)
   - **User:** `postgres`

2. Si estás en otra base de datos:
   - Click derecho en la conexión
   - Selecciona **"Edit Connection"**
   - En "Database", cambia a: `siig_roller_db`
   - Guarda y reconecta

### Solución 3: Ejecutar Script de Verificación

1. En DBeaver, abre un **SQL Editor** nuevo
2. Asegúrate de estar conectado a `siig_roller_db`
3. Ejecuta el archivo `verificar-tablas-dbeaver.sql`
4. Esto mostrará todas las tablas que existen

### Solución 4: Buscar Manualmente en el Árbol

En DBeaver, navega por este árbol:

```
📁 Databases
  └── 📁 PostgreSQL (localhost:5432)
      └── 📁 Databases
          └── 📁 siig_roller_db  ⬅️ Asegúrate de estar aquí
              └── 📁 Schemas
                  └── 📁 public
                      └── 📁 Tables  ⬅️ Aquí deberían estar las 11 tablas
```

### Solución 5: Verificar Permisos

1. En DBeaver, ejecuta este SQL:
```sql
SELECT current_user, current_database();
```

2. Deberías ver:
   - `current_user`: `postgres`
   - `current_database`: `siig_roller_db`

Si no, reconecta con el usuario correcto.

### Solución 6: Recrear la Conexión

Si nada funciona:

1. **Crea una nueva conexión** en DBeaver:
   - Click derecho en "Database Connections" → "New"
   - Selecciona **PostgreSQL**
   - Configuración:
     - **Host:** `localhost`
     - **Port:** `5432`
     - **Database:** `siig_roller_db`
     - **Username:** `postgres`
     - **Password:** `admin123`
   - Test Connection
   - Finish

2. **Conecta a esta nueva conexión**

## 📋 Script de Verificación Rápida

Ejecuta este SQL en DBeaver para verificar:

```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver 11 tablas:
1. eventos
2. grupos_rodadas
3. participantes_evento
4. participantes_grupo
5. productos
6. productos_imagenes
7. puntos_gps
8. recorridos
9. rutas
10. transacciones
11. usuarios

## 🔍 Verificar Estructura de una Tabla

Para ver la estructura de la tabla `usuarios`:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'usuarios'
ORDER BY ordinal_position;
```

## ⚠️ Problema Común: Conexión a Base de Datos Incorrecta

**El problema más común es estar conectado a la base de datos `postgres` en lugar de `siig_roller_db`.**

### Verificar en DBeaver:

1. Mira la barra de estado inferior de DBeaver
2. Debe mostrar: `siig_roller_db` (no `postgres`)

### Si estás en `postgres`:

1. En el SQL Editor, ejecuta:
```sql
\c siig_roller_db
```

O cambia la conexión en DBeaver para apuntar a `siig_roller_db`.

## ✅ Si Todavía No Ves las Tablas

1. Ejecuta el script `verificar-tablas-dbeaver.sql` en DBeaver
2. Comparte los resultados
3. O toma una captura de pantalla del árbol de DBeaver
4. Verifica que el SQL Editor muestre `siig_roller_db` como base de datos actual

