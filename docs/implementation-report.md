# Reporte de implementación — Frontend EP-01 Autenticación y sesiones

Rama: `feature/ep-01-auth-sessions` (base `develop`, que parte de `main`).
Modo de proyecto: `MOCKUP_PRODUCTIONIZATION`.

## Análisis (Orquestador)

- Clasificación del lote: FULL_STACK, complejidad COMPLEX (autenticación, contrato nuevo, productización de mockup, entrega operable).
- HU_DN_01_01: FRONTEND_ONLY / SIMPLE. HU_DN_01_02 y HU_DN_01_03: FULL_STACK / COMPLEX. HU_DN_01_04 y HU_DN_01_05: FULL_STACK / MODERATE.
- Orden: fundación → 01 → 02 → 03 → 04 → 05 → stubs fuera de alcance → contenedor → integración.
- Hard constraints: no tocar `demo/`; no secretos en el repo; mensajes literales; cookie HttpOnly; ramas protegidas `main`/`develop` solo en la preparación inicial.
- Contrato de épica: ver `docs/integration-report.md` y el backend `docs/api-auth.md`.

## Resumen por HU

| HU | Estado | Commit (asunto) |
|---|---|---|
| Fundación | Hecho | `chore(EP-01): professional project foundation, remove Figma mockup and mock data` |
| HU_DN_01_01 | Hecho | `feat(HU_DN_01_01): public presentation page` |
| HU_DN_01_02 | Hecho | `feat(HU_DN_01_02): Manager registration form` |
| HU_DN_01_03 | Hecho | `feat(HU_DN_01_03): login screen with role-based redirection` |
| HU_DN_01_04 | Hecho | `feat(HU_DN_01_04): logout from the user menu` |
| HU_DN_01_05 | Hecho | `feat(HU_DN_01_05): keep the session across page reloads` |
| Fuera de alcance | Hecho | `feat(EP-01): log 'Funcionalidad en desarrollo, no disponible' for out-of-scope controls` |
| Contenedor | Hecho | `chore(EP-01): containerize the SPA with nginx and same-origin API proxy` |
| HU_DN_01_06–10 + landing demo | Hecho | `feat(auth): HU_DN_01_06-10 UI, guards, landing aligned with demo` |
| EP-02 HU_DN_01_11–16 Usuarios | Hecho | `feat(HU_DN_01_11)` + docs HU_12–16; `UsersPage` en `/usuarios` |

## Decisiones técnicas

- El mockup (Figma Make) se tomó como referencia visual; la arquitectura pasó a React Router, cliente HTTP único y sesión hidratada desde el servidor.
- `VITE_API_BASE_URL=/api/v1` (mismo origen) para que la cookie HttpOnly sea de primera parte.
- «¿Olvidó su contraseña?» navega a `/restablecer-contrasena`; establecer contraseña en `/establecer-contrasena?token=…`.
- La navegación de módulos posteriores a EP-01 permanece visible e inerte (mismo manejador).
- `docs/` del mockup se conserva; los 4 documentos FRAMAI se añaden.

## Matriz de trazabilidad (capa frontend)

| Criterio | Implementación | Test | Evidencia | Estado |
|---|---|---|---|---|
| HU_01 presentación + accesos | `LandingPage.tsx`, `modules.ts`, `paths.ts` | `LandingPage.test.tsx` | Página pública en `http://localhost:8080/` | VALIDADO |
| HU_01 sin datos protegidos | Landing no llama `fetch` | `LandingPage.test.tsx` | E2E: landing 200 sin cookie | VALIDADO |
| HU_01 fallo de carga | `LoadFailureBoundary` | `App.loadFailure.test.tsx` | Mensaje literal | PROBADO |
| HU_02 formulario + validación | `RegisterPage.tsx`, `validation.ts` | `RegisterPage.test.tsx`, `validation.test.ts` | Flujo E2E registro 201 | VALIDADO |
| HU_02 éxito y redirect | flash + `PATHS.login` | `RegisterPage.test.tsx`, `LoginPage.test.tsx` | Mensaje literal + redirección | VALIDADO |
| HU_03 login + roles | `LoginPage.tsx`, `roles.ts` | `LoginPage.test.tsx` | Admin/Gerente/Desarrollador | VALIDADO |
| HU_03 errores literales | `AUTH_MESSAGES` + `ApiError.message` | `LoginPage.test.tsx` | E2E 401/403/429 | VALIDADO |
| HU_04 logout | `UserMenu.tsx`, `AuthContext` | `Logout.test.tsx` | Cookie invalidada | VALIDADO |
| HU_05 recarga | `GET /auth/session`, guardas | `SessionRestore.test.tsx` | Misma vista, sin localStorage | VALIDADO |

