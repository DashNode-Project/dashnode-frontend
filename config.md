# Configuración operativa — EP-16 DevOps Hub

| Comportamiento | Configuración                                                                     |
| -------------- | --------------------------------------------------------------------------------- |
| API            | `GET/PUT /api/v1/projects/{id}/devops`, `GET .../devops/revisions` vía proxy Vite |
| Vista          | `/proyectos/:projectId/devops` — sin polling; lectura por demanda                 |
| Comandos       | `CMD-PRJ-DEVOPS` en paleta global (EP-15)                                         |
