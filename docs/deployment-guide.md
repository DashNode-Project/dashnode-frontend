# Guía de despliegue — Frontend DashNode

## Requisitos

- Node.js 20+
- Backend API accesible desde el navegador (misma origin vía proxy o CORS configurado)

## Variables

| Variable | Descripción |
| -------- | ----------- |
| `VITE_API_BASE_URL` | Base de la API (por defecto `/api/v1` detrás del proxy inverso) |

Copie `.env.example` a `.env` si aplica.

## Desarrollo local

```bash
npm ci
npm run dev
```

El servidor Vite (5173) debe proxyar `/api` al backend o exponer la API en el mismo host.

## Build de producción

```bash
npm run check
npm run build
```

Sirva el contenido de `dist/` con nginx, Caddy o el contenedor definido en `docker-compose.yml`.

## Docker

```bash
docker compose up --build
```

Asegure que `VITE_API_BASE_URL` en build apunte al servicio API que verá el navegador.

## Comprobación post-despliegue

1. Iniciar sesión con un usuario semilla del backend.
2. Abrir **Usuarios** (admin), **Mi perfil** y **Permisos y roles** desde el menú de usuario.
