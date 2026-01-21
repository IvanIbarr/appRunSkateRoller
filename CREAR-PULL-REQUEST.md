# 📝 Guía para Crear el Pull Request

## Paso a Paso para Crear el PR

### Opción 1: Desde el Enlace Directo (Más Rápido)

He abierto automáticamente esta URL en tu navegador:
```
https://github.com/IvanIbarr/appRunSkateRoller/compare/main...feature/adjuntos-imagenes-videos-mejoras-ui
```

Si no se abrió automáticamente, copia y pega esta URL en tu navegador.

### Opción 2: Desde GitHub Manualmente

1. **Ve al repositorio:**
   ```
   https://github.com/IvanIbarr/appRunSkateRoller
   ```

2. **Verás un banner** en la parte superior que dice:
   ```
   feature/adjuntos-imagenes-videos-mejoras-ui had recent pushes
   [Compare & pull request]
   ```
   
3. **Haz clic en "Compare & pull request"**

## 📋 Completar el Formulario del PR

### Título (ya sugerido):
```
feat: Implementacion de adjuntos y mejoras de UI
```

### Descripción:

**Opción A: Usar la descripción completa**

Copia y pega el contenido del archivo `PULL-REQUEST-DESCRIPTION.md` que está en la raíz del proyecto.

**Opción B: Descripción resumida**

Copia y pega esto:

```markdown
## ✨ Cambios Principales

### Funcionalidad de Adjuntos
- Implementación completa para adjuntar imágenes y videos en chats (General y Staff)
- Soporte multiplataforma: Web, Android e iOS
- Componentes nuevos: AttachmentPicker, AttachmentPreview, ChatAttachment

### Mejoras de UI
- Homologación de fuentes (Permanent Marker) en títulos principales
- Rediseño completo de pantalla de Historial
- Mejoras en Calendario y Menú
- Botones con color azul (#007AFF) homologado

### Configuración
- Permisos Android configurados
- Dependencias agregadas (react-native-image-picker, react-native-video)
- Documentación completa

## 📊 Estadísticas
- 42 archivos modificados/creados
- +5,865 líneas agregadas
- -603 líneas eliminadas

## ⚠️ Notas
- Backend necesita actualizarse para manejar archivos adjuntos
- iOS requiere agregar permisos cuando se genere el proyecto

Ver detalles completos en: `PULL-REQUEST-DESCRIPTION.md`
```

### Labels (opcionales):
- `enhancement` - Nueva funcionalidad
- `feature` - Nueva característica
- `ui/ux` - Mejoras de interfaz

### Reviewers (opcional):
- Si tienes colaboradores, puedes agregarlos para que revisen

### Assignees (opcional):
- Puedes asignar el PR a ti mismo o a otro desarrollador

## ✅ Crear el PR

1. **Revisa** que el título y descripción estén correctos
2. **Verifica** que el branch base sea `main` (debería estar por defecto)
3. **Haz clic en "Create pull request"** (botón verde)

## 🎯 Después de Crear el PR

### Lo que puedes hacer:
1. **Ver los cambios** - Revisa todos los archivos modificados
2. **Agregar comentarios** - Comenta en líneas específicas si necesitas
3. **Revisar el diff** - Ve exactamente qué cambió línea por línea
4. **Ejecutar CI/CD** - Si tienes configurado, se ejecutarán tests automáticos

### Cuando estés listo para fusionar:
1. **Revisa** que todos los cambios estén correctos
2. **Asegúrate** que no haya conflictos
3. **Haz clic en "Merge pull request"**
4. **Confirma** el merge
5. **Opcional**: Elimina el branch después del merge

## 📝 Template Completo para Copiar

He creado el archivo `PULL-REQUEST-DESCRIPTION.md` con toda la descripción detallada que puedes copiar y pegar en el PR.

## 🔗 URLs Útiles

- **Comparar cambios:**
  https://github.com/IvanIbarr/appRunSkateRoller/compare/main...feature/adjuntos-imagenes-videos-mejoras-ui

- **Ver el branch:**
  https://github.com/IvanIbarr/appRunSkateRoller/tree/feature/adjuntos-imagenes-videos-mejoras-ui

- **Crear PR:**
  https://github.com/IvanIbarr/appRunSkateRoller/pull/new/feature/adjuntos-imagenes-videos-mejoras-ui

---

**¡Listo para crear el PR!** 🚀
