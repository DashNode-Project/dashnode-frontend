import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { PATHS } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { apiRequest } from '@/lib/api/client';
import { MESSAGES } from '@/lib/messages';
import { AuthLayout } from './components/AuthLayout';
import { validateConfirmation, validatePassword } from './validation';

type Step = 'consent' | 'credentials' | 'done';

export default function InvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [step, setStep] = useState<Step>('consent');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function decide(decision: 'accept' | 'reject') {
    if (submitting || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiRequest<{ message: string }>('/auth/invitations/decision', {
        method: 'POST',
        body: { token, decision },
      });
      if (decision === 'reject') {
        setStep('done');
        setError(null);
        setCode(result.message);
        return;
      }
      setStep('credentials');
    } catch (err) {
      setError(
        err instanceof ApiError && !isTechnicalFailure(err)
          ? err.message
          : MESSAGES.technicalFailure,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function activate(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmation(password, confirmPassword);
    if (passwordError || confirmError || !/^\d{6}$/.test(code.trim())) {
      setError(
        passwordError || confirmError || 'Ingrese el código de 6 dígitos enviado a su correo.',
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiRequest<{ message: string }>('/auth/invitations/activate', {
        method: 'POST',
        body: { token, code: code.trim(), password, confirm_password: confirmPassword },
      });
      setStep('done');
      setCode(result.message);
      window.setTimeout(() => navigate(PATHS.login), 1200);
    } catch (err) {
      setError(
        err instanceof ApiError && !isTechnicalFailure(err)
          ? err.message
          : MESSAGES.technicalFailure,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Invitación de desarrollador" subtitle="Autorice la creación de su cuenta">
      {!token ? (
        <Alert variant="error">El enlace no es válido o ha expirado. Solicite uno nuevo.</Alert>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {step === 'consent' && token ? (
        <div className="space-y-3">
          <p className="text-sm text-[#9CA3AF]">
            ¿Autoriza la creación de su usuario desarrollador en DashNode? Solo tendrá acceso a los
            proyectos en los que lo asignen.
          </p>
          <Button className="w-full" disabled={submitting} onClick={() => void decide('accept')}>
            Sí, autorizo la creación
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            disabled={submitting}
            onClick={() => void decide('reject')}
          >
            No, rechazar
          </Button>
        </div>
      ) : null}
      {step === 'credentials' ? (
        <form className="space-y-3" onSubmit={(event) => void activate(event)}>
          <TextField
            label="Código de verificación"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <PasswordField
            label="Contraseña"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordField
            label="Confirmar contraseña"
            name="confirm"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <Button className="w-full" type="submit" disabled={submitting}>
            Activar cuenta
          </Button>
        </form>
      ) : null}
      {step === 'done' ? (
        <p className="text-sm text-[#F9FAFB]" role="status">
          {code}
        </p>
      ) : null}
      <p className="mt-4 text-center text-sm">
        <Link to={PATHS.login} className="text-blue-400 hover:underline">
          Ir a iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
