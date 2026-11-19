import { Keyboard, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import { NotificationBell } from '@/features/notifications/NotificationBell';
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
        const foreignModal =
          !paletteOpen &&
          Boolean(document.querySelector('[aria-modal="true"]:not(#command-palette-panel)'));
        if (foreignModal) return;
        e.preventDefault();
        setPaletteOpen((open) => {
          if (open) {
            window.setTimeout(() => {
              document
                .querySelector<HTMLInputElement>('#command-palette-panel input[role="combobox"]')
                ?.focus();
            }, 0);
          }
          return true;
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        navigate(PATHS.myTasks);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, paletteOpen]);

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
        {user ? <NotificationBell /> : null}
      </div>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}

export { AiAssistantWidget as AiAssistantButton } from '@/features/ai-assistant/AiAssistantWidget';
