export const ISSUE_MESSAGES = {
  TITLE_REQUIRED: 'El título es obligatorio.',
  TITLE_TOO_LONG: 'El título no puede superar 100 caracteres.',
  DESCRIPTION_TOO_LONG: 'La descripción no puede superar 5000 caracteres.',
  SEVERITY_REQUIRED: 'Debe seleccionar la severidad.',
  TYPE_REQUIRED: 'Debe seleccionar el tipo.',

  UNSUPPORTED_FORMAT: 'Formato de archivo no admitido.',
  FILE_TOO_LARGE: 'El archivo excede el tamaño máximo permitido.',
  VIDEO_TOO_LONG: 'El video no puede superar los 60 segundos de duración.',
  DUPLICATE_EVIDENCE: 'Ya existe una evidencia idéntica asociada a este issue.',
  EVIDENCE_TITLE_TOO_LONG: 'El título de la evidencia no puede superar 255 caracteres.',

  ISSUE_CREATED: 'Issue creado correctamente.',
  EVIDENCE_ATTACHED: 'Evidencia adjuntada correctamente.',

  ASSIGN_FORBIDDEN: 'Acceso denegado. Solo Administrador o Gerente pueden asignar issues.',
  ASSIGN_FORBIDDEN_TOOLTIP: 'Solo Administrador o Gerente pueden asignar issues.',
  ASSIGN_DEVELOPER_ONLY: 'Solo se pueden asignar desarrolladores miembros del proyecto.',
  OPTIMISTIC_LOCK_CONFLICT:
    'El issue fue modificado por otro usuario. Recargue e intente nuevamente.',
  ISSUE_ASSIGNED: 'Issue asignado correctamente.',

  RESOLUTION_NOTE_REQUIRED: 'Debe registrar la nota de resolución.',
  RESOLUTION_NOTE_TOO_LONG: 'La nota de resolución no puede superar 2000 caracteres.',
  ISSUE_RESOLVED: 'Issue resuelto correctamente.',
  ISSUE_CLOSED: 'Issue cerrado correctamente.',
  CLOSE_FORBIDDEN: 'Acceso denegado. Solo Administrador o Gerente pueden cerrar issues.',

  TASK_FIX_REPORTED: 'Fix reportado. La tarea pasó a estado Corrección.',
  TASK_OTHER_OPEN_ISSUES:
    'La tarea tiene otros issues abiertos. Permanecerá en Corrección hasta resolverlos.',
  TASK_UNLINKED_AND_UPDATED: 'La tarea fue desvinculada y su estado se actualizó.',

  NO_ISSUES_FOUND: 'El proyecto no tiene issues.',
  NO_FILTERED_ISSUES: 'No se encontraron issues con los filtros aplicados.',

  GENERIC_ERROR: 'No fue posible completar la operación. Intente nuevamente.',
  NOT_MEMBER_ERROR: 'El usuario debe ser miembro activo del proyecto.',
} as const;

export const RESTORABLE_TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'Por hacer' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'CODE_REVIEW', label: 'Revisión' },
  { value: 'TESTING', label: 'Pruebas' },
  { value: 'DONE', label: 'Completada' },
] as const;

export type RestorableTaskStatus = (typeof RESTORABLE_TASK_STATUS_OPTIONS)[number]['value'];