## Comandos de validación ejecutados

| Control | Resultado |
|---|---|
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin errores |
| `npm run format:check` | Sin hallazgos (tras Prettier en Docker/E2E) |
| `npm run test:coverage` | Ver última ejecución de `npm run check` |
| `node scripts/scan-secrets.mjs` | Limpio |
| `node scripts/e2e-stack.mjs --base http://localhost:8080` | 51 checks passed, 0 failed |

## Inventario MOCKUP_PRODUCTIONIZATION

| Pieza | Clasificación | Acción |
|---|---|---|
| Landing, login, registro, home por rol, menú usuario | ALCANCE | Implementado contra API real |
| Proyectos, tareas, reuniones, docs, issues, usuarios, IA, búsqueda, notificaciones, recuperar contraseña | FUERA_DE_ALCANCE | `notifyUnderDevelopment` |
| Datos sintéticos / credenciales de demo / persistencia localStorage | SINTÉTICO | Eliminado |
| Artefactos Figma Make (plugins, estado simulado) | ARTEFACTO | Eliminado; `docs/` conservado |

## EP-03 — Proyectos (rama `feature/ep-03-projects-pro`)

| HU | UI | Tests |
|---|---|---|
| HU_DN_02_22 | `ProjectsPage`, modal «Crear proyecto», filtro por estado | `ProjectsPage.test.tsx`, `ProjectFormFields.test.tsx` |
| HU_DN_02_23 | Modal «Editar proyecto» en `ProjectDetailPage` | `ProjectDetailPage.test.tsx` |
| HU_DN_02_24 | Selector «Estado» con reversión en error | `ProjectDetailPage.test.tsx` |
| HU_DN_02_25 | «Cambiar gerente responsable» | `ProjectDetailPage.test.tsx` |
| HU_DN_02_26 | Eliminar (admin), confirmación | `ProjectDetailPage.admin.test.tsx` |

Toast global: `ToastProvider` + `UnderDevelopmentBridge` (10 s, inferior derecha). Validación local: `npm run check` — 209 tests, cobertura ≥ umbrales (2026-10-12).

## EP-04 / EP-05 — Disponibilidad y Reuniones (ramas `feature/ep-04-availability-dis`, `feature/ep-05-meetings-age`)

| HU | UI | Tests |
|---|---|---|
| HU_DN_02_32 | `AvailabilityPage`, `WeeklyGrid` con 7 días x 24h, alternancia disponible/no disponible, selector de lunes, mensajes literales | `AvailabilityPage.test.tsx`, `validation.test.ts` |
| HU_DN_02_33 | Prellenado de semana con badge/indicador de herencia cuando no hay registro propio | `AvailabilityPage.test.tsx` |
| HU_DN_02_34 | `TeamAvailabilityGrid` en pestaña «Equipo» (Admin y Gerente; Desarrollador bloqueado), 24 columnas con indicadores textuales («D» / «ND») y visuales | `AvailabilityPage.test.tsx` |
| HU_DN_03_35 | Formulario en `ScheduleMeetingSection`: validación de intervalo, días, participantes y duración en horas completas, botón bloqueado hasta validez | `validation.test.ts`, `AvailabilityPage.test.tsx` |
| HU_DN_03_36 | Lista de horarios disponibles calculados en formato 24h excluyendo reuniones agendadas, modal para agendar reunión y notificación toast | `AvailabilityPage.test.tsx`, `api.test.ts` |

Validación local:
- `npm run check`: 238 tests pasando (34 archivos de test).
- Cobertura de líneas: ~90 % (umbral mínimo 80 %).
- TypeScript: `npm run typecheck` limpio (0 errores).
- Linter: `npm run lint` limpio (0 advertencias, 0 errores).
- Formato: `npm run format:check` limpio (Prettier verificado).
- Seguridad: `node scripts/scan-secrets.mjs` limpio (0 secretos).
- Compilación: `npm run build` genera bundle de producción optimizado sin errores.

---

## EP-05 — Agendamiento y Reuniones (HU_DN_03_37 … HU_DN_03_41)

### Análisis del Orquestador (Modo Lote / Épica)
- **Fecha:** 2026-10-13
- **Clasificación del lote:** FULL_STACK
- **Complejidad:** MODERATE / COMPLEX (Score: 82/100)
- **Políticas cargadas:** `policies.xml`, `adaptive-policies.xml`, `project-modes.xml`, `engineering-standards.xml` (seguridad, mensajes_literales, contrato_de_error, quality_gates, estrategia_de_pruebas, accesibilidad).
- **Project Mode:** EXTEND_EXISTING en ambos repositorios.
- **Ramas:** `feature/ep-05-meetings-age` (tanto backend como frontend).
- **Prohibición de push:** No publicar ramas hasta verificación integral completa.

