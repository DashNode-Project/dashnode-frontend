import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  validateConfirmation,
  validateEmail,
  validateName,
  validatePassword,
  validateRegister,
} from './validation';

describe('email validation (xxx@xxx.xxx)', () => {
  it.each(['a@b.co', 'ana.perez+tag@dominio.com.co', 'x@y.z'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['', 'sin-arroba', 'a@b', 'a@@b.co', 'a b@c.co', '@b.co', 'a@.co', 'a@b..co', 'a@b.'])(
    'rejects %j',
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );

  it('rejects addresses longer than 254 characters', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@b.co`)).toBe(false);
  });
});

describe('password validation (8-64, letter and digit)', () => {
  it.each(['Abcdefg1', 'contraseña9', `${'a'.repeat(63)}1`])('accepts %s', (password) => {
    expect(isValidPassword(password)).toBe(true);
  });

  it.each(['', 'abc123', 'abcdefgh', '12345678', `${'a'.repeat(64)}1`])(
    'rejects %j',
    (password) => {
      expect(isValidPassword(password)).toBe(false);
    },
  );
});

describe('field validators use the literal messages', () => {
  it('name', () => {
    expect(validateName('')).toBe('El nombre completo es obligatorio.');
    expect(validateName('   ')).toBe('El nombre completo es obligatorio.');
    expect(validateName('x'.repeat(101))).toBe(
      'El nombre completo no puede superar los 100 caracteres.',
    );
    expect(validateName('x'.repeat(100))).toBeUndefined();
  });

  it('email, password and confirmation', () => {
    expect(validateEmail('mal')).toBe(
      'El correo electrónico ingresado no tiene un formato válido.',
    );
    expect(validateEmail(' ana@dominio.com ')).toBeUndefined();
    expect(validatePassword('corta1')).toBe(
      'La contraseña no cumple los requisitos mínimos de seguridad.',
    );
    expect(validateConfirmation('Abcdefg1', 'Abcdefg2')).toBe('Las contraseñas no coinciden.');
    expect(validateConfirmation('Abcdefg1', 'Abcdefg1')).toBeUndefined();
  });

  it('validateRegister collects every failing field', () => {
    expect(
      validateRegister({ name: '', email: 'x', password: 'abc', confirmPassword: 'd' }),
    ).toEqual({
      name: 'El nombre completo es obligatorio.',
      email: 'El correo electrónico ingresado no tiene un formato válido.',
      password: 'La contraseña no cumple los requisitos mínimos de seguridad.',
      confirmPassword: 'Las contraseñas no coinciden.',
    });
    expect(
      validateRegister({
        name: 'Ana',
        email: 'ana@dominio.com',
        password: 'Abcdefg1',
        confirmPassword: 'Abcdefg1',
      }),
    ).toEqual({});
  });
});
