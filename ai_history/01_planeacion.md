# 01 — Planificación

**Herramienta**: Claude Code (claude-sonnet-4-6) en VSCode

---

## Turno 1

**Usuario**: [Comparte el PDF de la prueba técnica con consideraciones técnicas previas. Indica que Docker no debe ser obligatorio, solo opcional.]

**Asistente**: 

Revisó el directorio de trabajo (vacío) y planificó la implementación completa:

- Backend: Express + TypeScript + Prisma + SQLite
- Frontend: React + TypeScript + Vite + Material UI
- Monorepo: npm workspaces
- Tests: Jest con ts-jest, foco en la ventana de 30 días
- Setup: máximo 3 comandos (`npm install`, `npm run db:setup`, `npm run dev`)
- Docker: Dockerfiles opcionales incluidos pero no requeridos para correr la app

**Decisiones clave tomadas en esta etapa:**

1. **La prioridad se calcula en runtime**: Almacenar el bucket (`critical_window`, etc.) en la BD crearía drift. Una función pura que toma `expirationDate` y `today` es testeable y siempre correcta.

2. **Estructura de datos**: La ventana de 30 días aplica a todas las pólizas (no solo auto), así que el modelo es agnóstico al tipo.

3. **Sistema single-user**: No implementar autenticación. Toda la complejidad de multi-asesor queda fuera del alcance.

4. **El caso crítico es el límite de la ventana**: El test más importante es verificar que una póliza vencida hace 30 días está en `critical_window` y una vencida hace 31 está en `outside_window`. Este es el punto de quiebre del negocio.

5. **Seed data realista**: Incluir pólizas en todos los buckets para que la app se vea útil desde el primer arranque.

**Estructura del proyecto acordada:**
```
prueba_tecnica/
├── src/
│   ├── backend/   (Express + Prisma)
│   └── frontend/  (React + Vite)
├── tests/         (Jest tests)
├── spec.md
├── README.md
├── code_review.md
└── ai_history/
```

---

*Duración de esta etapa: ~45 minutos*
