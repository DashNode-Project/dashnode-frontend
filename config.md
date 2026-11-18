# Configuración operativa — EP-15 / EP-16

| Comportamiento     | Configuración                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| API de comandos    | Misma `VITE_API_BASE_URL` que el resto del cliente (`/api/v1/commands`).                                    |
| Caché del catálogo | Memoria de sesión por `user.id` + `role`; invalidar al cerrar sesión o llamar `invalidateCommandCatalog()`. |
| DevOps polling     | 5 s mientras exista etapa `EN_EJECUCION`; revalidación al recuperar foco de ventana.                        |
| Atajos             | Ctrl+K y Cmd+K en vistas autenticadas (`HeaderTools`).                                                      |