#### Grafo de dependencias y flujo:
1. `HU_DN_03_37`: Selección de horario disponible resultante de búsqueda (HU_DN_03_36) y apertura modal de confirmación en solo lectura (fecha, hora, duración, participantes).
2. `HU_DN_03_38`: Programación de reunión desde ventana de confirmación (título ≤ 100 caracteres obligatorio, tipo obligatorio entre Daily/Planning/Review/Retro/General, proyecto asociado obligatorio con validación de membresía de todos los participantes y prellenado de enlace sugerido, enlace opcional con formato URL válido, rechazo de solapamiento concurrente para cualquier participante, persistencia, notificación a participantes y redirección a reuniones).
3. `HU_DN_03_39`: Listado de reuniones (Próximas y Pasadas) con alcance por rol (Admin: todas; Gerente: propias y de sus proyectos; Desarrollador: solo participante), orden cronológico (próximas asc; pasadas sep), datos completos y estados.
4. `HU_DN_03_40`: Vista calendario interactiva con conmutador Lista/Calendario con el mismo conjunto de reuniones, título y tipo distinguibles.
5. `HU_DN_03_41`: Detalle de reunión desde lista o calendario, participantes y sus respuestas (pendiente, aceptada, rechazada), resumen y acta, acciones según rol ('Enviar a Google Calendar', 'Aceptar / Rechazar', 'Cancelar reunión', 'Registrar resumen y acta'), control de acceso por rol (Desarrollador denegado si no participa).

#### Contrato Compartido:
- **API Endpoints:**
  - `POST /api/v1/availability/meetings`: Creación de reunión con campos `title`, `type`, `project_id`, `date`, `start_time`, `end_time`, `duration`, `link`, `participant_ids`.
  - `GET /api/v1/availability/meetings`: Listado de reuniones filtradas por alcance de rol y parámetros opcionales.
  - `GET /api/v1/availability/meetings/{id}`: Detalle completo de reunión con creador, participantes y respuestas.
  - `POST /api/v1/availability/meetings/{id}/cancel`: Cancelación de reunión por creador.
  - `POST /api/v1/availability/meetings/{id}/respond`: Registro de respuesta de participante ('aceptada' | 'rechazada').
  - `POST /api/v1/availability/meetings/{id}/summary`: Registro de resumen (≤ 2000 chars) y URL de acta.
- **Mensajes Literales Verbatim:**
  - Título vacío: `'El título de la reunión es obligatorio.'`
  - Tipo vacío: `'Seleccione el tipo de reunión.'`
  - Enlace inválido: `'El enlace de la reunión no tiene un formato de URL válido.'`
  - Proyecto vacío: `'Debe seleccionar un proyecto.'`
  - Miembros no pertenecientes al proyecto: `'Todos los participantes deben ser miembros del proyecto seleccionado.'`
  - Solapamiento concurrente: `'Uno o más participantes ya tienen una reunión en ese horario.'`
  - Éxito al programar: `'Reunión programada correctamente.'`
  - Éxito sin datos: `'No hay reuniones para mostrar.'`
  - Fallo técnico genérico: `'No fue posible completar la operación. Intente nuevamente.'`
  - Fallo de carga: `'No fue posible cargar la información. Intente nuevamente.'`
  - Acceso denegado: `'Acceso denegado. No tiene permisos para realizar esta acción.'`

---

## Implementación de HU_DN_03_42, HU_DN_03_44, HU_DN_03_45 y HU_DN_03_46

### 1. HU_DN_03_42 — Enviar a Google Calendar y Manejo de Portapapeles
- **Componente:** `MeetingsPage.tsx`, `utils.ts` (`buildGoogleCalendarUrl`, `formatMeetingCopyData`), `messages.ts`.
- **Comportamiento:**
  - Generación de enlace de Google Calendar con título, horario UTC, duración, enlace, descripción y correos de participantes (`&add=...`).
  - Detección de bloqueo de ventanas emergentes (`window.open` retornando null o error).
  - Alerta contextual con botón `'Copiar datos de la reunión'` ante fallo de apertura.
  - Mensaje de copia exitosa: `'Datos de la reunión copiados.'`.
  - Mensaje ante fallo de apertura: `'No fue posible abrir Google Calendar. Puede copiar los datos de la reunión.'`.
  - Mensaje ante fallo de portapapeles: `'No fue posible copiar los datos. Cópielos manualmente.'`.

