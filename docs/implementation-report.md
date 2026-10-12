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
