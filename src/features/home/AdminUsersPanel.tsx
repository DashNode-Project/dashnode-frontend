import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import {
  adminRequestPasswordReset,
  listAdminUsers,
  type AdminUserSummary,
} from '@/features/auth/api';
import { AUTH_MESSAGES } from '@/features/auth/messages';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';

/** HU_DN_01_10 — admin triggers password reset e-mail for a user. */
export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUserSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAdminUsers();
        if (!cancelled) setUsers(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === 'ACCESS_DENIED') {
          setBanner({ kind: 'error', message: MESSAGES.accessDenied });
        } else {
          setBanner({ kind: 'error', message: MESSAGES.loadFailure });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendReset() {
    if (!confirmUser || submitting) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await adminRequestPasswordReset(confirmUser.id);
      setBanner({ kind: 'success', message: result.message });
      setConfirmUser(null);
    } catch (error) {
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        if (error.code === 'EMAIL_SEND_FAILED') {
          setBanner({ kind: 'error', message: AUTH_MESSAGES.emailSendFailed });
        } else if (error.code === 'ADMIN_RESET_DISABLED_TARGET') {
          setBanner({ kind: 'error', message: AUTH_MESSAGES.adminResetDisabledTarget });
        } else if (error.code === 'ACCESS_DENIED') {
          setBanner({ kind: 'error', message: MESSAGES.accessDenied });
        } else {
          setBanner({ kind: 'error', message: error.message });
        }
      } else {
        setBanner({ kind: 'error', message: MESSAGES.technicalFailure });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="users-admin-title" className="mt-10">
      <h2 id="users-admin-title" className="mb-3 text-lg font-semibold">
        Usuarios
      </h2>
      {banner ? (
        <Alert
          variant={banner.kind === 'success' ? 'success' : 'error'}
          className="mb-4"
          onDismiss={() => setBanner(null)}
        >
          {banner.message}
        </Alert>
      ) : null}
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Cargando usuarios…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#12131C] text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Correo</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.is_active ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-4 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmUser(u)}
                    >
                      Restablecer contraseña
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#12131C] p-6">
            <h3 id="reset-dialog-title" className="mb-2 text-lg font-semibold">
              Restablecer contraseña
            </h3>
            <p className="mb-6 text-sm text-[#9CA3AF]">
              Se enviará un enlace de un solo uso al correo de{' '}
              <strong className="text-[#F9FAFB]">{confirmUser.email}</strong>. Usted no verá ni
              establecerá la nueva contraseña.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmUser(null)}>
                Cancelar
              </Button>
              <Button type="button" loading={submitting} onClick={() => void sendReset()}>
                Enviar restablecimiento
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
