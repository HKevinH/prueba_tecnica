# Spec — Cartera de Pólizas

## Cómo entendí el problema

María tiene un problema de gestión de cartera, no de cotización. Su dolor no es calcular primas — es saber **qué clientes necesita llamar hoy** y poder registrar que ya los llamó.

El riesgo real del negocio es la **ventana de 30 días post-vencimiento**. Una póliza vencida hace 5 días no es lo mismo que una vencida hace 35. En el primer caso María puede renovar sin perder al cliente; en el segundo entra a competir en igualdad de condiciones con cualquier intermediario. Este es el insight más importante del enunciado, y organicé toda la lógica alrededor de él.

El sistema reemplaza el Excel, no agrega complejidad innecesaria. El Excel de María hace tres cosas: ver pólizas que vencen, marcar "gestionado", y actualizar la fecha al renovar. Construí eso — bien — en lugar de construir un CRM completo que María nunca usaría.

---

## Qué construí

### Una pantalla principal de gestión de cartera con:

1. **Clasificación por prioridad** basada en la ventana de 30 días:
   - `expires_today` — vence hoy (rojo)
   - `critical_window` — venció hace 1–30 días (naranja) — el caso crítico
   - `expiring_soon` — vence en 1–30 días (amarillo)
   - `outside_window` — venció hace 30+ días (gris)

2. **Tabla de trabajo** ordenada por prioridad, con filtros por bucket y búsqueda por nombre de cliente.

3. **Registro de gestiones**: llamada, WhatsApp, correo, nota, renovación, marcar como perdida. Cada acción queda en historial. Al renovar, la póliza actualiza su fecha de vencimiento y sale del listado de pendientes.

4. **Tarjetas de resumen** al inicio, clickeables para filtrar la tabla.

5. **Creación de clientes y pólizas** desde la misma pantalla.

### Backend REST con:
- `GET /api/dashboard` — conteos por bucket
- `GET /api/workload` — pólizas a gestionar, con cliente, última acción y conteo de gestiones
- CRUD de clientes y pólizas
- Registro de acciones por póliza

---

## Qué dejé fuera y por qué

**Autenticación**: No implementada. La prueba no especifica multi-asesor. Agregar login para un sistema single-user es fricción sin valor en este alcance. En producción sería lo primero que agregaría.

**Multi-asesora**: El sistema asume que hay una sola asesora (María). Todos los datos son de ella. En producción habría una tabla `advisors` y cada póliza estaría vinculada a un asesor.

**Notificaciones / emails / WhatsApp automáticos**: No implementé integración con canales de comunicación. El sistema facilita ver a quién llamar, pero no automatiza el contacto. En producción esto sería valioso (recordatorios automáticos 7, 3, 1 día antes de vencer).

**Paginación**: Con 280 clientes y ~400 pólizas, el rendimiento no es un problema real con SQLite. En producción con más datos sería necesario.

**Historial completo de pólizas**: No hay pantalla de detalle por póliza ni por cliente. En producción sería útil ver el historial completo de renovaciones de un cliente.

**SOAT**: Mencioné el tipo pero no le di lógica especial. En producción tiene requerimientos regulatorios distintos al auto particular.

**Tests de integración del API**: Decidí priorizar tests unitarios del caso crítico (la ventana de 30 días) porque son los que tienen mayor valor demostrativo y se ejecutan sin base de datos. Con más tiempo agregaría tests del endpoint `/workload` con una base de datos de test en memoria.

---

## Supuestos que tuve que hacer

1. **Sistema single-user**: No hay login porque el enunciado describe a María como usuario único.

2. **La ventana de 30 días aplica a todos los tipos de póliza**: El enunciado dice "auto", pero la regla tiene sentido para hogar también. Apliqué la misma lógica a todos los tipos.

3. **"Renovar" crea una nueva entrada de fecha en la misma póliza**: No creo una nueva póliza al renovar — actualizo la fecha de vencimiento y el status. Esto mantiene el historial de acciones asociado. En producción habría que discutir esto con el equipo de negocio (algunas aseguradoras emiten número de póliza nuevo al renovar).

