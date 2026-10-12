import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useSetFlash } from '@/app/FlashContext';
import { PATHS } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { confirmPasswordReset } from './api';
import { AuthLayout } from './components/AuthLayout';
import { validateConfirmation, validatePassword } from './validation';

/** Pantalla «Establecer contraseña» (HU_DN_01_07). */
export default function SetPasswordPage() {
  const navigate = useNavigate();
  const setFlash = useSetFlash();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInvalidBanner, setShowInvalidBanner] = useState(true);

  const linkInvalid = token.trim() === '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || linkInvalid) return;
    setFormError(null);

    const pErr = validatePassword(password);
    const cErr = validateConfirmation(password, confirmPassword);
    if (pErr || cErr) {
      setPasswordError(pErr);
      setConfirmError(cErr);
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await confirmPasswordReset({
        token,
        password,
        confirm_password: confirmPassword,
      });
      setFlash({ kind: 'success', message: result.message }, PATHS.login);
      navigate(PATHS.login, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        if (error.code === 'INVALID_OR_EXPIRED_LINK') {
          setFormError(error.message);
          return;
        }
        if (error.fields.password) {
          setPasswordError(error.fields.password);
        }
        if (error.fields.confirm_password) {
          setConfirmError(error.fields.confirm_password);
        }
        if (error.message && !error.fields.password && !error.fields.confirm_password) {
          setFormError(error.message);
        }
        return;
      }
      setFormError(MESSAGES.technicalFailure);
    } finally {
      setSubmitting(false);
    }
  }

  if (linkInvalid) {
    return (
      <AuthLayout
        title="Establecer contraseña"
        subtitle="Use el enlace que recibió por correo electrónico."
      >
        {showInvalidBanner ? (
          <Alert variant="error" className="mb-4" onDismiss={() => setShowInvalidBanner(false)}>
            El enlace no es válido o ha expirado. Solicite uno nuevo.
          </Alert>
        ) : null}
        <Link
          to={PATHS.forgotPassword}
          className="text-sm text-blue-300 underline underline-offset-4 hover:text-blue-200"
        >
          Solicitar nuevo enlace
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Establecer contraseña"
      subtitle="Defina una contraseña segura para su cuenta."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField
          ref={passwordRef}
          label="Nueva contraseña"
          name="password"
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(undefined);
            setFormError(null);
          }}
          required
        />
        <PasswordField
          label="Confirmar contraseña"
          name="confirm_password"
          autoComplete="new-password"
          value={confirmPassword}
          error={confirmError}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setConfirmError(undefined);
            setFormError(null);
          }}
          required
        />

        {formError ? (
          <Alert variant="error" onDismiss={() => setFormError(null)}>
            {formError}
          </Alert>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={password.length === 0 || confirmPassword.length === 0}
          loading={submitting}
        >
          Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
