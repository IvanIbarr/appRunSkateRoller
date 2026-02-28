# Instrucciones para Ejecutar la Aplicación en Web

## Requisitos Previos

- Node.js >= 18
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

## Pasos para Ejecutar en Web

### 1. Instalar Dependencias (si no lo has hecho)

```bash
npm install
```

### 2. Ejecutar la Aplicación en Web

```bash
npm run web
```

Esto iniciará el servidor de desarrollo webpack en el puerto 3000.

### 3. Abrir en el Navegador

Abre tu navegador y ve a:

```
http://localhost:3000
```

## Usuarios de Prueba

Puedes usar estos usuarios para probar la aplicación:

- **Administrador**: `admin@roller.com` / `admin123`
- **Líder de Grupo**: `lider@roller.com` / `lider123`
- **Roller**: `roller@roller.com` / `roller123`

## Características Disponibles en Web

- ✅ Pantalla de Login
- ✅ Pantalla de Registro
- ✅ Pantalla de Home (después del login)
- ✅ Navegación entre pantallas
- ✅ Validación de formularios
- ✅ Almacenamiento local (AsyncStorage simulado)

## Notas Importantes

- La aplicación está configurada para funcionar tanto en móvil (React Native) como en web (React Native Web)
- Algunas funcionalidades específicas de dispositivos móviles pueden no estar disponibles en web
- El logo se carga desde `assets/logo.jpeg`

## Construir para Producción

Para crear una versión de producción optimizada:

```bash
npm run web:build
```

Los archivos compilados se generarán en la carpeta `web-build/`.

## Solución de Problemas

### Error: "Cannot find module"
Ejecuta:
```bash
npm install
```

### Error: "Port 3000 is already in use"
Cambia el puerto en `webpack.config.js`:
```javascript
devServer: {
  port: 3001, // Cambiar a otro puerto
}
```

### La aplicación no carga
1. Verifica que el servidor esté corriendo
2. Revisa la consola del navegador para ver errores
3. Intenta limpiar la caché del navegador



