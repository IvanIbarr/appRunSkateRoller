# Reiniciar Servidor Web

## Estado

He detenido el servidor anterior. Ahora necesitas iniciarlo manualmente en tu terminal para ver los logs y asegurarte de que se inicia correctamente.

## Pasos para Reiniciar:

1. **Abre una nueva terminal o PowerShell**

2. **Navega al directorio del proyecto:**
   ```powershell
   cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
   ```

3. **Inicia el servidor:**
   ```powershell
   npm run web
   ```

4. **Espera a ver el mensaje:**
   ```
   Compiled successfully!
   webpack compiled with 0 warnings
   ```

5. **Verifica que funciona:**
   - Abre `http://localhost:3000` en el navegador
   - El servidor ahora debería estar usando el token de Mapbox del archivo `.env`

## Verificar que el Token se Está Usando:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network" (Red)
3. Intenta buscar una dirección en la pantalla de navegación
4. Deberías ver solicitudes a `api.mapbox.com` sin errores 403

## Prueba con las Direcciones:

- **Origen**: `lic. primo verdad col jarandas`
- **Destino**: `xitla col arenal 4 secc.`

Ahora deberías ver:
- ✅ Sugerencias de autocompletado funcionando
- ✅ Sin errores 403
- ✅ Ruta calculada correctamente


