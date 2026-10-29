# Guía de despliegue — Frontend DashNode (Vercel + API en Render)

Despliega la SPA en [Vercel](https://vercel.com). La API vive en **Render** (ver `dashnode-backend/docs/deployment-guide.md`) y la base de datos en **Supabase**.

**No** commitee secretos. Las únicas variables del frontend son públicas (`VITE_*`) y no deben contener claves de base de datos ni tokens de servicio.

---

## 1. Arquitectura y cookies de sesión

La API autentica con cookie `HttpOnly` (`SameSite=Lax`). Para que el login funcione en producción:

| Enfoque | Recomendación |
|---------|----------------|
| **Proxy `/api` en Vercel → Render** | **Recomendado.** El navegador solo habla con `https://su-app.vercel.app`; la cookie queda en el mismo sitio. |
| Llamar directo a `https://api.onrender.com` desde el build | Requiere CORS + orígenes alineados; con `Lax` la cookie **no** se comporta como en mismo origen. Use solo si configura un proxy o evoluciona SameSite. |

Esta guía sigue el **proxy recomendado**.

---

## 2. Prerrequisitos

1. API desplegada en Render con URL HTTPS (sin secretos en la URL).
2. `CORS_ORIGINS` en Render incluye `https://su-dominio.vercel.app` (y preview si aplica).
3. `FRONTEND_BASE_URL` en Render apunta a la misma URL de Vercel.
4. Base de datos migrada y usuarios semilla (backend).

---

## 3. Vercel — crear proyecto

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New → Project**.
2. Importe el repositorio `dashnode-frontend`.
3. **Root Directory:** raíz del frontend (o `dashnode-frontend` si es monorepo).
4. **Framework Preset:** Vite (detectado automáticamente).

### 3.1 Build

| Campo | Valor |
|--------|--------|
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 22.x (ver `package.json` → `engines`) |

### 3.2 Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Production | Descripción |
|----------|------------|-------------|
| `VITE_API_BASE_URL` | `/api/v1` | Ruta **relativa** cuando usa proxy (recomendado). |
| `VITE_APP_PUBLIC_URL` | `https://su-app.vercel.app` | URL pública del sitio (sin barra final). |

No defina `DEV_API_PROXY_TARGET` en Vercel; solo aplica al servidor de desarrollo local.

---

## 4. Proxy de API (mismo origen)

Cree `vercel.json` en la raíz del frontend (puede copiar desde `vercel.json.example` del repo).

Sustituya `YOUR_RENDER_SERVICE_HOST` por el host de su Web Service en Render **sin** credenciales, por ejemplo `dashnode-api-xxxx.onrender.com`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR_RENDER_SERVICE_HOST.onrender.com/api/:path*"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

- Las peticiones del cliente a `/api/v1/...` las atiende Vercel y las reenvía a Render.
- El fallback SPA sirve `index.html` para rutas de React Router (`/iniciar-sesion`, `/usuarios`, etc.).

Vuelva a desplegar tras añadir o cambiar `vercel.json`.

---

## 5. Desarrollo local (referencia)

```bash
cp .env.example .env
npm ci
npm run dev
```

- App: http://127.0.0.1:5173  
- `DEV_API_PROXY_TARGET=http://127.0.0.1:8000` en `.env` (git-ignored).  
- API local debe estar en marcha con el mismo `.env` / Supabase que use para pruebas.

---

## 6. Docker local (opcional)

```bash
docker compose up --build
```

UI en el puerto configurado en `.env` (`FRONTEND_HOST_PORT`, por defecto 8080). Ajuste `API_UPSTREAM` si el backend no está en la red Docker por defecto.

---

## 7. Comprobación post-despliegue

1. Abra `https://su-app.vercel.app/iniciar-sesion`.
2. Inicie sesión con un usuario creado por el seed del backend.
3. Navegue a **Usuarios** (admin), **Mi perfil**, **Permisos y roles**.
4. Cierre sesión y confirme que vuelve al login.

**Errores frecuentes**

| Síntoma | Acción |
|---------|--------|
| Login OK en local, falla en Vercel | Revise `vercel.json` (proxy) y `CORS_ORIGINS` en Render. |
| 404 en rutas al refrescar | Falta rewrite SPA a `/index.html` en `vercel.json`. |
| API 502 / timeout | Render free tier puede dormir el servicio; espere el cold start. |
| CORS / 403 en POST | Origen de Vercel no listado en `CORS_ORIGINS` del backend. |

---

## 8. Calidad antes de merge

En local:

```bash
npm run check
```

En el backend, el pipeline equivalente está en `.github/workflows/ci.yml`.
