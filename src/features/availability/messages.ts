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

  // HU_DN_03_37 & HU_DN_03_38
  meetingTitleRequired: 'El título de la reunión es obligatorio.',
  meetingTypeRequired: 'Seleccione el tipo de reunión.',
  invalidMeetingLink: 'El enlace de la reunión no tiene un formato de URL válido.',
  projectRequired: 'Debe seleccionar un proyecto.',
  participantsMustBeMembers:
    'Todos los participantes deben ser miembros del proyecto seleccionado.',
  participantMeetingConflict: 'Uno o más participantes ya tienen una reunión en ese horario.',
  meetingScheduled: 'Reunión programada correctamente.',

  // HU_DN_03_39 & HU_DN_03_40
  noMeetingsToShow: 'No hay reuniones para mostrar.',

  // HU_DN_03_41
  meetingDetailForbidden: 'Acceso denegado. No participa en esta reunión.',
  meetingCancelled: 'Reunión cancelada correctamente.',
  meetingResponseRegistered: 'Respuesta registrada correctamente.',
  meetingSummaryRegistered: 'Resumen y acta registrados correctamente.',
  summaryTooLong: 'El resumen no puede superar 2000 caracteres.',
  invalidMinutesUrl: 'El enlace del acta no tiene un formato de URL válido.',
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

export const MEETING_TYPES = ['Daily', 'Planning', 'Review', 'Retro', 'General'] as const;
