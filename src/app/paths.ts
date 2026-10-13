/** Single source of truth for application routes. */
export const PATHS = {
  landing: '/',
  about: '/acerca-de',
  login: '/iniciar-sesion',
  register: '/registro',
  forgotPassword: '/restablecer-contrasena',
  setPassword: '/establecer-contrasena',
  homeAdmin: '/inicio/administrador',
  homeManager: '/inicio/gerente',
  homeDeveloper: '/inicio/desarrollador',
  users: '/usuarios',
  profile: '/mi-perfil',
  permissions: '/permisos-y-roles',
  projects: '/proyectos',
} as const;

export function projectDetailPath(projectId: string): string {
  return `${PATHS.projects}/${projectId}`;
}
