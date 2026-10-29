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
  deactivateConfirm:
    '¿Está seguro de que desea desactivar este usuario? Perderá el acceso al sistema de inmediato.',
  reactivateConfirm: '¿Está seguro de que desea reactivar este usuario?',
  userDeactivated: 'Usuario desactivado correctamente.',
  userReactivated: 'Usuario reactivado correctamente.',
  selfDeactivateBlocked: 'No puede desactivar su propia cuenta de Administrador.',
  managerDeactivateBlocked:
    'No puede desactivar a un Gerente responsable de proyectos. Reasigne primero la responsabilidad.',
  pendingTasksNotice: (count: number) =>
    `El usuario tiene ${count} tareas/historias pendientes asignadas. Podrá reasignarlas desde el backlog.`,
  pendingLoadFailure: 'No fue posible cargar la información. Intente nuevamente.',
  avatarInvalid: 'El avatar debe ser una imagen PNG, JPG o WEBP de hasta 2 MB.',
  profileUpdated: 'Perfil actualizado correctamente.',
} as const;
