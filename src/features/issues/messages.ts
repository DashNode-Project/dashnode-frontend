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

  // EP-12 AI visual evidence analysis messages (HU_DN_07_106 .. HU_DN_07_110)
  AI_CONFIRMATION_CHECKBOX:
    'Confirmo que la evidencia no contiene contraseñas, tokens ni datos personales.',
  AI_PROCESSING_LABEL: 'Análisis solicitado. Procesando…',
  AI_REUSED_NOTICE: 'Ya existe un análisis de esta evidencia.',
  AI_UNVERIFIED_LABEL: 'Sugerencia generada por IA no verificada',
  AI_INSUFFICIENT_CONTEXT: 'No hay contexto suficiente para proponer una solución.',
  AI_NO_RESPONSES: 'Este issue no tiene respuestas de IA.',
  AI_DELETE_CONFIRM_TITLE: '¿Está seguro de que desea eliminar esta respuesta de IA?',
  AI_DELETE_CONFIRM_TEXT:
    'Esta acción eliminará lógicamente la respuesta de IA de este issue. No afectará el estado del fix ni de la tarea asociada.',
  AI_ANALYSIS_DELETED: 'Respuesta de IA eliminada correctamente.',
  AI_DELETE_FORBIDDEN: 'No tiene permiso para eliminar esta respuesta.',
  AI_DELETE_PROCESSING_FORBIDDEN:
    'No es posible eliminar un análisis mientras está en procesamiento.',

  // EP-12 Human validation of AI analysis messages (HU_DN_07_111 .. HU_DN_07_113)
  AI_VALIDATE_SUCCESS: 'Respuesta de IA validada correctamente.',
  AI_REJECT_SUCCESS: 'Respuesta de IA rechazada.',
  AI_VALIDATE_FORBIDDEN: 'Solo un Administrador o Gerente puede validar respuestas de IA.',
  AI_REJECT_FORBIDDEN: 'Solo un Administrador o Gerente puede rechazar respuestas de IA.',
  AI_VALIDATE_INVALID_STATE: 'Solo se pueden validar respuestas pendientes.',
  AI_REJECT_INVALID_STATE: 'La respuesta ya fue rechazada.',
  AI_HUMAN_VALIDATION_NOTICE:
    'Esta propuesta de IA no ha sido validada. Requiere validación de un Administrador o Gerente antes de actuar.',
  AI_VALIDATE_BTN: 'Validar',
  AI_REJECT_BTN: 'Rechazar',

  // Error mappings HU_DN_07_110
  EVIDENCE_LOAD_ERROR: 'No fue posible cargar la evidencia.',
  AI_UNSUPPORTED_FORMAT: 'El formato de la evidencia no es admitido para el análisis.',
  AI_PROVIDER_ERROR: 'El servicio de IA no pudo procesar la solicitud.',
  AI_OUTPUT_INVALID: 'El servicio de IA no pudo procesar la solicitud.',
  AI_TIMEOUT: 'El análisis excedió el tiempo de espera.',
  AI_QUOTA_EXHAUSTED: 'Se agotó la cuota gratuita del servicio de IA. Intente más tarde.',
  NO_EVIDENCE: 'El issue no tiene evidencia para analizar.',
  DAILY_LIMIT_REACHED: 'Alcanzó el límite diario de solicitudes de IA.',
} as const;

export const AI_ERROR_CODE_MESSAGES: Record<string, string> = {
  EVIDENCE_LOAD_ERROR: ISSUE_MESSAGES.EVIDENCE_LOAD_ERROR,
  UNSUPPORTED_FORMAT: ISSUE_MESSAGES.AI_UNSUPPORTED_FORMAT,
  AI_PROVIDER_ERROR: ISSUE_MESSAGES.AI_PROVIDER_ERROR,
  AI_OUTPUT_INVALID: ISSUE_MESSAGES.AI_OUTPUT_INVALID,
  AI_TIMEOUT: ISSUE_MESSAGES.AI_TIMEOUT,
  AI_QUOTA_EXHAUSTED: ISSUE_MESSAGES.AI_QUOTA_EXHAUSTED,
  NO_EVIDENCE: ISSUE_MESSAGES.NO_EVIDENCE,
  DAILY_LIMIT_REACHED: ISSUE_MESSAGES.DAILY_LIMIT_REACHED,
};

export const AI_VALIDATION_STATUS_LABELS: Record<string, string> = {
  PENDING_VALIDATION: 'Pendiente de validación',
  VALIDATED: 'Validada',
  REJECTED: 'Rechazada',
};

export const RESTORABLE_TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'Por hacer' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'CODE_REVIEW', label: 'Revisión' },
  { value: 'TESTING', label: 'Pruebas' },
  { value: 'DONE', label: 'Completada' },
] as const;

export type RestorableTaskStatus = (typeof RESTORABLE_TASK_STATUS_OPTIONS)[number]['value'];
