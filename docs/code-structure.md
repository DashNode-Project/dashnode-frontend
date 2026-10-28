# Estructura del código (frontend) — EP-01 Autenticación y sesiones

Los documentos de diseño del mockup (`architecture_document.md`, `requirements_document.md`,
`database_schema.md`, `ux_ui_identity_report.md`, `generation_report.md`) se conservan como
referencia visual e histórica. Este archivo describe la estructura profesional actual.

## Frontend

### Páginas / rutas

- `/` (`LandingPage`, HU_DN_01_01) — presentación pública, sin sesión ni datos protegidos
- `/iniciar-sesion` (`LoginPage`, HU_DN_01_03) — inicio de sesión; `GuestOnly`
- `/registro` (`RegisterPage`, HU_DN_01_02) — registro de Gerente; `GuestOnly`
- `/inicio/administrador` (`HomePage`, HU_DN_01_03) — inicio del rol Administrador; `RequireAuth` + `RequireRole`
- `/inicio/gerente` (`HomePage`, HU_DN_01_03) — inicio del rol Gerente
- `/inicio/desarrollador` (`HomePage`, HU_DN_01_03) — inicio del rol Desarrollador
- `*` (`NotFoundPage`) — 404

### Componentes

- `AuthLayout` — marco de formularios públicos
- `AppShell`, `SideNav`, `HeaderTools`, `UserMenu` — cromo autenticado (HU_DN_01_04)
- `TextField`, `PasswordField`, `Button`, `ButtonLink`, `Alert`, `Logo`
- `LoadFailureBoundary`, `LoadFailureScreen` — mensaje literal de fallo de carga
- `GuestOnly`, `RequireAuth`, `RequireRole` — guardas de ruta

### Estado y cliente HTTP

- `AuthContext` — hidrata la sesión solo desde `GET /auth/session` (nunca desde almacenamiento local)
- `FlashContext` — mensajes de éxito (registro, logout)
- `lib/api/client.ts` — `credentials: 'include'`, timeout, contrato `{error:{code,message,fields}}`
- `features/auth/api.ts` — `register`, `login`, `logout`, `getSession`
- `lib/underDevelopment.ts` — emite eventos de «Funcionalidad en desarrollo» hacia toast
- `lib/toast/ToastProvider.tsx` — notificaciones temporales (10 s)
- `features/projects/` — listado, detalle, validación cliente, mensajes HU (`messages.ts`)

### Catálogo de mensajes

- `lib/messages.ts` — fallo de carga, error técnico, sesión expirada, logout
- `features/auth/messages.ts` — literales de registro e inicio de sesión

## Estructuras críticas

- `src/lib/api/client.ts` — único cliente HTTP; cookie HttpOnly, sin tokens en JS
- `src/features/auth/AuthContext.tsx` — fuente de verdad de sesión en memoria
- `src/config/env.ts` — solo URLs públicas; nunca secretos en variables `VITE_*`
- ESLint prohíbe `localStorage` / `sessionStorage`

## Contenerización

- `Dockerfile` — build Node 22, runtime nginx-unprivileged, healthcheck `/healthz`
- `nginx/default.conf.template` — SPA + proxy `/api/` al backend (mismo origen)
- `docker-compose.yml` — red externa `dashnode-net`, alias `dashnode-api`

## EP-04 / EP-05 — Disponibilidad y Reuniones (HU_DN_02_32 … HU_DN_02_34, HU_DN_03_35 … HU_DN_03_41)

- Rutas principales:
  - `/disponibilidad` (`AvailabilityPage`) accesible en `SideNav`.
  - `/reuniones` (`MeetingsPage`) accesible en `SideNav` con icono de video.
- Componentes en `src/features/availability/components/`:
  - `WeeklyGrid.tsx`: Cuadrícula 7 días x 24 horas, alternancia interactiva de celdas, navegación de semanas que inician en lunes, detección de cambios y badge de herencia.
  - `TeamAvailabilityGrid.tsx`: Rejilla semanal de equipo visible para Administrador y Gerente con indicadores textuales ("D" / "ND") y visuales.
  - `ScheduleMeetingSection.tsx`: Formulario de criterios de búsqueda (intervalo 24h, días, participantes, duración en horas completas), resultados agrupados en formato 24h y modal de confirmación/programación de reunión (HU_DN_03_37, HU_DN_03_38).
- Componentes en `src/features/meetings/`:
  - `MeetingsPage.tsx`: Vista completa de reuniones (HU_DN_03_39 … HU_DN_03_41) con:
    - Pestañas «Próximas» y «Pasadas» con filtrado cronológico y badges de estado.
    - Conmutador interactivo entre vista «Lista» y vista «Calendario» mensual con navegación.
    - Modal de detalle de reunión con respuestas de convocados (pendiente, aceptada, rechazada).
    - Acciones de participante: «Aceptar» y «Rechazar» con actualización reactiva.
    - Modal de confirmación de cancelación de reunión por el organizador.
    - Modal de registro y edición de resumen de acuerdos (≤ 2000 caracteres) y enlace de acta validado.
    - Acciones externas: «Enviar a Google Calendar» y «Copiar enlace».
