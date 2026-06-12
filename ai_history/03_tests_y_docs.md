# 03 — Tests y documentación

**Herramienta**: Claude Code (claude-sonnet-4-6) en VSCode

---

## Tests

**Archivo**: `tests/priority.test.ts`

Decidí testear la función `classifyPolicyPriority` directamente, no el endpoint. Razones:

1. La ventana de 30 días es lógica pura — no depende de base de datos ni HTTP
2. Es el caso de negocio más crítico: el punto exacto donde `critical_window` se convierte en `outside_window` es el momento donde el asesor pierde la ventaja competitiva
3. Los tests de la función pura son más rápidos, más estables, y más fáciles de leer como documentación ejecutable

**Los 3 tests críticos del enunciado:**
1. Póliza vencida hace 15 días → `critical_window` (caso medio de la ventana)
2. Póliza vencida hace exactamente 30 días → `critical_window` (límite superior de la ventana)
3. Póliza vencida hace 31 días → `outside_window` (un día después del límite — punto de no retorno)

Agregué tests adicionales para los otros buckets (`expires_today`, `expiring_soon`, `active`) y para `getDaysOverdue` porque son parte del mismo servicio y su correctitud depende de los mismos cálculos.

**Decisión de fecha fija en tests:**  
Usé `new Date('2026-06-12T00:00:00Z')` como referencia en lugar de `new Date()`. Un test que depende de la fecha del sistema es un test que puede romperse en cualquier momento sin que el código haya cambiado. La fecha fija hace el test determinista.

---

## Documentación

**spec.md**: Escrito antes de empezar a codear (estructura mental del sistema), expandido al final con los detalles que surgieron durante la implementación.

**code_review.md**: Análisis del snippet de Python. Identifiqué 3 problemas reales:
1. Sin manejo de errores / conexión no cerrada → puede causar leak de conexiones en producción
2. N+1 queries dentro del loop → 161 queries para 80 pólizas en lugar de 1
3. Lógica de prioridad que no refleja la ventana de 30 días del negocio colombiano → el asesor prioriza mal

Más uno menor: `debug=True` en producción es una vulnerabilidad de RCE.

El problema 3 es el más interesante porque es un error de dominio, no técnico. El código "funciona" en sentido técnico pero resuelve el problema equivocado.

**README.md**: Estructura sugerida en el enunciado. Incluye los 3 comandos de setup, decisiones de diseño, qué dejé fuera, qué faltaría para producción, tiempo.

---

## Algo que reconsideré durante la documentación

En el spec original pensé en incluir una pantalla de detalle por cliente. Al escribir el README me di cuenta de que no la había construido — pero que tampoco era necesaria para el flujo de trabajo de María. Documenté la omisión explícitamente en lugar de pretender que no existía.

---

*Duración de esta etapa: ~50 minutos*
