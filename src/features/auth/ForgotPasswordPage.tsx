import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { requestPasswordReset } from './api';
import { AuthLayout } from './components/AuthLayout';
import { validateEmail } from './validation';

/** Pantalla «Restablecer contraseña» (HU_DN_01_06). */
export default function ForgotPasswordPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    setSuccess(null);

    const formatError = validateEmail(email);
    if (formatError) {
      setEmailError(formatError);
      emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setSuccess(result.message);
      setEmail('');
    } catch (error) {
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        if (error.code === 'EMAIL_INVALID') {
          setEmailError(error.message);
          emailRef.current?.focus();
          return;
        }
        if (error.code === 'EMAIL_SEND_FAILED') {
          setFormError(error.message);
          return;
        }
      }
      setFormError(MESSAGES.technicalFailure);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingrese el correo asociado a su cuenta. Le enviaremos un enlace si está registrado."
    >
      {success ? (
        <Alert variant="success" className="mb-4" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          ref={emailRef}
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
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

        {formError ? (
          <Alert variant="error" onDismiss={() => setFormError(null)}>
            {formError}
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={email.length === 0} loading={submitting}>
          Enviar enlace
        </Button>

        <Link
          to={PATHS.login}
          className="text-center text-sm text-blue-300 underline underline-offset-4 hover:text-blue-200"
        >
          Volver
        </Link>
      </form>
    </AuthLayout>
  );
}
