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
