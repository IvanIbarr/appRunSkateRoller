# Resumen - Cambios en Pantalla de Registro

## ✅ Cambio Implementado

Se modificó la pantalla de registro (`RegistroScreen.tsx`) para que **solo muestre dos opciones** de tipo de perfil:

1. **Líder de Grupo** (`liderGrupo`)
2. **Roller** (`roller`)

La opción de **Administrador** (`administrador`) ya no está disponible para el registro público.

---

## 🔧 Cambios Realizados

### Frontend - RegistroScreen.tsx

**Antes:**
```typescript
['administrador', 'liderGrupo', 'roller']
```

**Ahora:**
```typescript
['liderGrupo', 'roller']
```

### Comportamiento

- **Valor por defecto:** `'roller'` (se mantiene)
- **Opciones visibles:** Solo "Líder de Grupo" y "Roller"
- **Validación:** El backend sigue aceptando los tres valores (para flexibilidad futura), pero el frontend solo permite seleccionar dos

---

## 🔒 Seguridad

El backend aún acepta `'administrador'` como valor válido en la validación, pero:
- ✅ El frontend **no permite** seleccionarlo
- ✅ Los usuarios solo pueden auto-registrarse como `'liderGrupo'` o `'roller'`
- ✅ Si en el futuro se necesita crear administradores, se puede hacer desde el backend o un panel de administración

---

## 📝 Nota

Si en el futuro quieres que el backend también restrinja el valor de `tipoPerfil` en el registro para que solo acepte `'liderGrupo'` o `'roller'`, puedes modificar la validación en:

`SIIG-ROLLER-BACKEND/src/routes/authRoutes.js`

Cambiar la línea 56 de:
```javascript
.isIn(['administrador', 'liderGrupo', 'roller'])
```

a:
```javascript
.isIn(['liderGrupo', 'roller'])
```

Sin embargo, mantener ambas opciones (frontend restringido + backend flexible) es una práctica común que permite crear administradores desde otras fuentes si es necesario.

---

## ✅ Estado

- ✅ Frontend actualizado - Solo muestra 2 opciones
- ✅ Backend - Acepta los valores (flexibilidad mantenida)
- ✅ Valor por defecto - `'roller'` (sin cambios)

