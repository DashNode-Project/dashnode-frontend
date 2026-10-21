/** EP-06 backlog literals (HU_DN_04_47 .. HU_DN_04_55). */
export const BACKLOG_MESSAGES = {
  epicNameRequired: 'El nombre de la épica es obligatorio.',
  epicCreated: 'Épica creada correctamente.',
  epicUpdated: 'Épica actualizada correctamente.',
  storyTitleRequired: 'El título de la historia es obligatorio.',
  storyRoleRequired: 'El rol del usuario es obligatorio.',
  storyReasonRequired: 'La razón o resultado es obligatoria.',
  storyCreated: 'Historia de usuario creada correctamente.',
  storyUpdated: 'Historia de usuario actualizada correctamente.',
  storyPointsAssigned: 'Puntos de historia asignados correctamente.',
  taskNameRequired: 'El nombre de la tarea es obligatorio.',
  taskAdded: 'Tarea agregada correctamente.',
  taskUpdated: 'Tarea actualizada correctamente.',
  taskDeleted: 'Tarea eliminada correctamente.',
  taskDeleteConfirm: '¿Está seguro de que desea eliminar esta tarea?',
  assigneeAssigned: 'Responsable asignado correctamente.',
  assigneeNotInProject: 'El usuario seleccionado no pertenece al proyecto.',
  estimatedHoursInvalid: 'Las horas estimadas deben ser mayores a 0.',
  estimatedHoursSaved: 'Horas estimadas registradas correctamente.',
  hoursLogged: 'Horas registradas correctamente.',
  hoursPositive: 'Las horas invertidas deben ser mayores a 0.',
  statusUpdated: 'Estado de la tarea actualizado.',
  correctionLocked: 'El estado Corrección solo cambia al reportar o resolver un fix.',
  backlogEmpty: 'El backlog no tiene elementos.',
  filterEmpty: 'No se encontraron elementos con los filtros aplicados.',
  myTasksEmpty: 'No tiene tareas asignadas actualmente.',
  myTasksFilterEmpty: 'No se encontraron tareas con los filtros aplicados.',
} as const;

export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'Por hacer' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'CODE_REVIEW', label: 'Revisión de código' },
  { value: 'TESTING', label: 'Pruebas' },
  { value: 'CORRECTION', label: 'Corrección' },
  { value: 'DONE', label: 'Completada' },
] as const;

export const FILTER_PRIORITY_OPTIONS = [
  { value: '', label: 'Cualquier prioridad' },
  { value: 'CRITICAL', label: 'Crítica' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
] as const;

export const ESTIMATION_MODE_OPTIONS = [
  { value: 'story', label: 'Puntos en la historia (único total)' },
  { value: 'task', label: 'Puntos por tarea (suma en la HU)' },
] as const;

export const MOSCOW_OPTIONS = [
  { value: 'must_have', label: 'Must have' },
  { value: 'should_have', label: 'Should have' },
  { value: 'could_have', label: 'Could have' },
  { value: 'wont_have', label: "Won't have" },
] as const;

export const FIBONACCI_OPTIONS = [
  { value: '', label: 'Sin estimar' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '8', label: '8' },
  { value: '13', label: '13' },
  { value: '21', label: '21' },
] as const;

export const TASK_TYPE_OPTIONS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'bd', label: 'BD' },
  { value: 'qa', label: 'QA' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'devops', label: 'DevOps' },
  { value: 'documentacion', label: 'Documentación' },
  { value: 'ux_ui', label: 'UX/UI' },
] as const;

export const EPIC_COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Ámbar' },
  { value: '#EC4899', label: 'Rosa' },
] as const;
