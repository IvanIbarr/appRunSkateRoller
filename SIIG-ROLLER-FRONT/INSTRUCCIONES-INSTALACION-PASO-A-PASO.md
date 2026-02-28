# Instrucciones Paso a Paso - Instalación de PostgreSQL

## Paso 1: Descargar PostgreSQL

✅ **Navegador abierto** - Deberías ver la página de descarga de PostgreSQL.

### En la página de descarga:

1. **Selecciona tu sistema operativo:**
   - Si estás en Windows, busca "Windows x86-64"
   - Versión recomendada: **PostgreSQL 15** o **16**

2. **Haz clic en "Download"** para la versión que necesitas

3. **El archivo se descargará** (tamaño aproximado: 200-300 MB)
   - Nombre del archivo: `postgresql-15.x-x-windows-x64.exe` (o similar)

---

## Paso 2: Ejecutar el Instalador

Una vez descargado el archivo:

1. **Navega a tu carpeta de Descargas**
2. **Haz doble clic** en el archivo `.exe` descargado
3. **Si aparece una advertencia de seguridad:**
   - Haz clic en "Más información" → "Ejecutar de todos modos"
   - O haz clic derecho → "Ejecutar como administrador"

---

## Paso 3: Asistente de Instalación

### Pantalla 1: Welcome
- Haz clic en **"Next"**

### Pantalla 2: Installation Directory
- Deja la ruta por defecto: `C:\Program Files\PostgreSQL\15`
- Haz clic en **"Next"**

### Pantalla 3: Select Components
- ✅ **PostgreSQL Server** (debe estar marcado)
- ✅ **pgAdmin 4** (interfaz gráfica - recomendado)
- ✅ **Stack Builder** (para instalar PostGIS después)
- ✅ **Command Line Tools** (psql)
- Haz clic en **"Next"**

### Pantalla 4: Data Directory
- Deja la ruta por defecto: `C:\Program Files\PostgreSQL\15\data`
- Haz clic en **"Next"**

### Pantalla 5: Password ⚠️ IMPORTANTE
- **Ingresa una contraseña** para el usuario `postgres`
- **Ejemplo:** `admin123` o `Postgres2024!`
- ⚠️ **ANOTA ESTA CONTRASEÑA** - La necesitarás después
- Haz clic en **"Next"**

### Pantalla 6: Port
- Deja el puerto **5432** (por defecto)
- Haz clic en **"Next"**

### Pantalla 7: Advanced Options
- **Locale:** Selecciona `Spanish, Mexico` o `English, United States`
- Haz clic en **"Next"**

### Pantalla 8: Pre Installation Summary
- Revisa la configuración
- Haz clic en **"Next"**

### Pantalla 9: Ready to Install
- Haz clic en **"Next"**
- Espera a que se complete la instalación (5-10 minutos)

### Pantalla 10: Completing the PostgreSQL Setup
- ✅ **Marca la casilla "Launch Stack Builder"** (para instalar PostGIS después)
- Haz clic en **"Finish"**

---

## Paso 4: Instalar PostGIS (Stack Builder)

Si marcaste "Launch Stack Builder":

1. **Stack Builder se abrirá automáticamente**
2. Selecciona tu instalación de PostgreSQL
3. Haz clic en **"Next"**
4. Expande **"Spatial Extensions"**
5. ✅ Marca **"PostGIS Bundle for PostgreSQL"**
6. Haz clic en **"Next"**
7. Sigue el asistente para completar la instalación

---

## Paso 5: Verificar la Instalación

### Opción A: Usando pgAdmin

1. **Abre pgAdmin 4** desde el menú de inicio
2. Deberías ver un servidor local configurado
3. Ingresa la contraseña que configuraste
4. Si puedes conectarte, ✅ **¡Instalación exitosa!**

### Opción B: Usando PowerShell

Abre PowerShell y ejecuta:

```powershell
# Verificar que PostgreSQL esté instalado
psql --version

# Deberías ver algo como: psql (PostgreSQL) 15.x
```

---

## ✅ Resumen de lo que necesitas anotar:

1. **Contraseña del usuario postgres:** `_________________`
2. **Puerto:** `5432` (por defecto)
3. **Usuario:** `postgres`
4. **Host:** `localhost`

---

## Siguiente Paso

Una vez completada la instalación, continúa con:
- **Paso 2:** Crear la base de datos `siig_roller_db`
- **Paso 3:** Ejecutar el script SQL `esquema-sql-postgresql.sql`

---

## ¿Necesitas Ayuda?

Si encuentras algún problema durante la instalación:
1. Toma una captura de pantalla del error
2. Revisa la sección "Solución de Problemas" en `GUIA-INSTALACION-POSTGRESQL.md`
3. O comparte el error y te ayudo a resolverlo

