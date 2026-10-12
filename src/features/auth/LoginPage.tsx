import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useIncomingFlash } from '@/app/FlashContext';
import { PATHS } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useAuth } from './AuthContext';
import { AuthLayout } from './components/AuthLayout';
import { homePathFor } from './roles';
import { validateEmail } from './validation';

/** Server error codes of the login shown as a form-level message. */
const FORM_LEVEL_CODES = new Set([
  'INVALID_CREDENTIALS',
  'LOGIN_ATTEMPTS_EXCEEDED',
  'ACCOUNT_DISABLED',
  'REQUIRED_FIELDS',
]);

/** 'Inicio de sesión' screen (HU_DN_01_03). */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { flash, dismiss } = useIncomingFlash();
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    dismiss();

    const formatError = validateEmail(email);
    if (formatError) {
      setEmailError(formatError);
      emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      navigate(homePathFor(user.role), { replace: true });
    } catch (error) {
      setSubmitting(false);
      setPassword('');
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        if (error.code === 'EMAIL_INVALID') {
          setEmailError(error.message);
          emailRef.current?.focus();
          return;
        }
        if (FORM_LEVEL_CODES.has(error.code)) {
          setFormError(error.message);
          passwordRef.current?.focus();
          return;
        }
      }
      setFormError(MESSAGES.technicalFailure);
      passwordRef.current?.focus();
    }
  }

  return (
    <AuthLayout title="Inicio de sesión" subtitle="Ingrese con su correo y contraseña.">
      {flash ? (
        <Alert variant={flash.kind} className="mb-4">
          {flash.message}
        </Alert>
      ) : null}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          ref={emailRef}
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="usuario@dominio.com"
          value={email}
          error={emailError}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(undefined);
            setFormError(null);
          }}
          required
        />
        <PasswordField
          ref={passwordRef}
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFormError(null);
          }}
          required
        />

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <Button
          type="submit"
          className="w-full"
          disabled={email.length === 0 || password.length === 0}
          loading={submitting}
        >
          Iniciar sesión
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            className="text-blue-300 underline underline-offset-4 hover:text-blue-200"
          >
            ¿Olvidó su contraseña?
          </button>
          <Link
            to={PATHS.register}
            className="text-blue-300 underline underline-offset-4 hover:text-blue-200"
          >
            Registrarme como Gerente
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
