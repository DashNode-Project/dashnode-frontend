/** EP-03 backlog literals (HU_DN_02_22 .. HU_DN_02_26). */
export const PROJECT_MESSAGES = {
  nameRequired: 'El nombre del proyecto es obligatorio.',
  meetingLinkInvalid: 'El enlace de reunión no tiene un formato de URL válido.',
  managerRequired: 'Debe asignar un gerente responsable.',
  created: 'Proyecto creado correctamente.',
  updated: 'Proyecto actualizado correctamente.',
  statusUpdated: 'Estado del proyecto actualizado.',
  managerUpdated: 'Gerente responsable actualizado correctamente.',
  deleted: 'Proyecto eliminado correctamente.',
  deleteConfirm: '¿Está seguro de que desea eliminar este proyecto?',
  memberUserRequired: 'Debe seleccionar un usuario.',
  memberAdded: 'Miembro agregado correctamente.',
  memberRemoved: 'Miembro retirado correctamente.',
  memberRemoveConfirm: '¿Está seguro de que desea retirar a este miembro del proyecto?',
  noProjectsAssigned: 'No tiene proyectos asignados.',
} as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planificacion: 'Planificación',
  activo: 'Activo',
  en_pausa: 'En pausa',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const PROJECT_PRIORITY_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};
