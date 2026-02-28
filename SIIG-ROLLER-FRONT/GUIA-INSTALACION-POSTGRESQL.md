# Guía de Instalación de PostgreSQL Local - RunSkateRoller

## Requisitos Previos

### 1. Sistema Operativo
- Windows 10/11
- macOS
- Linux (Ubuntu/Debian)

### 2. Recursos Mínimos
- RAM: 2GB mínimo (4GB recomendado)
- Espacio en disco: 1GB para PostgreSQL + datos
- Permisos de administrador para instalación

---

## Paso 1: Instalar PostgreSQL

### Windows

#### Opción A: Instalador Oficial (Recomendado)
1. **Descargar PostgreSQL:**
   - Ve a: https://www.postgresql.org/download/windows/
   - O descarga directamente: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Descarga la versión **PostgreSQL 15 o 16** (64-bit)

2. **Ejecutar el Instalador:**
   - Ejecuta el archivo `.exe` descargado
   - Sigue el asistente de instalación
   - **Configuración importante:**
     - Puerto: `5432` (por defecto)
     - Superusuario: `postgres`
     - **CONTRASEÑA**: Anota la contraseña que configures (la necesitarás)
     - Locale: `Spanish, Mexico` o `English, United States`

3. **Completar la Instalación:**
   - Marca la opción "Stack Builder" si quieres herramientas adicionales (opcional)
   - La instalación creará:
     - PostgreSQL Server
     - pgAdmin 4 (interfaz gráfica)
     - Command Line Tools

#### Opción B: Usando Chocolatey (Si lo tienes instalado)
```powershell
choco install postgresql15
```

### macOS

#### Opción A: Usando Homebrew (Recomendado)
```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar PostgreSQL
brew install postgresql@15

# Iniciar PostgreSQL
brew services start postgresql@15
```

#### Opción B: Instalador Oficial
1. Descarga desde: https://www.postgresql.org/download/macosx/
2. Ejecuta el instalador `.dmg`
3. Sigue las instrucciones del asistente

### Linux (Ubuntu/Debian)

```bash
# Actualizar paquetes
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Paso 2: Verificar la Instalación

### Windows
1. Abre **pgAdmin 4** desde el menú de inicio
2. O abre **SQL Shell (psql)** desde el menú de inicio
3. O verifica desde PowerShell:
```powershell
# Verificar que PostgreSQL esté instalado
psql --version

# O verificar el servicio
Get-Service postgresql*
```

### macOS/Linux
```bash
# Verificar versión
psql --version

# Verificar que el servicio esté corriendo
brew services list  # macOS
# o
sudo systemctl status postgresql  # Linux
```

---

## Paso 3: Instalar Extensiones Necesarias

PostgreSQL necesita las extensiones **UUID** y **PostGIS** para el proyecto.

### Instalar PostGIS

#### Windows
1. **Opción A: Durante la instalación de PostgreSQL**
   - Al instalar PostgreSQL, marca la opción "PostGIS Bundle" si está disponible

2. **Opción B: Instalar PostGIS después**
   - Descarga desde: https://postgis.net/windows_downloads/
   - O usa Stack Builder:
     - Abre **Stack Builder**
     - Selecciona tu instalación de PostgreSQL
     - Busca "PostGIS" e instálalo

#### macOS
```bash
brew install postgis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt install postgresql-15-postgis-3  # Ajusta la versión según tu PostgreSQL
```

---

## Paso 4: Configurar la Base de Datos

### Crear la Base de Datos

#### Usando pgAdmin (Interfaz Gráfica)

1. Abre **pgAdmin 4**
2. Conéctate al servidor (usa la contraseña que configuraste)
3. Click derecho en **Databases** → **Create** → **Database**
4. Nombre: `siig_roller_db`
5. Owner: `postgres`
6. Click en **Save**

#### Usando psql (Línea de Comandos)

**Windows:**
```powershell
# Abrir psql
psql -U postgres

# Crear base de datos
CREATE DATABASE siig_roller_db;

# Salir
\q
```

**macOS/Linux:**
```bash
# Conectarse como usuario postgres
sudo -u postgres psql

# Crear base de datos
CREATE DATABASE siig_roller_db;

# Salir
\q
```

---

## Paso 5: Ejecutar el Script SQL

### Opción A: Usando pgAdmin

1. Abre **pgAdmin 4**
2. Expande **Databases** → **siig_roller_db**
3. Click derecho en **siig_roller_db** → **Query Tool**
4. Abre el archivo `esquema-sql-postgresql.sql`
5. Copia todo el contenido y pégalo en el Query Tool
6. Click en el botón **Execute** (⚡) o presiona `F5`
7. Verifica que todas las tablas se crearon correctamente

### Opción B: Usando psql (Línea de Comandos)

**Windows:**
```powershell
# Desde el directorio del proyecto
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"

