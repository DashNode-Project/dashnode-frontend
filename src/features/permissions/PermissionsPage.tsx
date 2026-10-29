import { Shield } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { PERMISSIONS_MATRIX } from './permissionsMatrix';

function cell(value: boolean): string {
  return value ? 'Sí' : 'No';
}

/** HU_DN_01_20 — read-only roles and permissions matrix. */
export default function PermissionsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Shield size={24} className="text-blue-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Permisos y roles</h1>
      </div>
      <p className="mb-4 text-sm text-[#9CA3AF]">
        Vista informativa de las acciones permitidas según el rol en la plataforma.
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#12131C] text-[#9CA3AF]">
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
                <td className="px-4 py-2">{row.module}</td>
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
    </div>
  );
}
