import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { Button } from '@/components/ui/Button';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#12131C] p-6">
        <h2 id="keyboard-shortcuts-title" className="mb-2 text-lg font-semibold text-[#F9FAFB]">
          Atajos de teclado
        </h2>
        <p className="mb-4 text-sm text-[#9CA3AF]">
          En macOS, use <span className="text-[#F9FAFB]">Cmd</span> en lugar de Ctrl cuando aplique.
        </p>
        <ul className="mb-6 max-h-[50vh] divide-y divide-white/6 overflow-y-auto">
          {KEYBOARD_SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <kbd className="rounded-md border border-white/15 bg-[#0A0B0E] px-2 py-1 text-xs font-semibold text-[#F9FAFB]">
                {s.keys}
              </kbd>
              <span className="flex-1 text-sm text-[#F9FAFB]">{s.action}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={PATHS.userManual}
            onClick={onClose}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Ver manual completo
          </Link>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
