# 🔧 Solución: Error de Android Studio - Proceso Bloqueado

## ❌ Error Encontrado

```
Internal error: Process "studio64.exe" (25556) is still running and does not respond.
```

Este error ocurre cuando Android Studio queda bloqueado o hay múltiples instancias corriendo al mismo tiempo.

## ✅ Solución Rápida

### Opción 1: Cerrar Procesos desde PowerShell (Recomendado)

Ejecuta este comando en PowerShell:

```powershell
# Cerrar todos los procesos de Android Studio
Get-Process | Where-Object {$_.ProcessName -like "*studio*"} | Stop-Process -Force

# También puedes cerrar procesos Java relacionados si es necesario
Get-Process | Where-Object {$_.ProcessName -eq "java" -and $_.Path -like "*android*"} | Stop-Process -Force
```

### Opción 2: Desde el Administrador de Tareas

1. Presiona `Ctrl + Shift + Esc` para abrir el Administrador de Tareas
2. Busca procesos llamados:
   - `studio64.exe`
   - `idea64.exe` (si existe)
   - `java.exe` (relacionados con Android Studio)
3. Click derecho en cada uno > "Finalizar tarea"
4. Repite hasta que no queden procesos

### Opción 3: Comando desde Terminal

```powershell
# Cerrar proceso específico por PID
taskkill /PID 25556 /F

# O cerrar todos los procesos de studio64
taskkill /IM studio64.exe /F
```

## 🔍 Verificar que se Cerraron

Ejecuta esto para verificar:

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*studio*"}
```

Si no muestra nada, todos los procesos fueron cerrados.

## 🚀 Reiniciar Android Studio

Después de cerrar los procesos:

1. **Espera 5-10 segundos** para que los archivos de bloqueo se liberen
2. **Abre Android Studio nuevamente**
3. Debería abrir sin problemas

## 🛠️ Soluciones Adicionales

### Si el problema persiste:

#### 1. Eliminar Archivos de Bloqueo

Los archivos de bloqueo están en:
- Windows: `%USERPROFILE%\.AndroidStudio<version>\config\`
- O en: `C:\Users\<tu_usuario>\.AndroidStudio<version>\`

Puedes eliminar estos archivos (cuidado, perderás configuraciones):

```powershell
# CUIDADO: Esto eliminará configuraciones
Remove-Item "$env:USERPROFILE\.AndroidStudio*" -Recurse -Force -ErrorAction SilentlyContinue
```

#### 2. Reiniciar el Equipo

Si nada funciona, reinicia Windows:
```powershell
Restart-Computer
```

#### 3. Verificar Permisos

Asegúrate de tener permisos de administrador si es necesario.

## 📝 Script Automático

He creado un script `cerrar-android-studio.ps1` que puedes ejecutar para cerrar todos los procesos automáticamente.

## ⚠️ Advertencias

- **Cerrar procesos con `-Force`** puede causar pérdida de datos no guardados
- Si tienes proyectos abiertos sin guardar, intenta guardarlos primero
- Algunos procesos Java pueden ser de otras aplicaciones, verifica antes de cerrar

## ✅ Prevención

Para evitar este problema en el futuro:

1. **Cierra Android Studio correctamente** (File > Exit)
2. **No fuerces el cierre** con el Administrador de Tareas a menos que sea necesario
3. **Espera** a que Android Studio se cierre completamente antes de abrirlo de nuevo

## 🔗 Referencias

- [Android Studio Troubleshooting](https://developer.android.com/studio/intro/studio-config#troubleshooting)
- [IntelliJ Platform Directory Lock](https://www.jetbrains.com/help/idea/troubleshooting-common-issues.html)
