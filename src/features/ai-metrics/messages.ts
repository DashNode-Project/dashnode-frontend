/** EP-13 IAM literals (HU_DN_08_114 … HU_DN_08_118, Anexo F). */
export const AI_METRICS_MESSAGES = {
  loadFailure: 'No fue posible cargar la información. Intente nuevamente.',
  emptyInteractions: 'No hay interacciones de IA registradas.',
  emptyPeriod: 'Sin datos en el periodo',
  scopeGlobal: 'Alcance: global',
  scopeProjects: (count: number) => `Alcance: ${count} proyectos gestionados`,
  scopeProject: (name: string) => `Alcance: proyecto ${name}`,
  computedAt: (label: string) => `Datos calculados a las ${label}`,
  refresh: 'Actualizar',
  sectionSummary: 'Resumen de métricas',
  sectionByUser: 'Por usuario',
  sectionRegistry: 'Registro de interacciones',
  detailHelp:
    'Al abrir el detalle con contenido completo, la consulta queda registrada en auditoría.',
  retentionExpired: 'La interacción ya no está disponible por política de retención.',
  notFound: 'La interacción no existe en su alcance.',
  noProject: 'Sin proyecto',
  viewFull: 'Ver detalle',
  closeDetail: 'Cerrar detalle',
  queryColumn: 'Consulta',
  responseColumn: 'Respuesta',
  forbiddenMetrics: 'No tiene permiso para consultar las métricas de IA.',
  forbiddenRegistry: 'No tiene permiso para consultar el registro de interacciones de IA.',
  forbiddenByUser: 'No tiene permiso para consultar las métricas de IA por usuario.',
  periodInvalid: 'El rango de fechas no es válido.',
  loadMore: 'Cargar más',
  filterUser: 'Usuario',
  filterType: 'Tipo',
  filterStatus: 'Estado',
  filterFrom: 'Desde',
  filterTo: 'Hasta',
  filterMinRating: 'Valoración mínima',
  filterAll: 'Todos',
  exportDisabledNote: 'La exportación del registro no está disponible en esta versión.',
} as const;

export const AI_RATING_MESSAGES = {
  label: 'Valoración de la respuesta',
  rated: 'Valorado',
  scoreLabels: {
    1: '1 — Poco útil',
    2: '2',
    3: '3',
    4: '4',
    5: '5 — Muy útil',
  } as Record<number, string>,
  thanks: 'Gracias por su valoración.',
  outOfRange: 'La valoración debe estar entre 1 y 5.',
  notAllowed: 'Solo el solicitante puede valorar esta respuesta.',
  notAvailable: 'Solo se pueden valorar respuestas exitosas.',
  technicalFailure: 'No fue posible completar la operación. Intente nuevamente.',
} as const;

export const AI_METRICS_ASSISTANT_MESSAGES = {
  viewInPanel: 'Ver en panel',
  metricsForPeriod: 'Métricas del asistente',
} as const;

export const INTERACTION_SOURCE_LABELS: Record<string, string> = {
  ASSISTANT_TEXT: 'Asistente (texto)',
  ASSISTANT_VOICE: 'Asistente (voz)',
  ISSUE_ANALYSIS: 'Análisis de issue',
  METRICS_QUERY: 'Consulta de métricas',
};

export const INTERACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  SUCCESS: 'Exitosa',
  ERROR: 'Con error',
  CANCELLED: 'Cancelada',
};

export const METRICS_PERIOD_LABELS: Record<string, string> = {
  today: 'Hoy',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  month: 'Mes actual',
  custom: 'Rango personalizado',
};