### 2. HU_DN_03_44 — Responder Convocatoria de Reunión
- **Componente:** `MeetingsPage.tsx`, `api.ts` (`respondMeeting`), `messages.ts`.
- **Comportamiento:**
  - Botones `'Aceptar'` y `'Rechazar'` visibles exclusivamente para participantes convocados en reuniones programadas que aún no han ocurrido.
  - Oculto si la reunión está cancelada o ya transcurrió en el tiempo.
  - Mensaje de éxito: `'Su respuesta ha sido registrada.'`.
  - Manejo de error si fue cancelada: `'La reunión fue cancelada; no es posible responder.'`.
  - Manejo de error si ya ocurrió: `'No es posible responder una reunión ya realizada.'`.

### 3. HU_DN_03_45 — Cancelar Reunión Programada y RN-AGE-05
- **Componente:** `MeetingsPage.tsx`, `api.ts` (`cancelMeeting`), `messages.ts`.
- **Comportamiento:**
  - Botón de cancelación condicionado a `isUserCreator(m)` (solo quien creó la reunión puede cancelarla).
  - Modal de confirmación con texto literal verbatim: `'¿Está seguro de que desea cancelar esta reunión? Se notificará a los participantes.'`.
  - Botones del modal: `'Confirmar'` y `'Cancelar'`.
  - Mensaje de éxito tras cancelar: `'Reunión cancelada correctamente.'`.
  - Error 403 `ONLY_CREATOR_CAN_CANCEL`: `'Solo el creador de la reunión puede cancelarla.'`.

### 4. HU_DN_03_46 — Registrar Resumen y Acta de Reunión
- **Componente:** `MeetingsPage.tsx`, `api.ts` (`updateMeetingSummary`), `messages.ts`.
- **Comportamiento:**
  - Botón `'Registrar resumen y acta'` solo visible para reuniones realizadas (`isMeetingRealizada(m)`) y para el creador o Administrador.
  - Validación de resumen obligatorio: `'El resumen es obligatorio.'`.
  - Validación de longitud máxima: textarea limitado a 2000 caracteres con contador `X/2000` y validación `'El resumen no puede superar 2000 caracteres.'`.
  - Validación de formato URL: `'La URL del acta no tiene un formato válido.'`.
  - Si el backend rechaza porque no está realizada: `'Solo se puede registrar resumen y acta en reuniones realizadas.'`.
  - Mensaje de éxito: `'Resumen y acta guardados correctamente.'`.

#### Calidad Frontend:
- `npm run typecheck`: 0 errores.
- `npm run lint`: 0 errores, 0 advertencias.
- `npm run format:check`: 100% de archivos formateados con Prettier.
- `vitest run`: 269 tests pasados (35 suites).

---

## EP-06 — Backlog TAR (HU_DN_04_47 … HU_DN_04_55)

**Estado:** COMPLETED (código) / `vitest run`: NOT_RUN local (npm registry TLS en entorno agente)

### Frontend
- `ProjectBacklogTab` consume API real (`features/backlog/api.ts`).
- Mensajes de éxito/error literales en `features/backlog/messages.ts` + `lib/messages.ts` (fallo técnico).
- Validación cliente espejo de servidor (`validation.ts` + tests).
- `projectWorkspaceTabs.ts`: backlog `implemented: true`.

### Integración
- Contrato alineado con backend (`EpicCreatedResponse`, árbol `BacklogTreeDTO`).
- Toasts en operaciones exitosas con textos HU.

## HU_DN_04_56 … HU_DN_04_61

**Estado:** COMPLETED
**Fecha:** 2026-10-20

Backlog con filtros, registro de horas y cambio de estado. Vista Mis tareas. Invitación pública sin mostrar contraseñas. Atajo Ctrl+Shift+M. Transiciones CSS respetando `prefers-reduced-motion`.

---

## EP-07 — Sprints SPR (HU_DN_05_68 … HU_DN_05_71)

**Estado:** COMPLETED

### HU_DN_05_68
- `SprintBurndownChart.tsx`: SVG con línea ideal (discontinua) y real, leyenda y tooltip por día.
- Carga con `getSprintBurndown` al detectar sprint activo en `ProjectSprintsTab`.

### HU_DN_05_69 / HU_DN_05_70
- Botón «Finalizar sprint» (Admin/Gerente) en sprint activo.
- Modal con resumen de puntos completados/pendientes, radio backlog vs. sprint planificado, `closeSprint`.

### HU_DN_05_71
- Sección «Historial de sprints» con tarjetas colapsables (`getSprintHistory`).

### Estabilidad QA
- `vite.config.ts`: `test.fileParallelism: false` evita condiciones de carrera en mocks HTTP entre archivos Vitest.


