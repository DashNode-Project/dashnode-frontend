import {
  Briefcase,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  Globe,
  Key,
  Link2,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import {
  changePassword,
  fetchProfile,
  updateProfile,
  type ProfileDetailsData,
  type ProfileData,
} from '@/features/auth/api';
import { validateName } from '@/features/auth/validation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Avatar, Badge, Card, RoleBadge, StatusBadge } from '@/components/ui/demo-ui';
import { env } from '@/config/env';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { USER_MESSAGES } from '@/features/users/messages';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const SKILL_SUGGESTIONS = [
  'React',
  'TypeScript',
  'Python',
  'FastAPI',
  'PostgreSQL',
  'Docker',
  'Scrum',
  'UX Design',
];

type SectionId = 'info' | 'professional' | 'skills' | 'links' | 'availability' | 'password';

function avatarSrc(relativeUrl: string | null | undefined): string | null {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${env.apiBaseUrl}${relativeUrl.replace(/^\/api\/v1/, '')}`;
}

function formatMemberSince(iso: string | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

function linkHref(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  return `https://${v}`;
}

function emptyDetails(): Required<ProfileDetailsData> {
  return {
    last_name: '',
    nickname: '',
    description: '',
    experience: '',
    skills: [],
    github: '',
    linkedin: '',
    availability_text: '',
  };
}

function detailsFromProfile(d: ProfileDetailsData | undefined): Required<ProfileDetailsData> {
  const base = emptyDetails();
  if (!d) return base;
  return {
    last_name: d.last_name ?? '',
    nickname: d.nickname ?? '',
    description: d.description ?? '',
    experience: d.experience ?? '',
    skills: d.skills ?? [],
    github: d.github ?? '',
    linkedin: d.linkedin ?? '',
    availability_text: d.availability_text ?? '',
  };
}

function FieldGrid({ fields }: { fields: { label: string; value: string; mono?: boolean }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="mb-1 text-xs text-[#6B7280]">{f.label}</p>
          <p className={`text-sm text-[#F9FAFB] ${f.mono ? 'font-mono text-[#9CA3AF]' : ''}`}>
            {f.value || '—'}
          </p>
        </div>
      ))}
    </div>
  );
}

