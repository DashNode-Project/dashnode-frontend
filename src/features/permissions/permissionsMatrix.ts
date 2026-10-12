/** Static permissions matrix aligned with implemented backend rules (HU_DN_01_20). */

export interface PermissionRow {
  module: string;
  capability: string;
  admin: boolean;
  manager: boolean;
  developer: boolean;
}

export const PERMISSIONS_MATRIX: readonly PermissionRow[] = [
  {
    module: 'Autenticación',
    capability: 'Iniciar y cerrar sesión',
    admin: true,
    manager: true,
    developer: true,
  },
  {
    module: 'Autenticación',
    capability: 'Registro público (solo Gerente)',
    admin: false,
    manager: true,
    developer: false,
  },
  {
    module: 'Autenticación',
    capability: 'Restablecer contraseña (autogestión)',
    admin: true,
    manager: true,
    developer: true,
  },
  {
    module: 'Usuarios',
    capability: 'Listar, crear, editar, desactivar y reactivar usuarios',
    admin: true,
    manager: false,
    developer: false,
  },
  {
    module: 'Usuarios',
    capability: 'Invitar desarrolladores',
    admin: true,
    manager: true,
    developer: false,
  },
  {
    module: 'Usuarios',
    capability: 'Restablecer contraseña de otro usuario',
    admin: true,
    manager: false,
    developer: false,
  },
  {
    module: 'Perfil',
    capability: 'Editar nombre y avatar propios',
    admin: true,
    manager: true,
    developer: true,
  },
  {
    module: 'Tareas',
    capability: 'Crear tareas en proyectos',
    admin: true,
    manager: true,
    developer: false,
  },
  {
    module: 'Tareas',
    capability: 'Actualizar estado de tarea asignada',
    admin: true,
    manager: false,
    developer: true,
  },
] as const;
