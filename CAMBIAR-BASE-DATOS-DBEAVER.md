# Cambiar Base de Datos en DBeaver

## Opción 1: Editar la Conexión Existente (Recomendado)

### Paso a Paso:

1. **En el panel izquierdo de DBeaver:**
   - Busca tu conexión a PostgreSQL (generalmente se llama algo como "PostgreSQL - localhost" o similar)
   - Haz **click derecho** en la conexión

2. **Selecciona "Edit Connection"** (o "Editar Conexión" en español)

3. **En la ventana que se abre:**
   - Ve a la pestaña **"Main"** o **"Principal"**
   - Busca el campo **"Database"** o **"Base de datos"**
   - Cambia el valor de `postgres` a: **`siig_roller_db`**

4. **Opcional - Cambiar el nombre de la conexión:**
   - En el campo **"Connection name"** puedes poner: `SIIG Roller DB` (opcional, para identificarla mejor)

5. **Haz clic en "Test Connection"** para verificar que funciona

6. **Haz clic en "OK"** o "Save" para guardar

7. **Reconecta:**
   - Click derecho en la conexión → **"Disconnect"**
   - Luego click derecho → **"Connect"**

8. **Ahora expande:**
   - Databases → **siig_roller_db** → Schemas → public → Tables
   - Deberías ver las 11 tablas

---

## Opción 2: Cambiar Base de Datos desde el SQL Editor

Si ya tienes el SQL Editor abierto:

1. **En el SQL Editor de DBeaver:**
   - Mira la barra superior del editor
   - Hay un dropdown que dice "Database:" o "Base de datos:"
   - Haz clic en ese dropdown
   - Selecciona **`siig_roller_db`**

2. **O ejecuta este comando SQL:**
```sql
\c siig_roller_db
```

Pero esto solo funciona si estás usando el modo psql. En DBeaver, mejor usa el dropdown.

---

## Opción 3: Crear una Nueva Conexión Específica

Si prefieres tener una conexión dedicada solo para `siig_roller_db`:

### Pasos:

1. **Click derecho** en "Database Connections" o en el panel de conexiones
   - Selecciona **"New"** → **"Database Connection"**

2. **Selecciona PostgreSQL:**
   - Busca y selecciona **PostgreSQL**
   - Click en **"Next"**

3. **Configuración:**
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `siig_roller_db` ⬅️ IMPORTANTE
   - **Username:** `postgres`
   - **Password:** `admin123`
   - Marca **"Save password"** si quieres

4. **Test Connection:**
   - Haz clic en **"Test Connection"**
   - Debería mostrar "Connected"
   - Si pide drivers, permite que los descargue

5. **Finish:**
   - Haz clic en **"Finish"**

6. **Expandir:**
   - Ahora expande la nueva conexión
   - Deberías ver: Databases → siig_roller_db → Schemas → public → Tables

---

## Verificación Rápida

Después de cambiar, ejecuta en el SQL Editor:

```sql
SELECT current_database();
```

Debería mostrar: **`siig_roller_db`**

Y luego:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver las 11 tablas listadas.

---

## Ubicación Visual de las Tablas en DBeaver

Una vez conectado a `siig_roller_db`, las tablas estarán aquí:

```
📁 Database Connections
  └── 📁 PostgreSQL (o el nombre de tu conexión)
      └── 📁 Databases
          └── 📁 siig_roller_db  ⬅️ Asegúrate de estar aquí
              └── 📁 Schemas
                  └── 📁 public
                      └── 📁 Tables  ⬅️ AQUÍ están las 11 tablas
                          ├── 📄 eventos
                          ├── 📄 grupos_rodadas
                          ├── 📄 participantes_evento
                          ├── 📄 participantes_grupo
                          ├── 📄 productos
                          ├── 📄 productos_imagenes
                          ├── 📄 puntos_gps
                          ├── 📄 recorridos
                          ├── 📄 rutas
                          ├── 📄 transacciones
                          └── 📄 usuarios
```

---

## Si No Aparece la Opción de Cambiar Base de Datos

Si DBeaver no te permite cambiar la base de datos fácilmente:

1. **Crea una nueva conexión** (Opción 3 arriba)
2. Específicamente para `siig_roller_db`
3. Así siempre estarás conectado a la base de datos correcta

