# 06 — Response Handler centralizado + Global Exception Handler

**Herramienta**: Claude Code (claude-sonnet-4-6) en VSCode

---

## Turno 1

**Usuario**: Recomendaría implementar un Response Handler o una capa centralizada para la gestión de respuestas de la API. Actualmente las respuestas se construyen directamente en los endpoints mediante `res.status(...)`, lo que puede generar inconsistencias entre controladores y aumentar la duplicación de código.

Mantendría los códigos HTTP estándar (200, 201, 400, 404, 500, etc.), pero centralizaría la estructura de las respuestas para garantizar uniformidad en toda la aplicación. De esta manera, tanto las respuestas exitosas como los errores seguirían un formato consistente definido en un único punto de la arquitectura.

Además, complementaría esta solución con un Global Exception Handler encargado de interceptar excepciones de negocio, validación o infraestructura y transformarlas automáticamente en respuestas estandarizadas. Esto mejora la mantenibilidad del código, facilita el consumo de la API desde el frontend y evita que cada endpoint tenga que gestionar manualmente los mismos escenarios de error.

**Asistente**:

### Archivos creados / modificados

**`src/lib/apiResponse.ts`** — Objeto `ApiResponse` con métodos tipados:
```typescript
ApiResponse.ok(res, data)       // 200 { success: true, data }
ApiResponse.created(res, data)  // 201 { success: true, data }
ApiResponse.notFound(res, msg)  // 404 { success: false, error }
ApiResponse.badRequest(res, msg, fields?) // 400 { success: false, error, fields? }
ApiResponse.serverError(res)    // 500 { success: false, error }
```

**`src/middleware/errorHandler.ts`** — Global Exception Handler actualizado para interceptar:
- `ZodError` → 400 con `fields` por campo
- `Prisma.PrismaClientKnownRequestError`:
  - `P2025` (not found) → 404
  - `P2002` (unique constraint) → 400
  - `P2003` (foreign key) → 400
- Cualquier otro `Error` → 500

**Todas las rutas** (`dashboard`, `workload`, `clients`, `policies`) — `res.json(...)` y `res.status(...).json(...)` reemplazados por `ApiResponse.*`.

**`src/frontend/src/api/client.ts`** — Interceptor de Axios que desenvuelve `{ success: true, data: T }` a `T` transparentemente. Los hooks del frontend no necesitan cambios.

### Estructura de respuesta unificada

```json
// Éxito
{ "success": true, "data": { ... } }

// Error de validación
{ "success": false, "error": "Datos inválidos", "fields": { "campo": ["mensaje"] } }

// Error de negocio / infra
{ "success": false, "error": "El registro no existe o ya fue eliminado" }
```

### Decisión: interceptor vs. cambiar todos los callers del frontend

Se optó por un interceptor de Axios en lugar de actualizar cada función del cliente API. El interceptor convierte la respuesta del servidor antes de que React Query la reciba, haciendo el cambio invisible para el resto del frontend. Principio de menor sorpresa: código existente sigue funcionando sin modificaciones.

---

*Duración de esta etapa: ~15 minutos*
