# DashNode frontend

Cliente web de DashNode (React 19 + Vite + TypeScript). Esta rama implementa
la épica EP-01: autenticación y sesiones.

El directorio `docs/` del mockup de Figma se conserva. La aplicación ya no usa
datos sintéticos ni `localStorage`: habla con el backend real mediante cookie
HttpOnly de mismo origen.

## Requisitos

- Node.js 22+
- Docker (opcional, para el contenedor nginx)
- Backend DashNode en ejecución (API en el puerto 8000 o en la red `dashnode-net`)

## Configuración

```bash
copy .env.example .env
```

`.env` no se versiona. Las variables `VITE_*` se incrustan en el bundle: nunca
ponga secretos ahí. `VITE_APP_PUBLIC_URL` y el `FRONTEND_BASE_URL` del backend
deben coincidir cuando exista recuperación de contraseña (HU futura).

| Variable               | Uso                                                           |
| ---------------------- | ------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | Base de la API vista por el navegador (por defecto `/api/v1`) |
| `VITE_APP_PUBLIC_URL`  | URL pública del frontend (preparada para correos)             |
| `DEV_API_PROXY_TARGET` | Destino del proxy de Vite (`http://127.0.0.1:8000`)           |
| `FRONTEND_HOST_PORT`   | Puerto publicado del contenedor (8080)                        |
| `API_UPSTREAM`         | Host:puerto del API visto por nginx (`dashnode-api:8000`)     |
| `DASHNODE_NETWORK`     | Red Docker compartida con el backend                          |

## Arranque local (sin contenedor)

```bash
npm ci
npm run dev
```

Vite sirve en `http://localhost:5173` y proxifica `/api` al backend.

## Arranque con contenedores

```bash
# 1. Backend (crea la red dashnode-net y el alias dashnode-api)
cd ../dashnode-backend
python scripts/generate_env.py
docker compose up -d --build

# 2. Frontend
cd ../dashnode-frontend
copy .env.example .env
docker compose up -d --build
```

La UI queda en `http://localhost:8080`. nginx hace fallback de SPA y proxifica
`/api/` al backend (mismo origen, cookie de primera parte).

## Pruebas

| Comando                 | Qué hace                                                  |
| ----------------------- | --------------------------------------------------------- |
| `npm test`              | Vitest                                                    |
| `npm run test:coverage` | Cobertura (80 % líneas)                                   |
| `npm run check`         | typecheck + lint + prettier + tests + escaneo de secretos |
| `npm run test:e2e`      | E2E contra la pila real (`scripts/e2e-stack.mjs`)         |

Ejemplo E2E con cuentas de seed del backend:

```bash
node scripts/e2e-stack.mjs --base http://localhost:8080 --env-file ../dashnode-backend/.env
```

## Rutas EP-01

- `/` presentación pública
- `/iniciar-sesion` inicio de sesión
- `/registro` registro de Gerente
- `/inicio/administrador`, `/inicio/gerente`, `/inicio/desarrollador` inicio por rol

Las acciones de módulos posteriores registran en consola
`Funcionalidad en desarrollo, no disponible`.

## Documentación FRAMAI

- `docs/user-stories.md`
- `docs/code-structure.md`
- `docs/implementation-report.md`
- `docs/integration-report.md`
