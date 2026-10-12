/** Single source of truth for application routes. */
export const PATHS = {
  landing: '/',
  login: '/iniciar-sesion',
  register: '/registro',
  homeAdmin: '/inicio/administrador',
  homeManager: '/inicio/gerente',
  homeDeveloper: '/inicio/desarrollador',
} as const;
