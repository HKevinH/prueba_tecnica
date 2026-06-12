# 05 — Validación de schemas con Zod + error handler global

**Herramienta**: Claude Code (claude-sonnet-4-6) en VSCode

---

## Turno 1

**Usuario**: Hay un error si no sabes: falta algo importante, falta crear los validadores de schema de lo que esperamos. Recomiendo agregar eso en un error handler global, por si faltan campos diga los campos que salgan. Recuerda los esquemas, si es necesario usar Yup u otro validador. Y agrega este prompt en el history.

**Asistente**:

Identificó que las rutas tenían validación manual ad-hoc (`if (!clientId || !insurer)`) sin estructura consistente ni mensajes por campo. Implementó validación declarativa con Zod.

### Archivos creados / modificados

**`src/backend/package.json`** — Agrega `zod` como dependencia.

**`src/schemas/index.ts`** — Schemas centralizados para todos los endpoints:
- `createClientSchema` / `updateClientSchema`
- `createPolicySchema` / `updatePolicySchema`
- `createActionSchema` — incluye refinement cross-field: si `actionType === 'renovacion'`, `newExpirationDate` es requerido
- Tipos inferidos con `z.infer<typeof schema>` exportados como `CreateClientInput`, etc.

**`src/middleware/validate.ts`** — Middleware genérico reutilizable:
```typescript
export function validate(schema: ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        fields: result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data  // sobrescribe con datos parseados y tipados
    return next()
  }
}
```

**`src/middleware/errorHandler.ts`** — Actualizado para interceptar `ZodError` si escapa del middleware (por ejemplo, desde servicios):
```typescript
if (err instanceof ZodError) {
  return res.status(400).json({ error: 'Datos inválidos', fields: err.flatten().fieldErrors })
}
```

**`src/routes/clients.ts`** y **`src/routes/policies.ts`** — Validación manual eliminada, reemplazada por `validate(schema)` como middleware en cada ruta. Los handlers reciben `req.body` ya tipado con los tipos inferidos de Zod.

### Por qué Zod sobre Yup

- TypeScript-first: infiere tipos automáticamente, sin duplicar interfaces
- `safeParse` no lanza excepciones, retorna `{ success, data, error }` — más predecible
- `flatten().fieldErrors` da errores por campo en un objeto listo para serializar a JSON
- Integración con Prisma: cuando los schemas evolucionan, los tipos del handler evolucionan con ellos

### Ejemplo de respuesta de error ahora

```json
{
  "error": "Datos inválidos",
  "fields": {
    "insurer": ["La aseguradora es requerida"],
    "expirationDate": ["La fecha de vencimiento es requerida"],
    "newExpirationDate": ["newExpirationDate es requerida para una renovación"]
  }
}
```

### Decisión tomada: refinement cross-field en createActionSchema

El caso `renovacion` sin `newExpirationDate` es un error de negocio grave — renovar sin fecha nueva deja la póliza en estado inconsistente. Se validó con `.refine()` a nivel del objeto (no del campo individual) para poder referenciar múltiples campos.

---

*Duración de esta etapa: ~20 minutos*
