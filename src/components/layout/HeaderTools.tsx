import { Bell, Bot, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { notifyUnderDevelopment } from '@/lib/underDevelopment';
import { CommandPalette } from './CommandPalette';

export function HeaderTools() {
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const closePalette = () => setPaletteOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    </>
  );
}

export function AiAssistantButton() {
  return (
    <button
      type="button"
      aria-label="Asistente de IA"
      onClick={() => notifyUnderDevelopment('ai-assistant')}
      className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl transition-transform hover:bg-violet-500 hover:scale-105 active:scale-95"
    >
      <Bot size={20} aria-hidden="true" />
    </button>
  );
}
