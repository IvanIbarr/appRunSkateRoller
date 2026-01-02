# Guía de Depuración - Página en Blanco

## Cambios Realizados

### 1. **Timeout en `isAuthenticated()`**
   - Ahora tiene un timeout de 3 segundos
   - Si no hay token/usuario local, retorna `false` inmediatamente sin llamar a la API
   - Si falla la API o hay timeout, retorna `false` sin hacer logout

### 2. **Timeout en `AppNavigator`**
   - Timeout de 5 segundos máximo para la verificación de autenticación
   - Siempre muestra login si hay timeout o error

### 3. **Logs de Depuración**
   - Agregados logs en `AppNavigator` para rastrear el flujo
   - Los logs aparecen en la consola del navegador

## Pasos para Depurar

### Paso 1: Verificar que el servidor esté corriendo
```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run web
```

Espera a ver: `Compiled successfully!` en la terminal.

### Paso 2: Abrir el navegador
1. Abre Chrome
2. Ve a: `http://localhost:3000`
3. Presiona `F12` para abrir las herramientas de desarrollador
4. Ve a la pestaña **Console**

### Paso 3: Revisar los logs
Deberías ver logs como estos:
```
AppNavigator: Iniciando verificación de autenticación...
AppNavigator: Verificando autenticación...
AppNavigator: Resultado de autenticación: false
AppNavigator: Estableciendo autenticación: false
AppNavigator: Renderizando navegación, isAuthenticated: false
```

### Paso 4: Verificar errores
- **Si NO ves ningún log**: Hay un error de compilación o el JavaScript no se está cargando
- **Si ves logs pero la página está en blanco**: Hay un error de renderizado
- **Si ves errores en rojo**: Copia el mensaje exacto del error

## Problemas Comunes

### Problema 1: No se ven logs
**Causa**: Error de compilación o el bundle no se está cargando

**Solución**:
1. Verifica la terminal donde corre `npm run web`
2. Busca errores de compilación
3. Si hay errores, corrígelos y espera a que recompile
4. Recarga la página con `Ctrl+Shift+R`

### Problema 2: Veo logs pero la página está en blanco
**Causa**: Error de renderizado en algún componente

**Solución**:
1. Revisa la consola del navegador para errores específicos
2. Busca mensajes como "Cannot read property..." o "TypeError"
3. Verifica que todos los componentes estén exportados correctamente

### Problema 3: Veo "Cargando..." pero no cambia
**Causa**: El timeout no está funcionando o hay un error silencioso

**Solución**:
1. Espera 5 segundos (debería cambiar automáticamente)
2. Si no cambia, revisa la consola para errores
3. Verifica que `isAuthenticated()` no esté lanzando una excepción no capturada

### Problema 4: Error de conexión al backend
**Causa**: El backend no está corriendo en `http://localhost:3001`

**Solución**:
- Esto NO debería causar página en blanco ahora
- El código ahora retorna `false` si no puede conectar al backend
- Deberías ver la pantalla de login normalmente

## Verificación Rápida

1. ✅ **Abre la consola del navegador** (F12 → Console)
2. ✅ **Busca los logs** que empiezan con "AppNavigator:"
3. ✅ **Si no ves logs**: Revisa la terminal donde corre webpack
4. ✅ **Si ves errores en rojo**: Copia el mensaje exacto

## Información para Reportar

Si la página sigue en blanco, copia esta información:

1. **Logs de la consola del navegador** (F12 → Console)
2. **Mensajes de la terminal** donde corre `npm run web`
3. **URL que estás visitando** (debería ser `http://localhost:3000`)

## Estado Esperado

Después de los cambios:
- La página debería mostrar "Cargando..." por máximo 5 segundos
- Luego debería mostrar la pantalla de Login automáticamente
- NO debería quedarse en blanco indefinidamente

