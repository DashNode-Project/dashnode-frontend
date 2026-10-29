export const KANBAN_MESSAGES = {
  NO_ACTIVE_SPRINT: 'No hay ningún sprint activo en este proyecto.',
  LOAD_ERROR: 'No fue posible cargar la información. Intente nuevamente.',
  OWN_TASKS_ONLY: 'Solo puede cambiar el estado de sus propias tareas.',
  CORRECTION_RESTRICTED: 'El estado Corrección solo cambia al reportar o resolver un fix.',
  TASK_STATUS_UPDATED: 'Estado de la tarea actualizado.',
  WIP_LIMIT_UPDATED: 'Límite WIP actualizado correctamente.',
  WIP_LIMIT_FAILED: 'No fue posible completar la operación. Intente nuevamente.',
  NO_MATCHING_CARDS: 'No se encontraron tarjetas con los filtros aplicados.',
  BLOCK_STATUS_UPDATED: 'Estado de bloqueo actualizado.',
  wipExceeded: (actual: number, limit: number) => `Límite WIP superado (${actual}/${limit})`,
} as const;
