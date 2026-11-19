# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — EP-15 Paleta de comandos y EP-16 DevOps

### Added

- Paleta global (Ctrl/Cmd+K): catálogo servidor, búsqueda local ARIA, asistente vía evento.
- Pestaña DevOps por proyecto con distintivo **Simulado** y actualización periódica.

## [Unreleased] — EP-14 Notificaciones in-app

### Added

- Módulo `src/features/notifications/`: API, campana con contador (tope `99+`), panel desplegable, página `/notificaciones`, sondeo cada 30 s y apertura con navegación a ruta permitida.

## [Unreleased] — EP-13 Métricas, valoración y registro de IA

### Added

- Pestaña `metricas-ia` (`ProjectAiMetricsTab`): resumen, registro paginado y métricas por usuario (HU_DN_08_114–116).
- Cliente `src/features/ai-metrics/` y valoración `AiRatingControl` (HU_DN_08_117) en asistente y análisis de issues.
- Respuesta del asistente con tarjetas de métricas y enlace «Ver en panel» (HU_DN_08_118 v1).

## [0.2.0] - 2026-10-12

### Added

- EP-02 user administration: deactivate/reactivate with confirmation dialogs (HU_DN_01_17, HU_DN_01_18).
- Pending assignments notice on deactivate (HU_DN_01_19).
- Read-only permissions matrix page (HU_DN_01_20).
- Profile page with avatar upload (HU_DN_01_21).
- Deployment guide in `docs/deployment-guide.md`.

## [0.1.0] - 2026-10-01

### Added

- EP-01 authentication, sessions, password recovery, and role-based home routes.
