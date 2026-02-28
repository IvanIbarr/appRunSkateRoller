# Guía: Usar Expo Go con iPhone desde Windows

## ✅ Estado Actual

- ✅ **iPhone conectado** (detectado en Windows)
- ✅ **Expo Go instalado** en el iPhone
- ✅ **WiFi configurado**
- ⚠️ **Proyecto es React Native CLI** (no Expo nativo)

## ⚠️ Limitación Importante

**Expo Go solo funciona con proyectos Expo**, no con React Native CLI puro.

El proyecto actual es **React Native CLI**, por lo que Expo Go **NO funcionará directamente**.

## 🎯 Opciones Disponibles

### Opción 1: Convertir Proyecto a Expo (Complejo)

Requiere migrar el código a Expo, lo cual puede tomar tiempo.

### Opción 2: Usar macOS para Compilar (Recomendado)

Si tu laptop es Mac o tienes acceso a Mac:
- Conectar iPhone por USB
- Ejecutar: `npm run ios --device`

### Opción 3: Usar Expo Development Build

Crear un build de desarrollo con Expo que incluya código nativo.

## 📱 Si tu Laptop es Mac

Si tu laptop es Mac (aunque estés en Windows ahora), puedes:

1. **Reiniciar en macOS** (si es Mac con Boot Camp)
2. **O usar macOS directamente** si tienes acceso

Luego ejecutar:
```bash
cd "ruta/al/proyecto/SIIG-ROLLER-FRONT"
npm start          # Terminal 1
npm run ios --device  # Terminal 2
```

## 🔧 Pasos Inmediatos

### Verificar Tipo de Laptop

¿Tu laptop es Mac o Windows?

- **Si es Mac**: Reinicia en macOS y ejecuta los comandos
- **Si es Windows**: Necesitas acceso a macOS (físico o en la nube)

### Si Tienes Acceso a macOS

1. **Conectar iPhone por USB**
2. **Confiar en la computadora** (en el iPhone)
3. **Ejecutar comandos en macOS**:
   ```bash
   npm start              # Terminal 1
   npm run ios --device   # Terminal 2
   ```

## 🚀 Alternativa: Probar en Android

Mientras tanto, puedes probar en Android desde Windows:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

## 📝 Resumen

| Opción | Requisitos | Complejidad |
|--------|-----------|------------|
| Compilar iOS nativo | macOS + Xcode | ⭐⭐ Media |
| Convertir a Expo | Migrar código | ⭐⭐⭐ Alta |
| Probar en Android | Android Studio | ⭐ Baja |

## ✅ Recomendación

**La forma más rápida de probar en iPhone:**
1. Acceso a macOS (físico o en la nube)
2. Conectar iPhone por USB
3. Ejecutar: `npm run ios --device`

**Expo Go NO funcionará** con este proyecto porque es React Native CLI, no Expo.

