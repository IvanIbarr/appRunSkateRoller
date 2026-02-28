# Error 422 en Mapbox Directions API

## 🔴 Problema

Estás viendo un error **422 (Unprocessable Entity)** al intentar calcular una ruta. Este error generalmente ocurre cuando:

1. **Las direcciones no se encontraron correctamente** - La geocodificación no pudo encontrar coordenadas válidas
2. **No hay ruta válida** - Las ubicaciones están muy lejanas o no hay conexión viable entre ellas
3. **Coordenadas inválidas** - Las coordenadas obtenidas no son válidas para calcular una ruta

## ✅ Soluciones

### 1. Usar las Sugerencias del Autocompletado

**IMPORTANTE**: Para mejores resultados, usa las sugerencias que aparecen cuando escribes:

- Escribe las primeras letras de la dirección
- Espera a que aparezcan las sugerencias (aparece un spinner)
- **Selecciona una sugerencia haciendo clic en ella**
- Esto asegura que estás usando direcciones válidas que Mapbox conoce

### 2. Ser Más Específico con las Direcciones

En lugar de escribir:
- ❌ `lic. primo verdad col jarandas`
- ✅ `Lic. Primo Verdad, Col. Jardines, Ciudad de México, CDMX`

En lugar de escribir:
- ❌ `xitla col arenal 4 secc.`
- ✅ `Xitla, Col. Arenal 4ta Sección, Ciudad de México, CDMX`

### 3. Agregar "Ciudad de México" o "CDMX"

Para direcciones en Ciudad de México, agrega el contexto:
- `Lic. Primo Verdad, Col. Jardines, Ciudad de México`
- `Xitla, Col. Arenal, Ciudad de México, CDMX`

### 4. Verificar que Ambas Direcciones Estén en México

El sistema ahora está configurado para priorizar resultados en México. Si una de las direcciones no está en México, puede causar problemas.

## 🔧 Mejoras Implementadas

He mejorado el código para:

1. ✅ **Validar coordenadas** antes de calcular la ruta
2. ✅ **Priorizar resultados en México** (`country=mx`)
3. ✅ **Mostrar mensajes de error más claros** cuando falla la geocodificación o el cálculo de ruta
4. ✅ **Verificar que las direcciones existan** antes de intentar calcular la ruta
5. ✅ **Leer mensajes de error de Mapbox** para dar información más útil

## 🧪 Prueba con Direcciones Mejoradas

Intenta con estas direcciones más específicas:

### Opción 1 (Más específica):
- **Origen**: `Lic. Primo Verdad, Col. Jardines, Ciudad de México`
- **Destino**: `Xitla, Col. Arenal 4ta Sección, Ciudad de México`

### Opción 2 (Usando lugares conocidos):
- **Origen**: `Zócalo, Ciudad de México`
- **Destino**: `Ángel de la Independencia, Ciudad de México`

### Opción 3 (Usando coordenadas aproximadas):
Si conoces las coordenadas, puedes usar lugares cercanos conocidos:
- **Origen**: `Avenida Insurgentes Sur, Ciudad de México`
- **Destino**: `Avenida Revolución, Ciudad de México`

## 📝 Notas

- El autocompletado está optimizado para buscar en México primero
- Las sugerencias que aparecen son direcciones válidas conocidas por Mapbox
- Siempre es mejor seleccionar una sugerencia que escribir la dirección manualmente
- Si las direcciones son muy lejanas (ej: Ciudad de México a Cancún), puede tomar más tiempo

## 🔍 Debugging

Si el problema persiste:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network" (Red)
3. Intenta buscar una dirección
4. Busca las solicitudes a `api.mapbox.com`
5. Revisa las respuestas para ver qué está devolviendo Mapbox

Si ves respuestas con `features: []` (vacío), significa que Mapbox no encontró esa dirección. Intenta con una más específica o usa las sugerencias.


