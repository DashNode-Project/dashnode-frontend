/** Literal messages for EP-02 user administration (must match backend/backlog). */
export const USER_MESSAGES = {
  nameRequired: 'El nombre completo es obligatorio.',
  emailInvalid: 'El correo electrónico ingresado no tiene un formato válido.',
  emailDuplicate: 'Ya existe una cuenta registrada con este correo electrónico.',
  requiredFields: 'Todos los campos obligatorios deben ser diligenciados.',
  userCreated: 'Usuario creado correctamente. Se ha enviado un enlace de activación a su correo.',
  inviteSent: 'Invitación enviada correctamente al Desarrollador.',
  userUpdated: 'Usuario actualizado correctamente.',
  emptyList: 'No hay usuarios registrados.',
  filterEmpty: 'No se encontraron usuarios con los filtros aplicados.',
  managerRoleBlocked:
    'No puede cambiar el rol de un Gerente responsable de proyectos. Reasigne primero la responsabilidad.',
} as const;
