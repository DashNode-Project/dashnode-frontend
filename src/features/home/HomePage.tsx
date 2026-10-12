import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ROLE_LABELS } from '@/features/auth/roles';
import { AdminUsersPanel } from './AdminUsersPanel';

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Start screen of the authenticated user (one route per role, same role-aware component). */
export default function HomePage() {
  const { user, expiresAt } = useAuth();
  if (!user) return null;
  const expiry = formatExpiry(expiresAt);

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Bienvenido, {user.name}</h1>
      <p className="mb-8 text-sm text-[#9CA3AF]">
        Rol: <span className="font-medium text-[#F9FAFB]">{ROLE_LABELS[user.role]}</span>
      </p>
      <section
        aria-labelledby="session-title"
        className="rounded-xl border border-white/10 bg-[#12131C] p-5"
      >
        <h2 id="session-title" className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={16} className="text-emerald-400" aria-hidden="true" />
          Sesión activa
        </h2>
        <dl className="grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-[#9CA3AF]">Cuenta:</dt>
            <dd>{user.email}</dd>
          </div>
          {expiry ? (
            <div className="flex gap-2">
              <dt className="text-[#9CA3AF]">Vigente hasta:</dt>
              <dd>{expiry}</dd>
            </div>
          ) : null}
        </dl>
      </section>
      {user.role === 'admin' ? <AdminUsersPanel /> : null}
    </>
  );
}
