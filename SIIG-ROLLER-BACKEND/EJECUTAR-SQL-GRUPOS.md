# Configurar tabla `grupos` (equipos de líder)

## ¿Por qué hace falta?

El esquema base de la app incluye **`grupos_rodadas`** (grupos en una ruta en vivo), pero **no** incluye la tabla **`grupos`** (equipo del líder: nombre del grupo, staff, integrantes).

Si ves error **500** en `/grupo/nombre` con mensaje `no existe la relación «grupos»`, falta ejecutar este setup.

## Opción recomendada (desde el proyecto)

En PowerShell, dentro de `SIIG-ROLLER-BACKEND`:

```powershell
npm run db:grupos:setup
```

Solo verificar sin cambiar nada:

```powershell
npm run db:grupos:check
```

El script usa el `.env` del backend (`DB_HOST`, `DB_NAME`, etc.) y aplica `scripts/create-grupos-table.sql`.

## Opción manual (pgAdmin)

1. Abre pgAdmin → base `siig_roller_db` → Query Tool  
2. Copia y ejecuta el contenido de `scripts/create-grupos-table.sql`  
3. Reinicia el backend (`npm run start`)

## Después del setup

1. Reinicia el backend si estaba corriendo  
2. En la app Flutter, recarga `/grupo/nombre`  
3. Como líder sin grupo, escribe el nombre y guarda

## Notas

- **`grupos`** ≠ **`grupos_rodadas`**: nombres parecidos, tablas distintas.  
- Tras `npm run db:restore`, ejecuta también `npm run db:grupos:setup`.  
- Un líder solo puede tener un grupo (`unique_lider_grupo`).
