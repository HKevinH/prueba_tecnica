# 02 — Implementación

**Herramienta**: Claude Code (claude-sonnet-4-6) en VSCode

---

## Archivos creados en este bloque

### Raíz del monorepo

- `package.json` — workspaces apuntando a `src/backend` y `src/frontend`, scripts `dev`, `db:setup`, `test`
- `jest.config.js` — ts-jest, rootDir en `./tests`, alias `@backend` para importar desde el backend
- `tsconfig.test.json` — TypeScript config para los tests, incluye path aliases

### Backend (`src/backend/`)

**Configuración:**
- `package.json` — scripts: `dev` (nodemon), `db:generate`, `db:push`, `db:seed`
- `tsconfig.json`
- `prisma/schema.prisma` — modelos: `Client`, `Policy`, `ManagementAction`
- `.env` y `.env.example` — `DATABASE_URL=file:./prisma/dev.db`, `PORT=3001`

**Lógica de negocio:**
- `src/services/priority.ts` — función `classifyPolicyPriority(expirationDate, today)` que retorna el `PriorityBucket`. Función pura sin efectos secundarios. Este archivo es importado directamente por los tests.

**API:**
- `src/lib/prisma.ts` — singleton de PrismaClient
- `src/middleware/errorHandler.ts` — handlers de 404 y 500
- `src/routes/dashboard.ts` — `GET /api/dashboard` calcula conteos por bucket sobre todas las pólizas
- `src/routes/workload.ts` — `GET /api/workload` retorna pólizas a gestionar ordenadas por prioridad, con datos de cliente y última acción. Filtra por bucket y búsqueda.
- `src/routes/clients.ts` — CRUD de clientes
- `src/routes/policies.ts` — CRUD de pólizas + `POST /policies/:id/actions` (al registrar renovación, actualiza status y expirationDate de la póliza)
- `src/app.ts` — Express app, registra rutas, middleware de error

**Datos:**
- `src/seed.ts` — 15 clientes colombianos con nombres realistas, 16 pólizas distribuidas en todos los buckets de prioridad, acciones de gestión pre-registradas en algunas pólizas

### Frontend (`src/frontend/`)

**Configuración:**
- `package.json`, `tsconfig.json`, `vite.config.ts` (proxy `/api` → `localhost:3001`), `index.html`

**Código:**
- `src/main.tsx` — QueryClient, ThemeProvider MUI, tema con colores Agentemotor-style
- `src/types/index.ts` — tipos compartidos: `Policy`, `Client`, `ManagementAction`, `DashboardStats`, `PriorityBucket`
- `src/api/client.ts` — funciones Axios: `getDashboard`, `getWorkload`, `getClients`, `createClient`, `createPolicy`, `registerAction`
- `src/components/SummaryCards.tsx` — 5 tarjetas clickeables para filtrar por bucket
- `src/components/PriorityChip.tsx` — chip de color según bucket
- `src/components/PolicyTable.tsx` — tabla principal con datos del cliente, póliza, días vencida, última gestión, botones de acción
- `src/components/ActionDialog.tsx` — modal para registrar gestión (llamada, WhatsApp, correo, nota, renovación, perdida). Muestra alerta contextual para critical_window y outside_window.
- `src/components/NewClientDialog.tsx` — modal para crear cliente
- `src/components/NewPolicyDialog.tsx` — modal para crear póliza con selector de cliente
- `src/App.tsx` — pantalla principal: header, summary cards, tabs de filtro, búsqueda, tabla

---

## Decisiones durante la implementación

**¿Por qué el workload excluye pólizas `active` (30+ días)?**  
María no necesita ver hoy lo que vence en 2 meses. La tabla es una lista de trabajo, no un inventario. Las pólizas activas están en el resumen como número pero no en la tabla. Si quiere verlas puede crear un filtro "Activas" — lo dejé fuera del scope.

**¿Por qué el action dialog muestra alertas contextuales según el bucket?**  
Cuando María va a gestionar una póliza en `critical_window`, le muestro exactamente cuántos días le quedan en la ventana. No lo tenía en el plan original — lo agregué al escribir el componente porque me di cuenta de que era información crítica que María necesita en el momento de tomar acción.

**¿Por qué el botón "Renovar" en la tabla abre el mismo dialog que "Gestionar"?**  
No creé un dialog separado para renovar. El dialog de gestión tiene un selector de tipo, y cuando el tipo es "renovacion" aparece el campo de nueva fecha. Menos componentes, mismo resultado.

**Algo que la IA sugirió y no usé:**  
En un borrador intermedio el asistente incluyó un `useMemo` para ordenar las pólizas en el cliente. No lo usé porque el ordenamiento ya viene del servidor (el backend ordena por `BUCKET_PRIORITY`). Hacer el sort en el cliente sería trabajo duplicado.

---

*Duración de esta etapa: ~2.5 horas*
