import { Shield } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Card, SectionHeader } from '@/components/ui/demo-ui';
import { PERMISSIONS_MATRIX } from '@/features/permissions/permissionsMatrix';

const shortcuts = [
  { keys: 'Ctrl + K', action: 'Abrir búsqueda rápida (paleta de comandos)' },
  { keys: 'Ctrl + /', action: 'Enfocar búsqueda rápida cuando la paleta está abierta' },
  { keys: 'Esc', action: 'Cerrar paleta, menús desplegables o diálogos modales' },
  { keys: 'Tab', action: 'Avanzar entre controles interactivos visibles' },
  { keys: 'Shift + Tab', action: 'Retroceder entre controles interactivos' },
  { keys: 'Enter', action: 'Activar botón o enlace enfocado' },
  { keys: 'Inicio', action: 'Ir al panel principal de su rol (desde la barra lateral)' },
  { keys: 'Ctrl + Shift + M', action: 'Abrir Mis tareas' },
];

function cell(value: boolean): string {
  return value ? 'Sí' : 'No';
}

export default function UserManualPage() {
  return (
    <div>
      <SectionHeader
        title="Manual de usuario"
        subtitle="Atajos de teclado, accesibilidad y permisos por rol"
      />

      <Card className="mb-6 p-6">
        <h2 className="mb-3 text-lg font-semibold text-[#F9FAFB]">Invitación de desarrollador</h2>
        <p className="mb-4 text-sm text-[#9CA3AF]">
          El gerente no recibe ni ve una contraseña. El desarrollador abre el enlace del correo,
          autoriza o rechaza la cuenta, ingresa el código de 6 dígitos y define su contraseña. La
          solicitud vence a las 24 horas y puede renovarse hasta tres veces.
        </p>
        <h2 className="mb-3 text-lg font-semibold text-[#F9FAFB]">Atajos de teclado</h2>
        <p className="mb-4 text-sm text-[#9CA3AF]">
          Estos atajos aceleran tareas frecuentes. En macOS, use{' '}
          <span className="text-[#F9FAFB]">Cmd</span> en lugar de Ctrl cuando aplique.
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

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <Shield size={22} className="text-blue-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[#F9FAFB]">Permisos y roles</h2>
        </div>
        <p className="mb-4 text-sm text-[#9CA3AF]">
          Matriz informativa de acciones permitidas según el rol. No es editable desde la
          aplicación.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-2 font-medium">Módulo</th>
                <th className="px-4 py-2 font-medium">Funcionalidad</th>
                <th className="px-4 py-2 font-medium">Administrador</th>
                <th className="px-4 py-2 font-medium">Gerente</th>
                <th className="px-4 py-2 font-medium">Desarrollador</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS_MATRIX.map((row) => (
                <tr key={`${row.module}-${row.capability}`} className="border-t border-white/10">
                  <td className="px-4 py-2 text-[#F9FAFB]">{row.module}</td>
                  <td className="px-4 py-2">{row.capability}</td>
                  <td className="px-4 py-2">{cell(row.admin)}</td>
                  <td className="px-4 py-2">{cell(row.manager)}</td>
                  <td className="px-4 py-2">{cell(row.developer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Alert variant="info" className="mt-4">
          Los permisos no son modificables desde esta pantalla.
        </Alert>
      </Card>
    </div>
  );
}