- Capa de soporte y API en `src/features/availability/`:
  - `api.ts`: Cliente HTTP para `/api/v1/availability/*` (`getMyAvailability`, `saveMyAvailability`, `getTeamAvailability`, `searchMeetingSlots`, `createMeeting`, `listMeetings`, `getMeetingDetail`, `cancelMeeting`, `respondMeeting`, `updateMeetingSummary`, `getManagedProjects`).
  - `types.ts`: Tipos TypeScript para disponibilidad, slots, reuniones (`MeetingDTO`, `ParticipantDTO`, `ProjectManagedDTO`, `CreateMeetingPayload`, etc.).
  - `messages.ts`: Mensajes literales verbatim de los criterios de aceptación y catálogo `MEETING_TYPES`.
  - `utils.ts`: Cálculo de semanas, horas, validación de criterios, `isValidUrl` y `buildGoogleCalendarUrl`.
- Pruebas:
  - `validation.test.ts`: Pruebas de utilidades, validación de criterios y URLs.
  - `AvailabilityPage.test.tsx`: Pruebas de integración para disponibilidad y agendamiento (HU_DN_02_32 … 34, HU_DN_03_35 … 38).
  - `MeetingsPage.test.tsx`: Pruebas de integración y criterios de aceptación para reuniones (HU_DN_03_39 … 41).
  - `api.test.ts`: Pruebas unitarias de todos los endpoints del cliente API.

## EP-06 — Backlog TAR (HU_DN_04_47 … HU_DN_04_55)

- Ruta: `/proyectos/:projectId/backlog` → `ProjectBacklogTab.tsx` (pestaña implementada).
- `src/features/backlog/`: `api.ts`, `messages.ts` (literales), `validation.ts`, `types.ts`, `ProjectBacklogTab.tsx`.
- UI alineada a demo Figma: árbol de épicas, modales Crear/Editar épica, Agregar HU, detalle de HU con Fibonacci, sub-lista de tareas, confirmación de borrado.
- Pruebas: `validation.test.ts`; placeholder backlog sustituido por ruta dedicada en `App.tsx`.

## EP-06 — HU_DN_04_56 … HU_DN_04_61

- Filtros, horas trabajadas y estado en `ProjectBacklogTab`.
- `MyTasksPage` en `/mis-tareas`.
- `InvitationPage` en `/invitacion` (sin contraseña visible para el gerente).

## EP-07 — Sprints SPR (HU_DN_05_63 … HU_DN_05_67)

- Ruta: `/proyectos/:projectId/sprints` → `ProjectSprintsTab.tsx`.
- `src/features/sprints/`: `api.ts`, `types.ts`, `messages.ts`, `validation.ts`, `validation.test.ts`.
- Modal «Crear sprint», confirmación de inicio, panel del sprint activo con barra de progreso y métricas.
- `ProjectBacklogTab`: acción «Asignar a sprint» con selector de sprints en PLANNING/ACTIVE.

## EP-07 — Sprints SPR (HU_DN_05_68 … HU_DN_05_71)

- `SprintBurndownChart.tsx`: gráfico SVG (línea ideal vs. real, leyenda, tooltip por día).
- `ProjectSprintsTab`: sección métricas (burndown del sprint activo), botón «Finalizar sprint», modal de cierre con destino de HUs pendientes, sección «Historial de sprints» (tarjetas colapsables).
- API: `getSprintBurndown`, `closeSprint`, `getSprintHistory` en `src/features/sprints/api.ts`.

## EP-08 — Tablero Kanban (HU_DN_05_72 … HU_DN_05_76)

- Ruta: `/proyectos/:projectId/kanban` → `ProjectKanbanTab.tsx` (pestaña Kanban implementada).
- `src/features/kanban/`:
  - `api.ts`: `getKanbanBoard`, `updateColumnWipLimit`, `moveKanbanTaskStatus`, `updateTaskBlockage`
  - `types.ts`: `KanbanBoardData`, `KanbanColumn`, `KanbanCard`, `KanbanFilters`
  - `messages.ts`: literales de Kanban (advertencia WIP, rollback, filtros vacíos, sin sprint activo)
  - `ProjectKanbanTab.tsx`: Tablero Kanban interactivo con 6 columnas estándar, drag & drop HTML5 y menú de movimiento, badges de bloqueo y dependencias, filtro de tareas y gestión de límites WIP (soft-limit)
  - `KanbanBoard.test.tsx`: suite de pruebas para HU_DN_05_72 .. 76

## EP-09 — Documentación y base de conocimiento (HU_DN_06_77 … HU_DN_06_81)

- Ruta: `/proyectos/:projectId/conocimiento` → `ProjectKnowledgeTab.tsx` (pestaña Conocimiento implementada en `projectWorkspaceTabs.ts`).
- `src/features/documentation/`:
  - `types.ts`: `DocumentationEntry`, `DocumentationCategory`, `DocumentationApprovalStatus`, payloads
  - `messages.ts`: literales de negocio y notificaciones alineados con el backend
  - `api.ts`: clientes para listado, creación, edición, eliminación y consulta directa
  - `components/DocumentationModal.tsx`: modal para registro y edición de entradas con validaciones de título, categoría, contenido/URL, aviso RN-DOC-03 y aviso de cambio de estado a PENDING en edición de entradas aprobadas
  - `components/DeleteDocumentationModal.tsx`: diálogo de confirmación con mensaje literal exacto
  - `components/DocumentationDetailModal.tsx`: vista detallada accesible con enlaces externos seguros y acciones de edición/eliminación
  - `ProjectKnowledgeTab.tsx`: vista de la base de conocimiento con barra de búsqueda, filtros por categoría y estado de aprobación, soporte para entradas ancladas, badges de color y empty states
  - `ProjectKnowledgeTab.test.tsx` y `api.test.ts`: suite completa de pruebas unitarias y de integración


