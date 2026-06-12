# 07 — Catálogo centralizado de mensajes de validación

**Herramienta**: Claude Code (claude-sonnet-4-6) en VSCode

---

## Turno 1

**Usuario**: Adicionalmente, identifiqué una oportunidad de mejora en la estrategia de validaciones con Zod. Actualmente los mensajes de error están definidos directamente como strings dentro de los esquemas, lo que puede generar duplicación, inconsistencias y dificultar el mantenimiento cuando la aplicación crezca.

Recomendaría centralizar los mensajes de validación en un catálogo o constante compartida, definiendo mensajes genéricos reutilizables para escenarios comunes como campos requeridos, formatos inválidos, longitudes mínimas o máximas, entre otros.

Por ejemplo, en lugar de declarar mensajes hardcodeados en cada validación, se podría contar con una estructura similar a:

```typescript
export const ValidationMessages = {
  REQUIRED: "Este campo es obligatorio",
  INVALID_EMAIL: "El correo electrónico no es válido",
  INVALID_PHONE: "El número de teléfono no es válido",
  MIN_LENGTH: (min: number) => `Debe contener al menos ${min} caracteres`,
};
```

De esta forma, cuando un campo sea marcado como required, el sistema reutilizará automáticamente el mensaje correspondiente, manteniendo consistencia en toda la aplicación y facilitando futuras modificaciones, internacionalización o personalización de mensajes.

Esta mejora contribuye a una arquitectura más mantenible, desacopla la lógica de validación de los textos mostrados al usuario y reduce la duplicación de código.

**Nota**: Durante la revisión se propuso refactorizar el manejo de mensajes de validación en Zod, reemplazando strings hardcodeados por un catálogo centralizado de mensajes reutilizables con el objetivo de mejorar la mantenibilidad, consistencia y escalabilidad de la arquitectura.

**Asistente**:

### Archivos creados / modificados

**`src/schemas/messages.ts`** — Catálogo centralizado:
```typescript
export const ValidationMessages = {
  REQUIRED: 'Este campo es obligatorio',
  INVALID_EMAIL: 'El correo electrónico no es válido',
  INVALID_DATE: 'La fecha ingresada no es válida',
  POSITIVE_NUMBER: 'El valor debe ser mayor a cero',
  MIN_LENGTH: (min: number) => `Debe contener al menos ${min} caracteres`,
  ENUM: (values: string[]) => `Debe ser uno de: ${values.join(', ')}`,
}
```

**`src/schemas/index.ts`** — Todos los strings de mensajes reemplazados por referencias a `VM.*`. Las constantes de enums (`POLICY_TYPES`, `ACTION_TYPES`) también se centralizaron para que `VM.ENUM([...POLICY_TYPES])` genere el mensaje con los valores correctos automáticamente.

### Beneficios concretos

- **Un solo lugar para cambiar**: si se decide traducir la app o ajustar el tono de los mensajes, se toca `messages.ts` y se propaga a toda la aplicación.
- **Consistencia garantizada**: `VM.REQUIRED` siempre dice lo mismo, sin riesgo de que un endpoint diga "es requerido" y otro "es obligatorio".
- **Preparado para i18n**: el catálogo es el punto de entrada natural para integrar una librería de internacionalización en el futuro.
- **Los factory functions** (`MIN_LENGTH`, `ENUM`) permiten mensajes dinámicos sin romper la uniformidad.

---

*Duración de esta etapa: ~10 minutos*
