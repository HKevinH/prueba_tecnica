# 04 — Refactor: Custom Hooks + SOLID + Estados tipados

**Herramienta**: Claude Code (claude-sonnet-4-6) en VSCode

---

## Turno 1

**Usuario**: Necesito lo siguiente: está mal meter lógica de hooks dentro del componente. Recuerda los conceptos SOLID y también tipar los states si es string o boolean o qué es. También podemos hacer un reset de forms controls en hook pasándole como array o lista los states.

**Asistente**:

Refactorizó `NewPolicyDialog.tsx` y `NewClientDialog.tsx` extrayendo toda la lógica a custom hooks.

### Archivos creados

**`src/hooks/useFormReset.ts`**
Hook genérico que recibe un array de tuplas `[setter, valorInicial]` y devuelve una función que resetea todos los campos de una sola vez. Reutilizable en cualquier formulario.

```typescript
type ResetEntry<T> = [React.Dispatch<React.SetStateAction<T>>, T]

export function useFormReset(entries: Array<ResetEntry<any>>) {
  return useCallback(() => {
    entries.forEach(([setter, defaultValue]) => setter(defaultValue))
  }, [])
}
```

**`src/hooks/useNewPolicyForm.ts`**
Contiene toda la lógica del formulario de nueva póliza: estados tipados explícitamente (`useState<string>`), query de clientes, mutation de creación, reset y validación.

**`src/hooks/useNewClientForm.ts`**
Misma separación para el formulario de nuevo cliente.

### Principios SOLID aplicados

- **S (Single Responsibility)**: El hook maneja lógica, el componente solo renderiza.
- **D (Dependency Inversion)**: El componente depende de la abstracción que expone el hook, no de la implementación concreta de los estados.
- **useFormReset como abstracción abierta**: Se puede reutilizar en cualquier otro formulario pasándole diferentes arrays de entries (O — Open/Closed).

### Estados tipados explícitamente

Antes: `useState('')`  
Después: `useState<string>('')`

Todos los estados ahora tienen su tipo explícito, lo que evita inferencias incorrectas si el valor inicial cambia.

### Decisión que se tomó y no se usó

Se consideró un enfoque alternativo donde `useFormReset` recibía solo funciones `() => void` (resetters ya parcialmente aplicados), pero se eligió la tupla `[setter, defaultValue]` porque hace explícito el valor al que vuelve cada campo — más legible como documentación del estado inicial del formulario.

---

*Duración de esta etapa: ~15 minutos*
