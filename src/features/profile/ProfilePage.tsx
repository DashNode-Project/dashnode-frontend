import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchProfile, updateProfile } from '@/features/auth/api';
import { ROLE_LABELS } from '@/features/auth/roles';
import { validateName } from '@/features/auth/validation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { env } from '@/config/env';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { USER_MESSAGES } from '@/features/users/messages';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function avatarSrc(relativeUrl: string | null | undefined): string | null {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${env.apiBaseUrl}${relativeUrl.replace(/^\/api\/v1/, '')}`;
}

/** HU_DN_01_21 — self-service profile and avatar. */
export default function ProfilePage() {
  const { user, applySessionUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchProfile();
        if (cancelled) return;
        const profile = response.profile;
        setName(profile.name);
        setEmail(profile.email);
        setRoleLabel(ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role);
        setAvatarPreview(avatarSrc(profile.avatar_url));
      } catch (error) {
        if (!cancelled) {
          setBanner({
            kind: 'error',
            message:
              error instanceof ApiError && !isTechnicalFailure(error)
                ? error.message
                : MESSAGES.loadFailure,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onAvatarChange(file: File | null) {
    setAvatarError(undefined);
    setAvatarFile(null);
    if (!file) return;
    if (!AVATAR_TYPES.has(file.type) || file.size > AVATAR_MAX_BYTES) {
      setAvatarError(USER_MESSAGES.avatarInvalid);
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const nameErr = validateName(name);
    if (nameErr) {
      setNameError(nameErr);
      return;
    }
    if (avatarError) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const result = await updateProfile({ name: name.trim(), avatar: avatarFile });
      setBanner({ kind: 'success', message: result.message ?? USER_MESSAGES.profileUpdated });
      const updated = result.profile;
      setAvatarPreview(avatarSrc(updated.avatar_url));
      if (user) {
        applySessionUser({
          ...user,
          name: updated.name,
          avatar_url: updated.avatar_url ?? undefined,
        });
      }
      setAvatarFile(null);
    } catch (error) {
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        if (error.code === 'AVATAR_INVALID') {
          setAvatarError(USER_MESSAGES.avatarInvalid);
        } else if (error.fields?.name) {
          setNameError(String(error.fields.name));
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

  if (loading) {
    return <p className="text-sm text-[#9CA3AF]">Cargando perfil…</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Mi perfil</h1>
      {banner ? (
        <Alert
          variant={banner.kind === 'success' ? 'success' : 'error'}
          className="mb-4"
          onDismiss={() => setBanner(null)}
        >
          {banner.message}
        </Alert>
      ) : null}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-xl border border-white/10 bg-[#12131C] p-6"
      >
        <div className="flex items-center gap-4">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-lg font-semibold text-white"
            >
              {initials(name || user?.name || '?')}
            </span>
          )}
          <div>
            <label htmlFor="avatar" className="mb-1 block text-sm text-[#9CA3AF]">
              Avatar
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
              className="text-xs text-[#9CA3AF]"
            />
            {avatarError ? <p className="mt-1 text-xs text-red-300">{avatarError}</p> : null}
          </div>
        </div>
        <TextField
          label="Nombre completo"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(undefined);
          }}
          error={nameError}
          maxLength={100}
          required
        />
        <div>
          <span className="mb-1 block text-sm text-[#9CA3AF]">Correo electrónico</span>
          <p className="rounded-lg border border-white/10 bg-[#0A0B0E] px-3 py-2 text-sm">
            {email}
          </p>
        </div>
        <div>
          <span className="mb-1 block text-sm text-[#9CA3AF]">Rol</span>
          <p className="rounded-lg border border-white/10 bg-[#0A0B0E] px-3 py-2 text-sm">
            {roleLabel}
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Guardar
          </Button>
        </div>
      </form>
    </div>
  );
}
