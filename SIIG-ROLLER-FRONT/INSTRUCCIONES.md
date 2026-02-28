# Instrucciones de Instalación y Configuración

## Pasos para Iniciar el Proyecto

### 1. Instalar Dependencias

```bash
npm install
# o
yarn install
```

### 2. Configurar el Logo

El logo ya ha sido copiado desde `../imagen/IMG_2675.jpeg` a `assets/logo.jpeg`.

Si necesitas actualizar el logo, simplemente reemplaza el archivo en la carpeta `assets/`.

### 3. Para iOS (solo macOS)

```bash
cd ios
pod install
cd ..
```

### 4. Ejecutar la Aplicación

#### Android
```bash
npm run android
```

Asegúrate de tener:
- Android Studio instalado
- Un emulador Android corriendo o un dispositivo conectado con USB debugging habilitado

#### iOS (solo macOS)
```bash
npm run ios
```

Asegúrate de tener:
- Xcode instalado
- CocoaPods instalado (`sudo gem install cocoapods`)

## Estructura de Navegación

La aplicación tiene las siguientes pantallas:

1. **LoginScreen**: Pantalla de inicio de sesión
   - Usuarios mock disponibles en el servicio de autenticación

2. **RegistroScreen**: Pantalla de registro
   - Formulario completo con todos los campos requeridos

3. **HomeScreen**: Pantalla principal después del login
   - Muestra información del usuario autenticado
   - Botón para cerrar sesión

## Usuarios de Prueba

Puedes usar estos usuarios para probar la aplicación:

- **Admin**: `admin@roller.com` / `admin123`
- **Líder**: `lider@roller.com` / `lider123`
- **Roller**: `roller@roller.com` / `roller123`

## Notas Importantes

- El servicio de autenticación actualmente usa datos mock almacenados en memoria
- Los tokens son simulados (no son JWT reales)
- Los datos se persisten en AsyncStorage localmente
- Cuando implementes el backend real, deberás actualizar `src/services/authService.ts`

## Solución de Problemas

### Error: "Unable to resolve module"
Ejecuta:
```bash
npm start -- --reset-cache
```

### Error en iOS: Pods no encontrados
```bash
cd ios
pod install
cd ..
```

### Error: Metro bundler no inicia
```bash
npm start -- --reset-cache
```

