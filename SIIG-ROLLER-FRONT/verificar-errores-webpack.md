# Verificación de Errores de Webpack

## Errores Comunes y Soluciones

### 1. Errores de Importación
Si ves errores como "Cannot find module" o "Module not found":
- Verifica que todos los imports estén correctos
- Asegúrate de que las rutas de archivos sean correctas

### 2. Errores de TypeScript
Si ves errores de tipos:
- Verifica que las interfaces estén exportadas correctamente
- Revisa que los tipos coincidan

### 3. Errores de Dependencias
Si faltan módulos:
```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm install
```

## Para Ver los Errores Completos

Los errores de webpack aparecen en la consola donde ejecutaste `npm run web`.

Busca líneas que digan:
- `ERROR in`
- `Module not found`
- `Cannot find module`
- `Type error`

## Soluciones Rápidas

1. **Limpiar caché y reinstalar:**
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

2. **Limpiar build:**
```powershell
rm -rf web-build
npm run web
```

3. **Verificar tipos TypeScript:**
```powershell
npx tsc --noEmit
```

