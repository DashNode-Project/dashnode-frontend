/** Literal messages of the authentication stories (must match the backlog verbatim). */
export const AUTH_MESSAGES = {
  // HU_DN_01_02 - register Manager
  nameRequired: 'El nombre completo es obligatorio.',
  nameTooLong: 'El nombre completo no puede superar los 100 caracteres.',
  emailInvalid: 'El correo electrónico ingresado no tiene un formato válido.',
  emailAlreadyRegistered: 'Ya existe una cuenta registrada con este correo electrónico.',
  passwordWeak: 'La contraseña no cumple los requisitos mínimos de seguridad.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  requiredFields: 'Todos los campos obligatorios deben ser diligenciados.',
  roleNotAllowed: 'El registro público solo está disponible para el rol Gerente.',
  registerSuccess: 'Su cuenta de Gerente ha sido registrada correctamente. Puede iniciar sesión.',
  // HU_DN_01_03 - login
  invalidCredentials: 'Credenciales no válidas. Verifique su correo y contraseña.',
  attemptsExceeded: 'Ha superado el número de intentos permitidos. Intente nuevamente más tarde.',
  accountDisabled: 'Su cuenta está desactivada. Contacte al Administrador.',
} as const;
