# Error 403 (Forbidden) en Mapbox - Solución

## 🔴 Problema

Estás viendo un error **403 (Forbidden)** al intentar usar las funciones de búsqueda de direcciones o calcular rutas. Esto significa que el token de Mapbox que estás usando no tiene permisos para acceder a las APIs de Geocoding y Directions.

## ✅ Solución: Obtener tu Propio Token de Mapbox

El token de ejemplo que viene por defecto **NO funciona** para las APIs. Necesitas obtener tu propio token gratuito.

### Paso 1: Crear una Cuenta en Mapbox

1. Ve a **https://account.mapbox.com/**
2. Haz clic en **"Sign up"** (Registrarse) o **"Log in"** (Iniciar sesión) si ya tienes cuenta
3. Completa el registro (es **gratis**)

### Paso 2: Obtener tu Token

1. Una vez dentro de tu cuenta, ve a **"Tokens"** o **"Access Tokens"** en el menú
2. Verás tu **"Public access token"** (token público)
   - Comienza con `pk.eyJ...`
   - Cópialo completamente

### Paso 3: Configurar el Token en el Proyecto

Tienes **2 opciones**:

#### Opción A: Usar Variable de Entorno (Recomendado)

1. En la raíz del proyecto `SIIG-ROLLER-FRONT`, crea un archivo llamado `.env` (si no existe)
2. Agrega esta línea, reemplazando `TU_TOKEN_AQUI` con tu token real:

```env
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiTU9EVUlGSUNBU...
```

3. **Reinicia el servidor web** para que tome los cambios:
   - Detén el servidor (Ctrl+C)
   - Ejecuta de nuevo: `npm run web`

#### Opción B: Modificar el Archivo Directamente (Para pruebas rápidas)

1. Abre el archivo: `SIIG-ROLLER-FRONT/src/config/mapbox.ts`
2. Encuentra la línea con `DEFAULT_TOKEN`
3. Reemplaza el valor con tu token:

```typescript
const DEFAULT_TOKEN = 'pk.eyJ1IjoiTU9EVUlGSUNBU...'; // Tu token aquí
```

4. Guarda el archivo
5. El servidor se recargará automáticamente (si está corriendo)

### Paso 4: Verificar que Funciona

1. Abre la aplicación en el navegador: `http://localhost:3000`
2. Inicia sesión
3. Ve a la pantalla "Inicio de Recorrido"
4. Intenta buscar una dirección en el campo "Origen"
5. Deberías ver sugerencias aparecer sin errores 403

## 📊 Plan Freemium de Mapbox

El plan gratuito incluye:

- ✅ **50,000 cargas de mapa/mes** - Para mostrar mapas
- ✅ **100,000 solicitudes/mes** - Para Geocoding API (búsqueda de direcciones)
- ✅ **100,000 solicitudes/mes** - Para Directions API (cálculo de rutas)

Esto es más que suficiente para desarrollo y pruebas iniciales.

## 🚨 Mensajes de Error Mejorados

He actualizado el código para mostrar mensajes de error más claros cuando:

- El token es inválido (403)
- El token no tiene permisos
- Hay errores en las APIs de Mapbox

Ahora verás mensajes informativos que te indican qué hacer.

## 📝 Notas

- El token de ejemplo (`pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ...`) **NO funciona** para las APIs
- Si excedes los límites gratuitos, Mapbox te cobrará una pequeña tarifa por el uso adicional
- Puedes monitorear tu uso en el panel de control de Mapbox
- Los tokens públicos son seguros para usar en el frontend (comienzan con `pk.ey...`)

## 🔗 Enlaces Útiles

- **Crear cuenta/Iniciar sesión**: https://account.mapbox.com/
- **Documentación de Mapbox**: https://docs.mapbox.com/
- **Límites del plan gratuito**: https://www.mapbox.com/pricing/


