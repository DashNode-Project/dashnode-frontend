/** Single source of truth for application routes. */
export const PATHS = {
  landing: '/',
  login: '/iniciar-sesion',
  register: '/registro',
  forgotPassword: '/restablecer-contrasena',
  setPassword: '/establecer-contrasena',
  homeAdmin: '/inicio/administrador',
  homeManager: '/inicio/gerente',
  homeDeveloper: '/inicio/desarrollador',
} as const;
