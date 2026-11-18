import { Bell, Keyboard, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import { notifyUnderDevelopment } from '@/lib/underDevelopment';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

export function HeaderTools() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const closePalette = () => setPaletteOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        navigate(PATHS.myTasks);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#F9FAFB] active:bg-white/10"
        >
          <Search size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Buscar</span>
          <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-[#6B7280] md:inline">
            Ctrl+K
          </kbd>
        </button>
        <button
          type="button"
          title="Atajos de teclado"
          aria-label="Atajos de teclado"
          onClick={() => setShortcutsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#F9FAFB] active:bg-white/10"
        >
          <Keyboard size={16} aria-hidden="true" />
        </button>
        {user && user.role !== 'admin' ? (
          <button
            type="button"
            aria-label="Notificaciones"
            onClick={() => notifyUnderDevelopment('notifications')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#F9FAFB] active:bg-white/10"
          >
            <Bell size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}

export { AiAssistantWidget as AiAssistantButton } from '@/features/ai-assistant/AiAssistantWidget';
