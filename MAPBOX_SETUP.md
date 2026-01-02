# Configuración de Mapbox para RunSkateRoller

## Obtener API Key de Mapbox (Plan Freemium)

1. Ve a https://account.mapbox.com/
2. Crea una cuenta (gratis) o inicia sesión
3. Una vez dentro, ve a "Tokens" o "Access Tokens"
4. Copia tu token público (starts with `pk.eyJ...`)

## Plan Freemium - Límites Gratuitos

- **50,000 map loads/mes** - Carga de mapas
- **100,000 requests/mes** - Directions API
- **100,000 requests/mes** - Geocoding API

## Configurar el Token

1. Abre el archivo `SIIG-ROLLER-FRONT/src/config/mapbox.ts`
2. Reemplaza el valor de `MAPBOX_ACCESS_TOKEN` con tu token:

```typescript
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiTU9EVUlGSUNBU...'; // Tu token aquí
```

O configura una variable de entorno:

1. Crea un archivo `.env` en la raíz del proyecto `SIIG-ROLLER-FRONT/`
2. Agrega:
```
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiTU9EVUlGSUNBU...
```

## Uso

La pantalla de navegación está disponible después del login. Solo ingresa:
- **Origen**: Dirección o ciudad de inicio
- **Destino**: Dirección o ciudad de destino

El mapa calculará automáticamente:
- Distancia en kilómetros
- Tiempo estimado de recorrido
- Ruta visualizada en el mapa

## Notas

- El mapa solo está disponible en la versión web por ahora
- Para móvil nativo, se requiere configuración adicional con `@rnmapbox/maps`

