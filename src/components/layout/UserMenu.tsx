import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/features/auth/AuthContext';
import { ROLE_LABELS } from '@/features/auth/roles';
import { MESSAGES } from '@/lib/messages';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** User menu available in every authenticated view; it holds the 'Cerrar sesión' option. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await logout();
    } catch {
      setBusy(false);
      setError(MESSAGES.technicalFailure);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-white/5"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white"
        >
          {initials(user.name)}
        </span>
        <span className="hidden max-w-40 truncate text-sm sm:block">{user.name}</span>
        <ChevronDown size={14} aria-hidden="true" className="text-[#9CA3AF]" />
        <span className="sr-only">Menú de usuario</span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-white/15 bg-[#12131C] p-3 shadow-2xl"
        >
          <div className="mb-3 border-b border-white/10 pb-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-[#9CA3AF]">{user.email}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Rol: {ROLE_LABELS[user.role]}</p>
          </div>
          {error ? (
            <Alert variant="error" className="mb-3">
              {error}
            </Alert>
          ) : null}
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            <LogOut size={16} aria-hidden="true" />
            {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