# Ejecutar el script
psql -U postgres -d siig_roller_db -f esquema-sql-postgresql.sql
```

**macOS/Linux:**
```bash
# Desde el directorio del proyecto
cd /ruta/al/proyecto/SIIG-ROLLER-FRONT

# Ejecutar el script
psql -U postgres -d siig_roller_db -f esquema-sql-postgresql.sql
```

### Opción C: Copiar y Pegar Manualmente

1. Abre **psql**:
```powershell
psql -U postgres -d siig_roller_db
```

2. Copia el contenido de `esquema-sql-postgresql.sql` y pégalo en la terminal
3. Presiona `Enter` para ejecutar

---

## Paso 6: Verificar que Todo Esté Creado

### Usando psql

```sql
-- Conectarse a la base de datos
\c siig_roller_db

-- Listar todas las tablas
\dt

-- Ver estructura de una tabla específica
\d usuarios

-- Ver extensiones instaladas
\dx

-- Verificar que PostGIS esté instalado
SELECT PostGIS_version();
```

### Usando pgAdmin

1. Expande **Databases** → **siig_roller_db** → **Schemas** → **public** → **Tables**
2. Deberías ver todas las tablas creadas:
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

---

## Paso 7: Configurar Variables de Entorno (Opcional)

### Windows

1. Abre **Variables de Entorno del Sistema**
   - Presiona `Win + R`
   - Escribe `sysdm.cpl` y presiona Enter
   - Ve a la pestaña **Avanzado** → **Variables de Entorno**

2. Agrega las siguientes variables:

```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=tu_contraseña_aqui
PGDATABASE=siig_roller_db
```

### macOS/Linux

Agrega al archivo `~/.bashrc` o `~/.zshrc`:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=tu_contraseña_aqui
export PGDATABASE=siig_roller_db
```

Luego ejecuta:
```bash
source ~/.bashrc  # o source ~/.zshrc
```

---

## Paso 8: Probar la Conexión

### Crear un Usuario de Prueba

```sql
-- Conectarse a la base de datos
\c siig_roller_db

-- Insertar un usuario de prueba
INSERT INTO usuarios (
    email, 
    password_hash, 
    edad, 
    cumpleaños, 
    sexo, 
    nacionalidad, 
    tipo_perfil
) VALUES (
    'admin@roller.com',
    '$2b$10$ejemplo_hash_aqui',  -- Esto debería ser un hash real de bcrypt
    30,
    '1994-01-15',
    'masculino',
    'español',
    'administrador'
);

-- Verificar que se insertó
SELECT * FROM usuarios;
```

---

## Solución de Problemas Comunes

### Error: "psql: no se reconoce como comando"
**Solución:** Agrega PostgreSQL al PATH:
- Windows: Durante la instalación, marca "Add PostgreSQL to PATH"
- O agrega manualmente: `C:\Program Files\PostgreSQL\15\bin`

### Error: "contraseña de autenticación fallida"
**Solución:** 
- Verifica la contraseña del usuario `postgres`
- O crea un nuevo usuario con permisos

### Error: "la extensión PostGIS no existe"
**Solución:**
- Instala PostGIS desde Stack Builder (Windows)
- O instala el paquete `postgis` (macOS/Linux)

### Error: "permiso denegado"
**Solución:**
- Asegúrate de ejecutar como usuario `postgres`
- O concede permisos al usuario actual

### Puerto 5432 ya en uso
**Solución:**
- Verifica si PostgreSQL ya está corriendo
- O cambia el puerto en `postgresql.conf`

---

## Herramientas Recomendadas

### pgAdmin 4
- Interfaz gráfica oficial de PostgreSQL
- Se instala automáticamente con PostgreSQL en Windows

### DBeaver
- Cliente universal de bases de datos
- Descarga desde: https://dbeaver.io/

### TablePlus
- Cliente moderno para bases de datos
- Descarga desde: https://tableplus.com/

### VS Code Extensions
- **PostgreSQL** por Chris Kolkman
- **SQL Tools** por Matheus Teixeira

---

## Información de Conexión para la Aplicación

Una vez configurada la base de datos, necesitarás estos datos para conectar tu aplicación:

```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'siig_roller_db',
  user: 'postgres',
  password: 'tu_contraseña_aqui'
}
```

---

## Siguiente Paso

Una vez que tengas PostgreSQL instalado y la base de datos creada:

1. ✅ Verifica que todas las tablas estén creadas
2. ✅ Prueba insertar datos de ejemplo
3. 🔄 Configura la conexión en tu backend (Node.js/Express)
4. 🔄 Crea migraciones si usas un ORM (TypeORM, Sequelize, etc.)

---

## Recursos Adicionales

- **Documentación oficial PostgreSQL**: https://www.postgresql.org/docs/
- **Documentación PostGIS**: https://postgis.net/documentation/
- **Tutorial PostgreSQL**: https://www.postgresqltutorial.com/
- **pgAdmin Tutorial**: https://www.pgadmin.org/docs/