4. **Las pólizas "lost" y "renewed" salen del workload**: María no necesita ver lo que ya está resuelto. Si quiere consultarlo, puede hacerlo desde la vista del cliente (no implementada pero el endpoint `/clients/:id` devuelve todas sus pólizas).

5. **La búsqueda es por nombre de cliente, no por número de póliza**: María conoce a sus clientes por nombre. El número de póliza es referencia secundaria.

---

## Modelo de datos

```
clients
  id           CUID (PK)
  name         TEXT NOT NULL
  phone        TEXT
  email        TEXT
  created_at   DATETIME
  updated_at   DATETIME

policies
  id             CUID (PK)
  client_id      FK → clients.id
  policy_number  TEXT (nullable, ej: "SUC-2024-001")
  type           TEXT ('auto' | 'hogar' | 'vida' | 'soat' | 'otro')
  insurer        TEXT
  expiration_date DATETIME
  premium        FLOAT (nullable, en COP)
  status         TEXT ('active' | 'renewed' | 'lost')
  created_at     DATETIME
  updated_at     DATETIME

management_actions
  id                   CUID (PK)
  policy_id            FK → policies.id
  action_type          TEXT ('llamada' | 'whatsapp' | 'correo' | 'nota' | 'renovacion' | 'perdida')
  notes                TEXT (nullable)
  new_expiration_date  DATETIME (nullable, solo en renovaciones)
  created_at           DATETIME
```

La prioridad (`critical_window`, `expiring_soon`, etc.) NO se almacena. Se calcula en tiempo real contra `expiration_date` y la fecha actual. Esto evita datos desincronizados — una póliza en `expiring_soon` el lunes es automáticamente `expires_today` el viernes sin ninguna tarea de actualización.

---

## Endpoints expuestos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | Conteos por priority bucket |
| GET | `/api/workload?bucket=&search=` | Pólizas a gestionar, ordenadas por prioridad |
| GET | `/api/clients?search=` | Lista de clientes |
| POST | `/api/clients` | Crear cliente |
| GET | `/api/clients/:id` | Detalle de cliente con pólizas |
| PUT | `/api/clients/:id` | Actualizar cliente |
| POST | `/api/policies` | Crear póliza |
| GET | `/api/policies/:id` | Detalle de póliza con acciones |
| PUT | `/api/policies/:id` | Actualizar póliza |
| POST | `/api/policies/:id/actions` | Registrar gestión (contacto o renovación) |
| GET | `/api/policies/:id/actions` | Historial de gestiones |

---

## Flujo principal

1. María abre la app → ve las tarjetas de resumen (cuántas vencen hoy, cuántas en ventana crítica)
2. La tabla muestra automáticamente las pólizas ordenadas por urgencia
3. Hace clic en "Registrar gestión" en la fila de un cliente → selecciona tipo (llamada, WhatsApp, etc.) → escribe nota → guarda
4. Cuando un cliente acepta renovar: gestión tipo "Renovación" → ingresa nueva fecha de vencimiento → la póliza sale del workload y su fecha queda actualizada
5. Si un cliente se fue con otro asesor: gestión tipo "Marcar como perdida" → la póliza sale del workload

---

## Trade-offs considerados

**Calcular prioridad en runtime vs. almacenar en BD**: Elegí runtime. Una columna `priority` en la base de datos se desincronizaría silenciosamente cada día sin un job que la actualice. La prioridad es función derivada de la fecha, no un estado independiente.

**Monorepo vs. repos separados**: Monorepo para simplificar la evaluación. En producción con equipos distintos de frontend y backend, repos separados tendrían sentido.

**React Query vs. Redux**: React Query es suficiente para un sistema CRUD con datos del servidor. Redux sería sobreingeniería para esta escala.

**SQLite vs. PostgreSQL**: SQLite es la elección correcta para esta prueba y para el caso de uso real. Con 500 asesores y ~400 pólizas cada uno, un SQLite por asesor (o SQLite compartido bien indexado) funciona perfectamente. En producción con concurrencia alta o replicación, migrar a PostgreSQL es trivial con Prisma.
