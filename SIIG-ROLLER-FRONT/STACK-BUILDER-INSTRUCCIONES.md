# Instrucciones Stack Builder 4.22 - Qué Instalar

## Pasos en Stack Builder

### 1. Pantalla Inicial: Seleccionar Servidor
- ✅ Selecciona tu instalación de PostgreSQL 15 (o la versión que instalaste)
- Ejemplo: `PostgreSQL 15 on port 5432`
- Haz clic en **"Next"**

### 2. Seleccionar Aplicaciones (Applications)

En esta pantalla, busca y selecciona **SOLO** lo siguiente:

#### ✅ OBLIGATORIO - Instalar esto:

**📦 Spatial Extensions**
- Expande la carpeta **"Spatial Extensions"**
- ✅ Marca **"PostGIS Bundle for PostgreSQL 15"** (o tu versión)
  - Incluye: PostGIS, GEOS, PROJ, GDAL
  - Tamaño aproximado: 100-150 MB

#### ❌ NO es necesario instalar (por ahora):

- ❌ No marques "Drivers"
- ❌ No marques "Language Packs" (a menos que necesites otros idiomas)
- ❌ No marques "Applications Development"
- ❌ No marques "EnterpriseDB Tools"
- ❌ No marques otras extensiones

### 3. Resumen de Descarga
- Revisa que solo esté seleccionado **"PostGIS Bundle"**
- Haz clic en **"Next"**

### 4. Carpeta de Descarga
- Deja la carpeta por defecto o selecciona una de tu preferencia
- Haz clic en **"Next"**

### 5. Descarga
- Espera a que se descargue PostGIS (5-10 minutos dependiendo de tu conexión)
- No cierres Stack Builder durante la descarga

### 6. Instalación de PostGIS
- Se abrirá el instalador de PostGIS automáticamente
- Haz clic en **"Next"** en todas las pantallas
- Acepta la licencia
- Selecciona la carpeta de PostgreSQL (debe detectarla automáticamente)
- **Selecciona la base de datos `postgres`** (se instalará allí por defecto)
- Completa la instalación

### 7. Registro de Spatial Data
- Cuando termine, puede pedirte registrar datos espaciales
- ✅ Marca **"Yes"** y selecciona la base de datos `postgres`
- Esto creará las funciones PostGIS necesarias

### 8. Finalizar
- Haz clic en **"Close"** o **"Finish"**
- Stack Builder puede cerrarse automáticamente

---

## ✅ Verificar que PostGIS se Instaló Correctamente

### Usando pgAdmin:
1. Abre **pgAdmin 4**
2. Conéctate al servidor
3. Expande: **Databases** → **postgres** → **Extensions**
4. Deberías ver **"postgis"** en la lista

### Usando psql (línea de comandos):
```sql
-- Conectarse
psql -U postgres

-- Verificar PostGIS
SELECT PostGIS_version();

-- Deberías ver algo como: 3.3.4
```

---

## 📝 Resumen - Qué Instalar:

**✅ SOLO INSTALAR:**
- PostGIS Bundle for PostgreSQL 15 (dentro de Spatial Extensions)

**❌ NO INSTALAR (por ahora):**
- Cualquier otra cosa que no sea PostGIS

---

## ¿Por qué PostGIS?

PostGIS es necesario para:
- ✅ Almacenar y consultar coordenadas GPS (lat/lng)
- ✅ Calcular distancias entre puntos
- ✅ Búsquedas geoespaciales (puntos cercanos, rutas, etc.)
- ✅ Trabajar con los campos de ubicación en las tablas del proyecto

Sin PostGIS, no podrás usar las funciones geoespaciales que el proyecto necesita.

---

## Si No Aparece PostGIS

Si no ves "PostGIS Bundle" en Stack Builder:

1. **Opción A: Instalar PostGIS Manualmente**
   - Descarga desde: https://postgis.net/windows_downloads/
   - Busca la versión compatible con PostgreSQL 15

2. **Opción B: Usar PostGIS desde OSGeo4W**
   - Descarga OSGeo4W: https://trac.osgeo.org/osgeo4w/
   - Instala PostGIS desde allí

Pero normalmente debería aparecer en Stack Builder bajo "Spatial Extensions".

---

## Siguiente Paso

Una vez que PostGIS esté instalado:
1. ✅ Continúa creando la base de datos `siig_roller_db`
2. ✅ Ejecuta el script SQL para crear las tablas
3. ✅ El script verificará automáticamente que PostGIS esté disponible

