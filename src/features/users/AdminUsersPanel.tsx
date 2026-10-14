import { Key, Pencil, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AdminUserSummary } from '@/features/auth/api';
import { Avatar, RoleBadge, SearchInput, StatusBadge } from '@/components/ui/demo-ui';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { USER_MESSAGES } from './messages';

type RoleTab = 'all' | 'admin' | 'manager' | 'developer';

function activeStatus(active: boolean): string {
  return active ? 'activo' : 'desactivado';
}

export function AdminUsersPanel({
  users,
  loading,
  onEdit,
  onDeactivate,
  onReactivate,
  onResetPassword,
  onDelete,
}: {
  users: AdminUserSummary[];
  loading: boolean;
  onEdit: (u: AdminUserSummary) => void;
  onDeactivate: (u: AdminUserSummary) => void;
  onReactivate: (u: AdminUserSummary) => void;
  onResetPassword: (u: AdminUserSummary) => void;
  onDelete: (u: AdminUserSummary) => void;
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<RoleTab>('all');
  const debouncedSearch = useDebouncedValue(search, 300);

  const tabs: { id: RoleTab; label: string; count: number }[] = useMemo(
    () => [
      { id: 'all', label: 'Todos', count: users.length },
      { id: 'admin', label: 'Admins', count: users.filter((u) => u.role === 'admin').length },
      { id: 'manager', label: 'Gerentes', count: users.filter((u) => u.role === 'manager').length },
      {
        id: 'developer',
        label: 'Desarrolladores',
        count: users.filter((u) => u.role === 'developer').length,
      },
    ],
    [users],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return users.filter((u) => {
      const matchTab = tab === 'all' || u.role === tab;
      const matchSearch =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [users, tab, debouncedSearch]);

  const emptyMessage =
    debouncedSearch || tab !== 'all' ? USER_MESSAGES.filterEmpty : USER_MESSAGES.emptyList;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden="true"
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o correo…"
            className="h-10 w-full pl-9"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por rol">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            title={`Ver ${t.label.toLowerCase()}`}
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                : 'border-white/10 bg-[#12131C] text-[#9CA3AF] hover:border-white/20 hover:text-[#F9FAFB]'
            }`}
          >
            {t.label} <span className="ml-1 text-xs opacity-80">({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#9CA3AF]" role="status">
          Cargando usuarios…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#12131C] px-4 py-8 text-center text-sm text-[#9CA3AF]">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#12131C]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-[#0A0B0E] text-xs uppercase tracking-wide text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size={32} />
                      <span className="font-medium text-[#F9FAFB]">{u.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-[#9CA3AF] md:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={activeStatus(u.is_active)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconActionButton
                        icon={Pencil}
                        label="Editar usuario"
                        tone="blue"
                        onClick={() => onEdit(u)}
                      />
                      {u.is_active ? (
                        <IconActionButton
                          icon={UserX}
                          label="Desactivar usuario"
                          tone="amber"
                          onClick={() => onDeactivate(u)}
                        />
                      ) : (
                        <IconActionButton
                          icon={UserCheck}
                          label="Reactivar usuario"
                          tone="emerald"
                          onClick={() => onReactivate(u)}
                        />
                      )}
                      <IconActionButton
                        icon={Key}
                        label="Restablecer contraseña"
                        tone="violet"
                        onClick={() => onResetPassword(u)}
                      />
                      <IconActionButton
                        icon={Trash2}
                        label="Eliminar usuario (desactivar)"
                        tone="red"
                        onClick={() => onDelete(u)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
