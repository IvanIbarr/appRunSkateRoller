# Guía para Configurar el Icono de la App

## ✅ Completado

1. **Imagen copiada**: `IMG_2677.jpeg` ha sido copiada a:
   - `assets/app-icon.jpeg` (para uso en la app)
   - `public/favicon.jpeg` (para el favicon web)

2. **Favicon Web configurado**: El archivo `public/index.html` ha sido actualizado para usar la nueva imagen como favicon.

## 📱 Configurar Iconos para Android

Para Android, necesitas generar iconos en diferentes tamaños. Tienes dos opciones:

### Opción 1: Usar Android Asset Studio (Recomendado)

1. Visita: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

2. Sube la imagen: `assets/app-icon.jpeg`

3. Configura los ajustes:
   - **Shape**: Elige "None" para mantener la forma original, o "Circle" para iconos redondeados
   - **Padding**: Ajusta según prefieras
   - **Background color**: Opcional

4. Haz clic en **"Download"** para descargar el ZIP

5. Extrae el contenido del ZIP

6. Copia las carpetas `mipmap-*` al directorio:
   ```
   android/app/src/main/res/
   ```
   
   Deberías tener:
   - `mipmap-mdpi/ic_launcher.png` y `ic_launcher_round.png`
   - `mipmap-hdpi/ic_launcher.png` y `ic_launcher_round.png`
   - `mipmap-xhdpi/ic_launcher.png` y `ic_launcher_round.png`
   - `mipmap-xxhdpi/ic_launcher.png` y `ic_launcher_round.png`
   - `mipmap-xxxhdpi/ic_launcher.png` y `ic_launcher_round.png`

### Opción 2: Usar el Script PowerShell (Requiere ImageMagick)

Si tienes ImageMagick instalado:

1. Ejecuta el script:
   ```powershell
   cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
   .\scripts\generar-iconos-android.ps1
   ```

2. Si no tienes ImageMagick, el script te proporcionará instrucciones para instalarlo o usar la Opción 1.

## 🌐 Verificar Favicon Web

Para verificar que el favicon funciona en web:

1. Inicia el servidor web:
   ```bash
   npm run web
   ```

2. Abre tu navegador en: http://localhost:3000

3. Verifica que el favicon aparezca en la pestaña del navegador

## 📝 Notas

- El favicon web está configurado para usar formato JPEG (soportado por navegadores modernos)
- Los iconos de Android deben estar en formato PNG
- Los iconos de Android deben estar en diferentes resoluciones para diferentes densidades de pantalla
- Después de actualizar los iconos de Android, necesitarás recompilar la app:
  ```bash
  npm run android
  ```
