import { Card, SectionHeader } from '@/components/ui/demo-ui';

const shortcuts = [
  { keys: 'Ctrl + K', action: 'Abrir búsqueda rápida (command palette)' },
  { keys: 'Esc', action: 'Cerrar búsqueda rápida o diálogos' },
  { keys: 'Tab', action: 'Navegar entre controles del formulario activo' },
];

export default function UserManualPage() {
  return (
    <div>
      <SectionHeader
        title="Manual de usuario"
        subtitle="Atajos de teclado disponibles en DashNode"
      />
      <Card className="p-6">
        <p className="mb-4 text-sm text-[#9CA3AF]">
          Use estos atajos para moverse más rápido por la aplicación. En macOS, use{' '}
          <span className="text-[#F9FAFB]">Cmd</span> en lugar de Ctrl.
        </p>
        <ul className="divide-y divide-white/6">
          {shortcuts.map((s) => (
            <li key={s.keys} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <kbd className="rounded-md border border-white/15 bg-[#0A0B0E] px-2 py-1 text-xs font-semibold text-[#F9FAFB]">
                {s.keys}
              </kbd>
              <span className="flex-1 text-sm text-[#F9FAFB]">{s.action}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
