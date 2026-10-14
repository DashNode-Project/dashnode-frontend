import { FolderOpen, Home, Users, Video, Clock, BookOpen, CalendarDays } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import { homePathFor } from '@/features/auth/roles';

interface CommandItem {
  id: string;
  label: string;
  keywords: string;
  path: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const close = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const items = useMemo((): CommandItem[] => {
    if (!user) return [];
    const home = homePathFor(user.role);
    const base: CommandItem[] = [
      { id: 'home', label: 'Inicio', keywords: 'dashboard inicio', path: home },
      { id: 'projects', label: 'Proyectos', keywords: 'proyectos', path: PATHS.projects },
      { id: 'meetings', label: 'Reuniones', keywords: 'reuniones', path: PATHS.meetings },
      {
        id: 'availability',
        label: 'Disponibilidad',
        keywords: 'disponibilidad horario',
        path: PATHS.availability,
      },
      { id: 'calendar', label: 'Calendario', keywords: 'calendario', path: PATHS.calendar },
      {
        id: 'manual',
        label: 'Manual de usuario',
        keywords: 'manual atajos',
        path: PATHS.userManual,
      },
      { id: 'profile', label: 'Mi perfil', keywords: 'perfil cuenta', path: PATHS.profile },
    ];
    if (user.role === 'admin' || user.role === 'manager') {
      base.push({ id: 'users', label: 'Usuarios', keywords: 'usuarios equipo', path: PATHS.users });
    }
    return base;
  }, [user]);

  const filtered = items.filter(
    (item) =>
      !query.trim() ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.keywords.includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const go = (path: string) => {
    navigate(path);
    close();
  };

  if (!open) return null;

  const iconFor = (id: string) => {
    const map: Record<string, typeof Home> = {
      home: Home,
      projects: FolderOpen,
      users: Users,
      meetings: Video,
      availability: Clock,
      calendar: CalendarDays,
      manual: BookOpen,
      profile: Users,
    };
    const Icon = map[id] ?? FolderOpen;
    return <Icon size={16} className="text-[#9CA3AF]" aria-hidden="true" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        className="absolute inset-0 cursor-default"
        onClick={close}
      />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#12131C] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda rápida"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar pantallas y acciones…"
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none"
        />
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#F9FAFB] hover:bg-white/5 active:bg-white/10"
                onClick={() => go(item.path)}
              >
                {iconFor(item.id)}
                {item.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[#6B7280]">Sin resultados</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
