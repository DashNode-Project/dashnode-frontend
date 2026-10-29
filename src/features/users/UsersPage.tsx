import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  adminRequestPasswordReset,
  createUserByAdmin,
  deactivateUserByAdmin,
  fetchPendingAssignments,
  inviteDeveloper,
  listAdminUsers,
  reactivateUserByAdmin,
  updateUserByAdmin,
  type AdminUserSummary,
} from '@/features/auth/api';
import { validateEmail, validateName } from '@/features/auth/validation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { USER_MESSAGES } from './messages';
import { AdminUsersPanel } from './AdminUsersPanel';
import { ManagerDevelopersPanel } from './ManagerDevelopersPanel';

type StaffRole = 'manager' | 'developer';

interface UserFormState {
  name: string;
  email: string;
  role: StaffRole;
}

const EMPTY_FORM: UserFormState = { name: '', email: '', role: 'developer' };

/** EP-02: user administration (admin list/create/edit; manager invite). */
export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(isAdmin);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserSummary | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UserFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUserSummary | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserSummary | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<AdminUserSummary | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [teamRefresh, setTeamRefresh] = useState(0);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      setUsers(await listAdminUsers());
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ACCESS_DENIED') {
        setBanner({ kind: 'error', message: MESSAGES.accessDenied });
      } else {
        setBanner({ kind: 'error', message: MESSAGES.loadFailure });
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
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
  }, [isAdmin]);

  function validateForm(values: UserFormState): Partial<Record<keyof UserFormState, string>> {
    const errors: Partial<Record<keyof UserFormState, string>> = {};
    const nameErr = validateName(values.name);
    if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(values.email);
    if (emailErr) errors.email = emailErr;
    if (!values.role) errors.role = USER_MESSAGES.requiredFields;
    return errors;
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await createUserByAdmin(form);
      setBanner({ kind: 'success', message: result.message });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (error) {
      mapSubmitError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const errors = validateForm({ ...form, role: 'developer' });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await inviteDeveloper({ name: form.name, email: form.email });
      setBanner({ kind: 'success', message: result.message });
      setInviteOpen(false);
      setForm(EMPTY_FORM);
      setTeamRefresh((n) => n + 1);
    } catch (error) {
      mapSubmitError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(event: FormEvent) {
    event.preventDefault();
    if (!editUser || submitting) return;
    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await updateUserByAdmin(editUser.id, form);
      setBanner({ kind: 'success', message: result.message });
      setEditUser(null);
      await loadUsers();
    } catch (error) {
      mapSubmitError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function mapSubmitError(error: unknown) {
    if (error instanceof ApiError && !isTechnicalFailure(error)) {
      if (error.code === 'EMAIL_ALREADY_REGISTERED') {
        setFieldErrors({ email: USER_MESSAGES.emailDuplicate });
      } else if (error.code === 'REQUIRED_FIELDS') {
        setBanner({ kind: 'error', message: USER_MESSAGES.requiredFields });
      } else if (error.code === 'MANAGER_ROLE_CHANGE_BLOCKED') {
        setBanner({ kind: 'error', message: USER_MESSAGES.managerRoleBlocked });
      } else if (error.code === 'ACCESS_DENIED') {
        setBanner({ kind: 'error', message: MESSAGES.accessDenied });
      } else if (error.fields) {
        setFieldErrors(error.fields as Partial<Record<keyof UserFormState, string>>);
      } else {
        setBanner({ kind: 'error', message: error.message });
      }
    } else {
      setBanner({ kind: 'error', message: MESSAGES.technicalFailure });
    }
  }

  async function openDeactivate(u: AdminUserSummary) {
    setDeactivateTarget(u);
    setPendingCount(null);
    setPendingError(null);
    setPendingLoading(true);
    try {
      const result = await fetchPendingAssignments(u.id);
      setPendingCount(result.pending_count);
    } catch (error) {
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        setPendingError(USER_MESSAGES.pendingLoadFailure);
      } else {
        setPendingError(USER_MESSAGES.pendingLoadFailure);
      }
    } finally {
      setPendingLoading(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget || submitting) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await deactivateUserByAdmin(deactivateTarget.id);
      setBanner({ kind: 'success', message: result.message });
      setDeactivateTarget(null);
      await loadUsers();
    } catch (error) {
      mapLifecycleError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReactivate() {
    if (!reactivateTarget || submitting) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await reactivateUserByAdmin(reactivateTarget.id);
      setBanner({ kind: 'success', message: result.message });
      setReactivateTarget(null);
      await loadUsers();
    } catch (error) {
      mapLifecycleError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function mapLifecycleError(error: unknown) {
    if (error instanceof ApiError && !isTechnicalFailure(error)) {
      if (error.code === 'SELF_DEACTIVATE_BLOCKED') {
        setBanner({ kind: 'error', message: USER_MESSAGES.selfDeactivateBlocked });
      } else if (error.code === 'MANAGER_DEACTIVATE_BLOCKED') {
        setBanner({ kind: 'error', message: USER_MESSAGES.managerDeactivateBlocked });
      } else if (error.code === 'REACTIVATE_NOT_INACTIVE') {
        setBanner({ kind: 'error', message: error.message });
      } else {
        setBanner({ kind: 'error', message: error.message });
      }
      setDeactivateTarget(null);
      setReactivateTarget(null);
    } else {
      setBanner({ kind: 'error', message: MESSAGES.technicalFailure });
    }
  }

  async function confirmReset() {
    if (!resetTarget || submitting) return;
    setSubmitting(true);
    try {
      const result = await adminRequestPasswordReset(resetTarget.id);
      setBanner({ kind: 'success', message: result.message });
      setResetTarget(null);
    } catch (error) {
      mapSubmitError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(u: AdminUserSummary) {
    setEditUser(u);
    setFieldErrors({});
    setForm({
      name: u.name,
      email: u.email,
      role: u.role === 'manager' ? 'manager' : 'developer',
    });
  }

  if (!isAdmin && !isManager) {
    return (
      <p className="text-sm text-[#9CA3AF]" role="status">
        {MESSAGES.accessDenied}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        {isAdmin ? (
          <Button
            type="button"
            onClick={() => {
              setCreateOpen(true);
              setForm(EMPTY_FORM);
              setFieldErrors({});
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Nuevo usuario
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              setInviteOpen(true);
              setForm(EMPTY_FORM);
              setFieldErrors({});
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Invitar Desarrollador
          </Button>
        )}
      </div>

      {banner ? (
        <Alert
          variant={banner.kind === 'success' ? 'success' : 'error'}
          className="mb-4"
          onDismiss={() => setBanner(null)}
        >
          {banner.message}
        </Alert>
      ) : null}

      {isAdmin ? (
        <AdminUsersPanel
          users={users}
          loading={loading}
          onEdit={openEdit}
          onDeactivate={(u) => void openDeactivate(u)}
          onReactivate={setReactivateTarget}
          onResetPassword={setResetTarget}
          onDelete={(u) => void openDeactivate(u)}
        />
      ) : null}

      {isManager ? <ManagerDevelopersPanel refreshKey={teamRefresh} /> : null}

      {createOpen ? (
        <FormDialog
          title="Crear usuario"
          submitLabel="Crear usuario"
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          submitting={submitting}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          showRoleSelect
        />
      ) : null}

      {inviteOpen ? (
        <FormDialog
          title="Invitar Desarrollador"
          submitLabel="Enviar invitación"
          form={{ ...form, role: 'developer' }}
          setForm={setForm}
          fieldErrors={fieldErrors}
          submitting={submitting}
          onClose={() => setInviteOpen(false)}
          onSubmit={handleInvite}
          roleFixed="Desarrollador"
        />
      ) : null}

      {editUser ? (
        <FormDialog
          title="Editar usuario"
          submitLabel="Guardar cambios"
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          submitting={submitting}
          onClose={() => setEditUser(null)}
          onSubmit={handleEdit}
          showRoleSelect={editUser.role !== 'admin'}
          roleFixed={editUser.role === 'admin' ? 'Administrador' : undefined}
        />
      ) : null}

      {resetTarget ? (
        <ConfirmDialog
          title="Restablecer contraseña"
          message={
            <>
              Se enviará un enlace de un solo uso al correo de{' '}
              <strong className="text-[#F9FAFB]">{resetTarget.email}</strong>.
            </>
          }
          confirmLabel="Enviar restablecimiento"
          submitting={submitting}
          onCancel={() => setResetTarget(null)}
          onConfirm={() => void confirmReset()}
        />
      ) : null}

      {deactivateTarget ? (
        <ConfirmDialog
          title="Desactivar usuario"
          message={
            <>
              <span>{USER_MESSAGES.deactivateConfirm}</span>
              {pendingLoading ? (
                <span className="mt-3 block text-xs text-[#9CA3AF]">Cargando asignaciones…</span>
              ) : null}
              {pendingError ? (
                <span className="mt-3 block text-xs text-red-300">{pendingError}</span>
              ) : null}
              {!pendingLoading &&
              pendingError === null &&
              pendingCount !== null &&
              pendingCount > 0 ? (
                <span className="mt-3 block rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {USER_MESSAGES.pendingTasksNotice(pendingCount)}
                </span>
              ) : null}
            </>
          }
          confirmLabel="Confirmar"
          submitting={submitting || pendingLoading}
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => void confirmDeactivate()}
          extraActions={
            pendingCount !== null && pendingCount > 0 ? (
              <Button type="button" variant="outline" size="sm" disabled>
                Ir a reasignar tareas
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {reactivateTarget ? (
        <ConfirmDialog
          title="Reactivar usuario"
          message={USER_MESSAGES.reactivateConfirm}
          confirmLabel="Confirmar"
          submitting={submitting}
          onCancel={() => setReactivateTarget(null)}
          onConfirm={() => void confirmReactivate()}
        />
      ) : null}
    </div>
  );
}

function FormDialog({
  title,
  submitLabel,
  form,
  setForm,
  fieldErrors,
  submitting,
  onClose,
  onSubmit,
  showRoleSelect,
  roleFixed,
}: {
  title: string;
  submitLabel: string;
  form: UserFormState;
  setForm: (f: UserFormState) => void;
  fieldErrors: Partial<Record<keyof UserFormState, string>>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  showRoleSelect?: boolean;
  roleFixed?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#12131C] p-6"
      >
        <h2 id="user-form-title" className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        <div className="space-y-4">
          <TextField
            label="Nombre completo"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={fieldErrors.name}
            maxLength={100}
            required
          />
          <TextField
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={fieldErrors.email}
            required
          />
          {roleFixed ? (
            <div>
              <span className="mb-1 block text-sm text-[#9CA3AF]">Rol</span>
              <p className="rounded-lg border border-white/10 bg-[#0A0B0E] px-3 py-2 text-sm">
                {roleFixed}
              </p>
            </div>
          ) : null}
          {showRoleSelect ? (
            <div>
              <label htmlFor="user-role" className="mb-1 block text-sm text-[#9CA3AF]">
                Rol
              </label>
              <select
                id="user-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                className="h-10 w-full rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-sm outline-none focus:border-blue-500/50"
                required
              >
                <option value="manager">Gerente</option>
                <option value="developer">Desarrollador</option>
              </select>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  submitting,
  onCancel,
  onConfirm,
  extraActions,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  extraActions?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#12131C] p-6">
        <h2 id="confirm-title" className="mb-2 text-lg font-semibold">
          {title}
        </h2>
        <p className="mb-6 text-sm text-[#9CA3AF]">{message}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {extraActions}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" loading={submitting} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
