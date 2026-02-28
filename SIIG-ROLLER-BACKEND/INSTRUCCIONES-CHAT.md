# Instrucciones para Configurar el Sistema de Chat

## 1. Crear la Tabla de Mensajes en PostgreSQL

Ejecuta el script SQL para crear la tabla de mensajes:

```bash
# Opción 1: Desde PowerShell (recomendado)
cd SIIG-ROLLER-BACKEND/scripts
.\create-mensajes-table.ps1

# Opción 2: Desde psql
psql -U postgres -d siig_roller_db -f scripts/create-mensajes-table-safe.sql

# Opción 3: Desde pgAdmin
# 1. Abre pgAdmin
# 2. Conecta a tu servidor PostgreSQL
# 3. Selecciona la base de datos "siig_roller_db"
# 4. Haz clic derecho en "Query Tool"
# 5. Copia y pega el contenido de scripts/create-mensajes-table-safe.sql
# 6. Ejecuta el script (F5)
```

**IMPORTANTE**: Si obtienes un error 500 al acceder al chat, es porque la tabla `mensajes` no existe. Ejecuta uno de los métodos arriba para crear la tabla.

## 2. Verificar que la Tabla se Creó Correctamente

```sql
-- Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'mensajes';

-- Ver la estructura de la tabla
\d mensajes

-- Verificar el tipo ENUM
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'tipo_chat';
```

## 3. Estructura de la Tabla

La tabla `mensajes` tiene la siguiente estructura:

- `id` (UUID): Identificador único del mensaje
- `chat_type` (tipo_chat ENUM): Tipo de chat ('general' o 'staff')
- `usuario_id` (UUID): ID del usuario que envió el mensaje (FK a usuarios)
- `texto` (TEXT): Contenido del mensaje
- `created_at` (TIMESTAMP): Fecha y hora de creación

### Índices Creados:

- `idx_mensajes_chat_type`: Índice en el tipo de chat
- `idx_mensajes_usuario_id`: Índice en el ID del usuario
- `idx_mensajes_created_at`: Índice en la fecha de creación
- `idx_mensajes_chat_type_created_at`: Índice compuesto para consultas optimizadas

## 4. Retención de 7 Días

El sistema automáticamente filtra mensajes de más de 7 días en las consultas. Los mensajes antiguos no se eliminan automáticamente, pero puedes ejecutar manualmente la función para limpiar mensajes antiguos:

```sql
-- Eliminar mensajes de más de 7 días
SELECT eliminar_mensajes_antiguos();

-- O usar el método del modelo:
DELETE FROM mensajes WHERE created_at < NOW() - INTERVAL '7 days';
```

## 5. APIs Disponibles

### GET /api/chat/:chatType
Obtiene los mensajes de un chat específico (solo últimos 7 días)

**Parámetros:**
- `chatType`: 'general' o 'staff'

**Headers:**
- `Authorization: Bearer <token>`

**Respuesta:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "text": "Mensaje de prueba",
      "userId": "uuid",
      "userName": "email@example.com",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "chatType": "general"
    }
  ]
}
```

### POST /api/chat
Crea un nuevo mensaje

**Body:**
```json
{
  "chatType": "general",
  "text": "Mi mensaje"
}
```

**Headers:**
- `Authorization: Bearer <token>`

**Respuesta:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "text": "Mi mensaje",
    "userId": "uuid",
    "userName": "email@example.com",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "chatType": "general"
  }
}
```

## 6. Permisos

- **Chat General**: Todos los usuarios autenticados pueden leer y escribir
- **Chat Staff**: Solo usuarios con perfil 'administrador' o 'liderGrupo' pueden leer y escribir

## 7. Notas Importantes

1. Los mensajes se almacenan en PostgreSQL y se filtran automáticamente para mostrar solo los últimos 7 días
2. El frontend implementa polling cada 3 segundos para obtener mensajes nuevos en tiempo real
3. Los mensajes tienen un límite de 1000 caracteres
4. El sistema valida permisos en el backend antes de permitir acceso al chat staff

