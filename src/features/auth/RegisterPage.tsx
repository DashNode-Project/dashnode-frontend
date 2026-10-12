import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useFlash } from '@/app/FlashContext';
import { PATHS } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { registerManager } from './api';
import { AuthLayout } from './components/AuthLayout';
import { AUTH_MESSAGES } from './messages';
import {
  validateConfirmation,
  validateEmail,
  validateName,
  validatePassword,
  validateRegister,
} from './validation';
import type { FieldErrors, RegisterField, RegisterValues } from './validation';

const EMPTY: RegisterValues = { name: '', email: '', password: '', confirmPassword: '' };

/** Server error codes that belong to a specific field. */
const FIELD_BY_CODE: Record<string, RegisterField> = {
  NAME_REQUIRED: 'name',
  NAME_TOO_LONG: 'name',
  EMAIL_INVALID: 'email',
  EMAIL_ALREADY_REGISTERED: 'email',
  PASSWORD_WEAK: 'password',
  PASSWORD_MISMATCH: 'confirmPassword',
};

/** Server error codes shown as a form-level message. */
const FORM_LEVEL_CODES = new Set(['REQUIRED_FIELDS', 'ROLE_NOT_ALLOWED']);

/** 'Registro de Gerente' screen (HU_DN_01_02). The role is never chosen by the user. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { setFlash } = useFlash();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<RegisterValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);

  // Moves focus to the first invalid field after a failed submission.
  useEffect(() => {
    if (focusRequest === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest]);

  const anyEmpty = Object.values(values).some((value) => value.length === 0);

  function change(field: RegisterField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function blur(field: RegisterField) {
    if (values[field].length === 0) return;
    const message =
      field === 'name'
        ? validateName(values.name)
        : field === 'email'
          ? validateEmail(values.email)
          : field === 'password'
            ? validatePassword(values.password)
            : validateConfirmation(values.password, values.confirmPassword);
    setErrors((current) => ({ ...current, [field]: message }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const clientErrors = validateRegister(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setFocusRequest((n) => n + 1);
      return;
    }

    setSubmitting(true);
    try {
      await registerManager({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        confirm_password: values.confirmPassword,
      });
      setFlash({ kind: 'success', message: AUTH_MESSAGES.registerSuccess });
      navigate(PATHS.login, { replace: true });
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        const field = FIELD_BY_CODE[error.code];
        if (field) {
          setErrors({ [field]: error.message });
          setFocusRequest((n) => n + 1);
          return;
        }
        if (FORM_LEVEL_CODES.has(error.code)) {
          setFormError(error.message);
          return;
        }
      }
      setFormError(MESSAGES.technicalFailure);
    }
  }

  return (
    <AuthLayout title="Registro de Gerente" subtitle="Cree su cuenta para gestionar proyectos.">
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nombre completo"
          name="name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(e) => change('name', e.target.value)}
          onBlur={() => blur('name')}
          required
        />
        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="usuario@dominio.com"
          value={values.email}
          error={errors.email}
          onChange={(e) => change('email', e.target.value)}
          onBlur={() => blur('email')}
          required
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          hint="De 8 a 64 caracteres, con al menos una letra y un número."
          value={values.password}
          error={errors.password}
          onChange={(e) => change('password', e.target.value)}
          onBlur={() => blur('password')}
          required
        />
        <PasswordField
          label="Confirmar contraseña"
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => change('confirmPassword', e.target.value)}
          onBlur={() => blur('confirmPassword')}
          required
        />

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <div className="mt-1 flex gap-3">
          <ButtonLink to={PATHS.login} variant="outline" className="flex-1">
            Cancelar
          </ButtonLink>
          <Button type="submit" className="flex-1" disabled={anyEmpty} loading={submitting}>
            Registrarme
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
