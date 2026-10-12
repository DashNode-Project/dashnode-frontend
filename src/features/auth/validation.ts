import { AUTH_MESSAGES } from './messages';

// Mirrors the server rules (the server repeats every validation).
export const NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
const EMAIL_MAX_LENGTH = 254;

// xxx@xxx.xxx : local part, '@' and a domain with at least one dot; no spaces.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

export function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email);
}

/** 8-64 characters with at least one letter and one digit. */
export function isValidPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    /\p{L}/u.test(password) &&
    /\p{N}/u.test(password)
  );
}

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterField = keyof RegisterValues;
export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function validateName(name: string): string | undefined {
  if (name.trim() === '') return AUTH_MESSAGES.nameRequired;
  if (name.trim().length > NAME_MAX_LENGTH) return AUTH_MESSAGES.nameTooLong;
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  return isValidEmail(email.trim()) ? undefined : AUTH_MESSAGES.emailInvalid;
}

export function validatePassword(password: string): string | undefined {
  return isValidPassword(password) ? undefined : AUTH_MESSAGES.passwordWeak;
}

export function validateConfirmation(password: string, confirmation: string): string | undefined {
  return confirmation === password ? undefined : AUTH_MESSAGES.passwordMismatch;
}

export function validateRegister(values: RegisterValues): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = {};
  const name = validateName(values.name);
  const email = validateEmail(values.email);
  const password = validatePassword(values.password);
  const confirmPassword = validateConfirmation(values.password, values.confirmPassword);
  if (name) errors.name = name;
  if (email) errors.email = email;
  if (password) errors.password = password;
  if (confirmPassword) errors.confirmPassword = confirmPassword;
  return errors;
}
