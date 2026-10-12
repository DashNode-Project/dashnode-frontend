import { Bell, Bot, Search } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { notifyUnderDevelopment } from '@/lib/underDevelopment';

/** Global search and notifications. Not part of EP-01: they only log the under-development notice. */
export function HeaderTools() {
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => notifyUnderDevelopment('search')}
        className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]"
      >
        <Search size={14} aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Buscar</span>
      </button>
      {user && user.role !== 'admin' ? (
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={() => notifyUnderDevelopment('notifications')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]"
        >
          <Bell size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/** Floating AI assistant entry point (module outside EP-01). */
export function AiAssistantButton() {
  return (
    <button
      type="button"
      aria-label="Asistente de IA"
      onClick={() => notifyUnderDevelopment('ai-assistant')}
      className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-500"
    >
      <Bot size={20} aria-hidden="true" />
    </button>
  );
}
