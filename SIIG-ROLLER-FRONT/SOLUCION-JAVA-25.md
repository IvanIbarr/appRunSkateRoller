# ⚠️ Solución: Error de Compatibilidad con Java 25

## 🔍 Problema

El error `java.lang.IllegalArgumentException: 25` ocurre porque **Java 25 no es compatible** con la versión de Kotlin (1.9.22) y Gradle que usa este proyecto de React Native.

## ✅ Solución: Instalar Java 17 LTS

React Native 0.73 requiere **Java 17** o **Java 21** (versiones LTS). Java 25 es demasiado nueva y no es compatible aún.

---

## 📥 Opción 1: Instalar Java 17 mediante Chocolatey (Recomendado)

Si tienes Chocolatey instalado:

```powershell
choco install openjdk17 -y
```

Luego configura JAVA_HOME:

```powershell
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\OpenJDK\openjdk-17', 'User')
$env:JAVA_HOME = 'C:\Program Files\OpenJDK\openjdk-17'
```

---

## 📥 Opción 2: Instalar Java 17 Manualmente

1. **Descarga Java 17 LTS:**
   - Ve a: https://adoptium.net/temurin/releases/?version=17
   - Descarga la versión **Windows x64 JDK** (`.msi` installer)

2. **Instala Java 17:**
   - Ejecuta el instalador
   - Acepta los términos
   - Asegúrate de marcar **"Set JAVA_HOME variable"** durante la instalación

3. **Configura JAVA_HOME manualmente (si no se configuró automáticamente):**

```powershell
# Verifica dónde se instaló (generalmente):
# C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot

[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'User')
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot'
```

---

## 📥 Opción 3: Usar Java de Android Studio (Si está instalado)

Si tienes Android Studio, puede tener un JDK embebido:

1. **Busca el JDK de Android Studio:**

```powershell
# En Android Studio, ve a:
# File → Settings → Build, Execution, Deployment → Build Tools → Gradle
# Busca "Gradle JDK" y copia la ruta

# O busca manualmente:
Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk" -Recurse -Filter "jbr" -Directory -ErrorAction SilentlyContinue
Get-ChildItem "$env:ProgramFiles\Android\Android Studio\jbr" -Directory -ErrorAction SilentlyContinue
```

2. **Configura JAVA_HOME:**

```powershell
# Reemplaza con la ruta real que encontraste
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Android\Android Studio\jbr', 'User')
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
```

---

## ✅ Verificar la Instalación

Después de instalar y configurar Java 17:

1. **Cierra y abre una nueva terminal** (para que cargue las nuevas variables de entorno)

2. **Verifica la versión de Java:**

```powershell
java -version
```

Deberías ver algo como:
```
openjdk version "17.0.x" ...
```

3. **Verifica JAVA_HOME:**

```powershell
echo $env:JAVA_HOME
```

Debería mostrar la ruta a Java 17.

4. **Prueba la compilación:**

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```

---

## 🔄 Alternativa Temporal: Desinstalar Java 25

Si no quieres instalar Java 17, puedes desinstalar Java 25 temporalmente:

1. Ve a **Panel de Control** → **Programas** → **Desinstalar programas**
2. Busca "Java" y desinstala Java 25
3. Instala Java 17 según las opciones anteriores

---

## 📝 Notas

- **Java 17 es LTS (Long Term Support)**, por lo que es la versión más estable y recomendada para React Native
- **Java 21 también es LTS** y es compatible, pero Java 17 es más ampliamente probada con React Native 0.73
- Puedes tener múltiples versiones de Java instaladas, solo asegúrate de que `JAVA_HOME` apunte a Java 17
- Si usas Android Studio, puedes configurarlo para usar Java 17 específicamente para este proyecto

---

## 🆘 Si el Problema Persiste

1. Verifica que `JAVA_HOME` esté configurado correctamente
2. Reinicia tu terminal/IDE completamente
3. Limpia el caché de Gradle:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT\android"
.\gradlew clean
```

4. Intenta compilar de nuevo:

```powershell
cd "D:\curso kotlin\recursos de la app roller\SIIG-ROLLER-FRONT"
npm run android
```