/** HU_DN_01_21 — profile aligned with product demo (extended details JSON). */
export default function ProfilePage() {
  const { user, applySessionUser } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'manager' || user?.role === 'developer';

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [details, setDetails] = useState(emptyDetails());
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('info');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const [skillInput, setSkillInput] = useState('');
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await fetchProfile();
        if (cancelled) return;
        const p = response.profile;
        setProfile(p);
        setName(p.name);
        setDetails(detailsFromProfile(p.details));
        setAvatarPreview(avatarSrc(p.avatar_url));
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

  const sections = useMemo(() => {
    if (isAdmin) {
      return [
        { id: 'info' as const, label: 'Información personal', icon: User },
        { id: 'password' as const, label: 'Cambiar contraseña', icon: Key },
      ];
    }
    return [
      { id: 'info' as const, label: 'Información personal', icon: User },
      { id: 'professional' as const, label: 'Info profesional', icon: Briefcase },
      { id: 'skills' as const, label: 'Habilidades', icon: Sparkles },
      { id: 'links' as const, label: 'Enlaces', icon: Link2 },
      { id: 'availability' as const, label: 'Disponibilidad', icon: Clock },
      { id: 'password' as const, label: 'Cambiar contraseña', icon: Key },
    ];
  }, [isAdmin]);

  const displayName = useMemo(() => {
    const ln = details.last_name?.trim();
    return ln ? `${name.trim()} ${ln}` : name.trim();
  }, [name, details.last_name]);

  const nicknameDisplay = details.nickname?.trim() ? `@${details.nickname.replace(/^@/, '')}` : '—';

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

  function addSkill(skill: string) {
    const s = skill.trim();
    if (!s) return;
    setDetails((d) => {
      if (d.skills.includes(s)) return d;
      return { ...d, skills: [...d.skills, s].slice(0, 50) };
    });
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setDetails((d) => ({ ...d, skills: d.skills.filter((x) => x !== skill) }));
  }

  async function handleSaveProfile(event: FormEvent) {
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
      const result = await updateProfile({
        name: name.trim(),
        avatar: avatarFile,
        details: isStaff
          ? {
              last_name: (details.last_name ?? '').trim() || null,
              nickname: (details.nickname ?? '').trim() || null,
              description: (details.description ?? '').trim() || null,
              experience: (details.experience ?? '').trim() || null,
              skills: details.skills,
              github: (details.github ?? '').trim() || null,
              linkedin: (details.linkedin ?? '').trim() || null,
              availability_text: (details.availability_text ?? '').trim() || null,
            }
          : undefined,
      });
      setBanner({ kind: 'success', message: result.message ?? USER_MESSAGES.profileUpdated });
      const updated = result.profile;
      setProfile(updated);
      setName(updated.name);
      setDetails(detailsFromProfile(updated.details));
      setAvatarPreview(avatarSrc(updated.avatar_url));
      setAvatarFile(null);
      setEditing(false);
      if (user) {
        applySessionUser({
          ...user,
          name: updated.name,
          avatar_url: updated.avatar_url ?? undefined,
        });
      }
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

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    if (passwordSubmitting) return;
    setPasswordError(null);
    setPasswordSubmitting(true);
    try {
      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setBanner({ kind: 'success', message: result.message ?? 'Contraseña actualizada.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof ApiError && !isTechnicalFailure(error)) {
        if (error.fields?.current_password) {
          setPasswordError(String(error.fields.current_password));
        } else if (error.fields?.new_password) {
          setPasswordError(String(error.fields.new_password));
        } else if (error.fields?.confirm_password) {
          setPasswordError(String(error.fields.confirm_password));
        } else {
          setPasswordError(error.message);
        }
      } else {
        setPasswordError(MESSAGES.technicalFailure);
      }
    } finally {
      setPasswordSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[#9CA3AF]" role="status">
        Cargando perfil…
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="text-sm text-red-300" role="alert">
        {MESSAGES.loadFailure}
      </p>
    );
  }

  const statusKey = profile.is_active !== false ? 'activo' : 'desactivado';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {banner ? (
        <Alert
          variant={banner.kind === 'success' ? 'success' : 'error'}
          onDismiss={() => setBanner(null)}
        >
          {banner.message}
        </Alert>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/6 bg-gradient-to-br from-[#12131C] to-[#0A0B0E] p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex shrink-0 justify-center md:justify-start">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-blue-500/30"
                />
              ) : (
                <Avatar name={displayName || '?'} size={72} />
              )}
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <h1 className="text-xl font-bold text-[#F9FAFB]">{displayName || profile.name}</h1>
              <p className="mt-0.5 text-sm text-[#9CA3AF]">{nicknameDisplay}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <RoleBadge role={profile.role} />
                <StatusBadge status={statusKey} />
              </div>
              {details.description?.trim() ? (
                <p className="mt-3 text-xs leading-relaxed text-[#9CA3AF]">{details.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[#9CA3AF] md:justify-start">
                {details.github?.trim() ? (
                  <a
                    href={linkHref(details.github) ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    title="Perfil de GitHub"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-[#F9FAFB]"
                  >
                    <GitBranch size={14} aria-hidden="true" />
                    {details.github}
                  </a>
                ) : null}
                {details.linkedin?.trim() ? (
                  <a
                    href={linkHref(details.linkedin) ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    title="Perfil de LinkedIn"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-[#F9FAFB]"
                  >
                    <Globe size={14} aria-hidden="true" />
                    {details.linkedin}
                  </a>
                ) : null}
                <span className="inline-flex items-center gap-1.5" title="Correo de contacto">
                  <Mail size={14} aria-hidden="true" />
                  {profile.email}
                </span>
              </div>
            </div>
            {!editing && activeSection !== 'password' ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                title="Editar datos del perfil"
                onClick={() => setEditing(true)}
                className="mx-auto shrink-0 md:mx-0"
              >
                <Edit2 size={14} aria-hidden="true" />
                Editar perfil
              </Button>
            ) : null}
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-white/6 px-2 py-2"
          aria-label="Secciones del perfil"
        >
          {sections.map((s) => {
            const Icon = s.icon;
            const selected = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={selected}
                title={s.label}
                onClick={() => {
                  setActiveSection(s.id);
                  if (s.id === 'password') setEditing(false);
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-blue-500/15 text-blue-300'
                    : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>
      </Card>

      {activeSection === 'info' ? (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#F9FAFB]">Información personal</h2>
          {editing ? (
            <form onSubmit={(e) => void handleSaveProfile(e)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nombre"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(undefined);
                  }}
                  error={nameError}
                  maxLength={100}
                  required
                />
                {isStaff ? (
                  <TextField
                    label="Apellido"
                    value={details.last_name ?? ''}
                    onChange={(e) => setDetails((d) => ({ ...d, last_name: e.target.value }))}
                    maxLength={100}
                  />
                ) : null}
              </div>
              {isStaff ? (
                <>
                  <TextField
                    label="Nickname"
                    hint="Sin @; se mostrará como @usuario"
                    value={details.nickname ?? ''}
                    onChange={(e) => setDetails((d) => ({ ...d, nickname: e.target.value }))}
                    maxLength={50}
                  />
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-[#F9FAFB]">Descripción</span>
                    <textarea
                      value={details.description ?? ''}
                      onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
                      rows={3}
                      maxLength={2000}
                      title="Descripción pública del perfil"
                      className="w-full resize-none rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                </>
              ) : null}
              <div className="flex items-center gap-4">
                <label htmlFor="profile-avatar" className="text-sm text-[#9CA3AF]">
                  Avatar
                </label>
                <input
                  id="profile-avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  title="Subir imagen de avatar (PNG, JPG o WEBP, máx. 2 MB)"
                  onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                  className="text-xs text-[#9CA3AF]"
                />
              </div>
              {avatarError ? <p className="text-xs text-red-300">{avatarError}</p> : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" loading={submitting} title="Guardar cambios del perfil">
                  Guardar cambios
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  title="Descartar edición"
                  onClick={() => {
                    setEditing(false);
                    if (profile) {
                      setName(profile.name);
                      setDetails(detailsFromProfile(profile.details));
                      setAvatarPreview(avatarSrc(profile.avatar_url));
                      setAvatarFile(null);
                    }
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <>
              <FieldGrid
                fields={[
                  { label: 'Nombre completo', value: displayName },
                  { label: 'Correo electrónico', value: profile.email },
                  ...(isStaff
                    ? [
                        { label: 'Nickname', value: nicknameDisplay },
                        {
                          label: 'Rol',
                          value:
                            profile.role === 'admin'
                              ? 'Administrador'
                              : profile.role === 'manager'
                                ? 'Gerente'
                                : 'Desarrollador',
                        },
                      ]
                    : [
                        {
                          label: 'Rol',
                          value: 'Administrador',
                        },
                      ]),
                  {
                    label: 'Estado',
                    value: profile.is_active !== false ? 'Activo' : 'Desactivado',
                  },
                  { label: 'Miembro desde', value: formatMemberSince(profile.created_at) },
                ]}
              />
              {isStaff && details.description?.trim() ? (
                <div className="mt-4 border-t border-white/6 pt-4">
                  <p className="mb-1 text-xs text-[#6B7280]">Descripción</p>
                  <p className="text-sm text-[#9CA3AF]">{details.description}</p>
                </div>
              ) : null}
            </>
          )}
        </Card>
      ) : null}

      {isStaff && activeSection === 'professional' ? (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#F9FAFB]">Información profesional</h2>
          {editing ? (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[#F9FAFB]">Experiencia</span>
              <textarea
                value={details.experience ?? ''}
                onChange={(e) => setDetails((d) => ({ ...d, experience: e.target.value }))}
                rows={5}
                maxLength={4000}
                title="Resumen de experiencia profesional"
                placeholder="Años de experiencia, roles, industrias…"
                className="w-full resize-none rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
              />
            </label>
          ) : details.experience?.trim() ? (
            <p className="text-sm leading-relaxed text-[#9CA3AF]">{details.experience}</p>
          ) : (
            <p className="text-sm text-[#6B7280]">Sin información de experiencia.</p>
          )}
        </Card>
      ) : null}

      {isStaff && activeSection === 'skills' ? (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#F9FAFB]">Habilidades</h2>
          {editing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {details.skills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    title={`Quitar habilidad ${s}`}
                    onClick={() => removeSkill(s)}
                    className="group inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                  >
                    {s}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <TextField
                  label="Agregar habilidad"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  className="min-w-[200px] flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="self-end"
                  title="Añadir habilidad a la lista"
                  onClick={() => addSkill(skillInput)}
                >
                  Añadir
                </Button>
              </div>
              <p className="text-xs text-[#6B7280]">Sugerencias:</p>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    title={`Agregar ${s}`}
                    onClick={() => addSkill(s)}
                    className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-[#9CA3AF] transition-colors hover:border-blue-500/30 hover:text-blue-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : details.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {details.skills.map((s) => (
                <Badge key={s} tone="blue">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">Sin habilidades registradas.</p>
          )}
        </Card>
      ) : null}

      {isStaff && activeSection === 'links' ? (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#F9FAFB]">Enlaces</h2>
          {editing ? (
            <div className="space-y-4 max-w-lg">
              <TextField
                label="GitHub"
                placeholder="github.com/usuario"
                value={details.github ?? ''}
                onChange={(e) => setDetails((d) => ({ ...d, github: e.target.value }))}
              />
              <TextField
                label="LinkedIn"
                placeholder="linkedin.com/in/usuario"
                value={details.linkedin ?? ''}
                onChange={(e) => setDetails((d) => ({ ...d, linkedin: e.target.value }))}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {details.github?.trim() ? (
                <a
                  href={linkHref(details.github) ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  <GitBranch size={16} aria-hidden="true" />
                  {details.github}
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              ) : null}
              {details.linkedin?.trim() ? (
                <a
                  href={linkHref(details.linkedin) ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  <Globe size={16} aria-hidden="true" />
                  {details.linkedin}
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Mail size={16} aria-hidden="true" />
                {profile.email}
              </div>
              {!details.github?.trim() && !details.linkedin?.trim() ? (
                <p className="text-sm text-[#6B7280]">Sin enlaces registrados.</p>
              ) : null}
            </div>
          )}
        </Card>
      ) : null}

      {isStaff && activeSection === 'availability' ? (
        <Card className="p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#F9FAFB]">
            <Clock size={16} className="text-blue-400" aria-hidden="true" />
            Disponibilidad
          </h2>
          <p className="mb-4 text-xs text-[#9CA3AF]">
            Resumen textual para tu equipo. Para la grilla semanal de reuniones, usa la página de
            disponibilidad.
          </p>
          <Link
            to={PATHS.availability}
            title="Abrir gestión de disponibilidad semanal"
            className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            Gestionar disponibilidad semanal
            <ExternalLink size={12} aria-hidden="true" />
          </Link>
          {editing ? (
            <textarea
              value={details.availability_text ?? ''}
              onChange={(e) => setDetails((d) => ({ ...d, availability_text: e.target.value }))}
              rows={8}
              maxLength={4000}
              title="Horarios disponibles en texto libre"
              placeholder={'Lunes: 09:00-12:00, 14:00-18:00\nMartes: 09:00-18:00'}
              className="w-full resize-none rounded-md border border-white/10 bg-[#1E1F2B] p-3 font-mono text-xs text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
            />
          ) : details.availability_text?.trim() ? (
            <pre className="whitespace-pre-wrap rounded-lg border border-white/6 bg-[#0A0B0E] p-3 font-mono text-xs text-emerald-300/90">
              {details.availability_text}
            </pre>
          ) : (
            <p className="text-sm text-[#6B7280]">Sin disponibilidad registrada en el perfil.</p>
          )}
        </Card>
      ) : null}

      {activeSection === 'password' ? (
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-semibold text-[#F9FAFB]">Cambiar contraseña</h2>
          <p className="mb-5 text-xs text-[#9CA3AF]">
            Actualiza tu contraseña de acceso al sistema.
          </p>
          <form onSubmit={(e) => void handleChangePassword(e)} className="max-w-md space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="current-pwd" className="text-sm font-medium text-[#F9FAFB]">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  id="current-pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  title="Contraseña actual"
                  className="h-9 w-full rounded-md border border-white/10 bg-[#1E1F2B] px-3 pr-10 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#F9FAFB]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <TextField
              id="new-pwd"
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <TextField
              id="confirm-pwd"
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {passwordError ? (
              <p className="text-xs text-red-400" role="alert">
                {passwordError}
              </p>
            ) : null}
            <Button
              type="submit"
              loading={passwordSubmitting}
              title="Confirmar cambio de contraseña"
            >
              <Key size={14} aria-hidden="true" />
              Cambiar contraseña
            </Button>
          </form>
        </Card>
      ) : null}

      {editing && isStaff && activeSection !== 'info' && activeSection !== 'password' ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            title="Cancelar edición"
            onClick={() => {
              setEditing(false);
              if (profile) setDetails(detailsFromProfile(profile.details));
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            loading={submitting}
            title="Guardar perfil"
            onClick={() => void handleSaveProfile({ preventDefault: () => {} } as FormEvent)}
          >
            Guardar cambios
          </Button>
        </div>
      ) : null}
    </div>
  );
}
