/** Shared keyboard shortcut reference (manual + header help). */
export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl + K', action: 'Abrir búsqueda rápida (paleta de comandos)' },
  { keys: 'Ctrl + /', action: 'Enfocar búsqueda rápida cuando la paleta está abierta' },
  { keys: 'Esc', action: 'Cerrar paleta, menús desplegables o diálogos modales' },
  { keys: 'Tab', action: 'Avanzar entre controles interactivos visibles' },
  { keys: 'Shift + Tab', action: 'Retroceder entre controles interactivos' },
  { keys: 'Enter', action: 'Activar botón o enlace enfocado' },
  { keys: 'Inicio', action: 'Ir al panel principal de su rol (desde la barra lateral)' },
  { keys: 'Ctrl + Shift + M', action: 'Abrir Mis tareas' },
] as const;