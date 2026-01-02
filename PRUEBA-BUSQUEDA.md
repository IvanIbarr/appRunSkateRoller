# Prueba de Búsqueda de Ruta

## Instrucciones para Probar la Búsqueda

### Datos de Prueba (Ciudad de México)
- **Origen**: lic. primo verdad col jarandas
- **Destino**: xitla col arenal 4 secc.

## Pasos para Realizar la Prueba

### 1. Verificar que el servidor esté corriendo
```powershell
# Si no está corriendo, ejecuta:
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run web
```

Espera a ver: `Compiled successfully!` en la terminal.

### 2. Abrir el navegador
1. Abre Chrome
2. Ve a: `http://localhost:3000`
3. Inicia sesión (si es necesario)

### 3. Navegar a la pantalla de navegación
- Si ya estás logueado, deberías ver la pantalla "Inicio de Recorrido - Navegación y Tracking"
- Si no, haz clic en el icono 🗺️ "Inicio de ruta" en la barra inferior

### 4. Ingresar el origen
1. En el campo "Origen", escribe: `lic. primo verdad col jarandas`
2. Espera 300ms (aparecerá un spinner mientras busca)
3. Deberías ver sugerencias de lugares relacionados
4. Selecciona la sugerencia más apropiada o continúa escribiendo si no aparece
5. También puedes escribir: `Lic. Primo Verdad, Col. Jardines, Ciudad de México` para más precisión

### 5. Ingresar el destino
1. En el campo "Destino", escribe: `xitla col arenal 4 secc.`
2. Espera 300ms (aparecerá un spinner mientras busca)
3. Deberías ver sugerencias de lugares relacionados
4. Selecciona la sugerencia más apropiada
5. También puedes escribir: `Xitla, Col. Arenal 4ta Sección, Ciudad de México` para más precisión

### 6. Calcular la ruta
1. Haz clic en el botón "Calcular Ruta"
2. O simplemente espera - la ruta se calculará automáticamente cuando ambos campos tengan valores válidos

### 7. Verificar los resultados
Deberías ver:
- **Mapa**: Se mostrará un mapa con la ruta trazada entre origen y destino
- **Distancia**: En kilómetros o metros
- **Tiempo estimado**: En horas y minutos

## Características del Autocompletado

### Cómo funciona:
1. **Debounce de 300ms**: Espera a que dejes de escribir antes de buscar
2. **Mínimo 3 caracteres**: Necesitas escribir al menos 3 caracteres para que busque
3. **Hasta 5 sugerencias**: Muestra las 5 mejores opciones de Mapbox
4. **Idioma español**: Las sugerencias vienen en español
5. **Selección**: Al hacer clic en una sugerencia, se completa automáticamente el campo

### Sugerencias para mejores resultados:
- Incluye referencias como "Ciudad de México" o "CDMX" si no encuentra el lugar
- Usa nombres completos de colonias
- Si no aparece la sugerencia exacta, puedes seleccionar una cercana o continuar escribiendo

## Posibles Problemas y Soluciones

### Problema: No aparecen sugerencias
**Solución**: 
- Verifica que tengas conexión a internet
- Verifica que el token de Mapbox esté configurado (aunque debería funcionar con el token de ejemplo)
- Escribe al menos 3 caracteres

### Problema: El mapa no carga
**Solución**:
- Verifica que Mapbox GL JS esté cargado (revisa la consola del navegador F12)
- Verifica que el token de Mapbox sea válido
- Recarga la página con `Ctrl+Shift+R`

### Problema: La ruta no se calcula
**Solución**:
- Verifica que ambos campos (origen y destino) tengan valores
- Verifica la consola del navegador (F12) para errores
- Asegúrate de que las direcciones sean válidas en Ciudad de México

## Resultado Esperado

Al completar la prueba, deberías ver:
- ✅ Autocompletado funcionando con sugerencias
- ✅ Mapa mostrando la ruta entre las dos ubicaciones
- ✅ Distancia y tiempo estimado de viaje
- ✅ Marcadores en el mapa indicando origen y destino

## Ubicaciones de Prueba (Ciudad de México)

### Origen Sugerido:
- **Búsqueda**: `lic. primo verdad col jarandas`
- **Alternativa más completa**: `Lic. Primo Verdad, Col. Jardines, Ciudad de México, CDMX`

### Destino Sugerido:
- **Búsqueda**: `xitla col arenal 4 secc.`
- **Alternativa más completa**: `Xitla, Col. Arenal 4ta Sección, Ciudad de México, CDMX`

## Notas Adicionales

- El autocompletado usa la API de Geocoding de Mapbox
- Las sugerencias se basan en lugares reales de Mapbox
- Si no encuentras el lugar exacto, prueba con variaciones del nombre
- El cálculo de ruta usa Mapbox Directions API con perfil de conducción (driving)


