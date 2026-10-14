import { Activity, ArrowRight, FolderOpen, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import {
  fetchAdminDashboardSummary,
  listAdminUsers,
  type AdminUserSummary,
} from '@/features/auth/api';
import { ROLE_LABELS } from '@/features/auth/roles';
import { Avatar, Card, SectionHeader, StatCard, StatusBadge } from '@/components/ui/demo-ui';
import { useToast } from '@/lib/toast/ToastProvider';
import { MESSAGES } from '@/lib/messages';

function userStatus(active: boolean): string {
  return active ? 'activo' : 'inactivo';
}

export function AdminHomeDashboard({ welcomeName }: { welcomeName: string }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [userRows, summary] = await Promise.all([
          listAdminUsers(),
          fetchAdminDashboardSummary(),
        ]);
        if (!cancelled) {
          setUsers(userRows);
          setProjectCount(summary.project_count);
        }
      } catch {
        if (!cancelled) showToast(MESSAGES.loadFailure, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const activeUsers = useMemo(() => users.filter((u) => u.is_active).length, [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin').length, [users]);
  const managerCount = useMemo(() => users.filter((u) => u.role === 'manager').length, [users]);

  return (
    <div>
      <SectionHeader
        title={`Bienvenido, ${welcomeName}`}
        subtitle={new Date().toLocaleDateString('es-CO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      {loading ? (
        <p className="text-sm text-[#9CA3AF]" role="status">
          Cargando panel…
        </p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Usuarios totales"
              value={users.length}
              icon={<Users size={18} className="text-blue-400" />}
              trend={`${activeUsers} activos`}
            />
            <StatCard
              label="Usuarios activos"
              value={activeUsers}
              icon={<Activity size={18} className="text-emerald-400" />}
              trend={`${adminCount} administradores`}
            />
            <StatCard
              label="Gerentes"
              value={managerCount}
              icon={<Users size={18} className="text-violet-400" />}
              trend="Rol operativo"
            />
            <StatCard
              label="Proyectos"
              value={projectCount ?? '—'}
              icon={<FolderOpen size={18} className="text-amber-400" />}
              trend="Total en la plataforma"
            />
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-[#F9FAFB]">Usuarios recientes</h2>
              <Link
                to={PATHS.users}
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
              >
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>
            {users.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No hay usuarios registrados.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {users.slice(0, 5).map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#F9FAFB]">{u.name}</p>
                      <p className="truncate text-xs text-[#6B7280]">{u.email}</p>
                    </div>
                    <span className="hidden text-xs text-[#9CA3AF] sm:inline">
                      {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                    </span>
                    <StatusBadge status={userStatus(u.is_active)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
