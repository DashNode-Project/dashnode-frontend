export const AVAILABILITY_MESSAGES = {
  // HU_DN_02_32
  availabilitySaved: 'Disponibilidad guardada correctamente.',
  noChangesToSave: 'No hay cambios por guardar.',
  technicalFailure: 'No fue posible completar la operación. Intente nuevamente.',

  // HU_DN_02_33 & HU_DN_02_34
  technicalLoadFailure: 'No fue posible cargar la información. Intente nuevamente.',
  accessDenied:
    'Acceso denegado. Solo administradores y gerentes pueden ver la disponibilidad del equipo.',

  // HU_DN_03_35
  invalidTimeInterval: 'El intervalo horario no es válido.',
  selectAtLeastOneDay: 'Seleccione al menos un día.',
  selectAtLeastOneParticipant: 'Seleccione al menos un participante.',
  durationMustBeWholeHours: 'La duración debe ser en horas completas.',
  durationDoesNotFit: 'La duración no cabe en el intervalo seleccionado.',

  // HU_DN_03_36
  noAvailableSlots: 'No hay horarios disponibles para los criterios seleccionados.',
  meetingCreated: 'Reunión agendada correctamente.',
} as const;

export const DAY_NAMES: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const DAY_KEYS_LIST = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
