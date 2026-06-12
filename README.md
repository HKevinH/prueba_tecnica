# Cartera de Pólizas — Agentemotor

Aplicación para que asesores de seguros gestionen el vencimiento de pólizas y reemplacen su Excel.

## Cómo correrlo

Requisitos: Node.js 18+, npm 8+

```bash
npm install
npm run db:setup
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Para correr los tests:

```bash
npm test
```

---

## Decisiones de diseño

### La prioridad se calcula en runtime, no se almacena

La clasificación (`critical_window`, `expiring_soon`, etc.) es una función de `expirationDate` y la fecha actual. No la guardo en la base de datos porque se desincronizaría sin un job de actualización. La póliza de Carlos está en `expiring_soon` hoy y en `critical_window` el lunes — el sistema lo refleja solo.

### Monorepo con npm workspaces

Frontend y backend en el mismo repositorio. Simplifica el setup de evaluación (un solo `npm install`) y permite compartir tipos TypeScript en el futuro. En producción con equipos distintos, repos separados tendrían sentido.

### Express + Prisma en lugar de NestJS

NestJS agrega estructura valiosa en equipos grandes, pero para 4 horas de trabajo es overhead. Prisma ya da tipado fuerte y migrations declarativas. Express directo es más legible para evaluación.

### No hay paginación en el workload

Con 280 clientes (el tamaño de María) y SQLite, el endpoint retorna todas las pólizas a gestionar en ~5ms. No paginar es la decisión correcta para este alcance — la complejidad no justifica el beneficio.

---

## Qué dejé fuera

- **Autenticación**: Sistema single-user por alcance de prueba. En producción, lo primero.
- **Notificaciones automáticas**: El sistema informa qué hay que hacer, no automatiza el contacto.
- **Pantalla de detalle por cliente**: El endpoint existe (`GET /api/clients/:id`), pero no construí la UI.
- **Tests de integración del API**: Prioricé tests unitarios del caso crítico. Los tests del endpoint requieren setup de base de datos de test.
- **Docker**: Incluyo Dockerfiles opcionales pero no son requisito de instalación.

---

## Si esto fuera a producción mañana

1. **Autenticación**: JWT o sesiones. Cada asesor ve solo su cartera.
2. **Multi-asesora**: Tabla `advisors`, FK en pólizas, middleware de autorización.
3. **Notificaciones automáticas**: Job diario que identifica pólizas a 7, 3, 1 días de vencer y manda WhatsApp/email al asesor.
4. **Audit log**: Quién hizo qué y cuándo, no solo el asesor sino si otro usuario del sistema tocó la póliza.
5. **PostgreSQL**: SQLite está bien para un usuario con 300 pólizas. Con 500 asesores simultáneos necesitas concurrencia de escritura real.
6. **Paginación y búsqueda server-side**: Cuando una asesora tenga 1000+ pólizas activas.
7. **Logging + observabilidad**: Sentry para errores, métricas de latencia. El endpoint `/workload` es el más crítico.

---

## Tiempo aproximado

- Planificación y diseño del modelo: 45 min
- Backend (schema, rutas, seed): 75 min
- Frontend (pantalla principal, dialogs): 90 min
- Tests: 20 min
- Documentación: 30 min
- **Total: ~4.5 horas**

---

## Qué mejoraría de esta prueba técnica

El enunciado pide "2-3 tests del caso más crítico" pero no especifica si son unitarios o de integración. Para un sistema con lógica de negocio centrada en fechas, tests unitarios de la función de clasificación son más valiosos que tests del endpoint completo — pero la ambigüedad me hizo escribir más tests de los necesarios para asegurarme de cubrir lo que se esperaba.

Una aclaración en el enunciado como "unitarios que validen la regla de negocio" o "de integración sobre el endpoint" haría la decisión más directa y el resultado más comparable entre candidatos.

---

## Video

[Próximamente — link a Loom]
