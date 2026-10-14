import { ArrowRight, FolderOpen, Video, Activity, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import type { AuthUser } from '@/features/auth/types';
import { listMeetings } from '@/features/availability/api';
import type { MeetingDTO } from '@/features/availability/types';
import { listProjects, type ProjectSummary } from '@/features/projects/api';
import { Card, SectionHeader, StatCard } from '@/components/ui/demo-ui';
import { useToast } from '@/lib/toast/ToastProvider';
import { MESSAGES } from '@/lib/messages';

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function OperationalHomeDashboard({ user }: { user: AuthUser }) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [meetings, setMeetings] = useState<MeetingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, m] = await Promise.all([listProjects(), listMeetings()]);
        if (!cancelled) {
          setProjects(p);
          setMeetings(m);
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

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter((m) => m.status === 'scheduled' && m.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
        .slice(0, 5),
    [meetings, todayStr],
  );

  const activeProjects = projects.filter((p) => p.status === 'activo');

  return (
    <div>
      <SectionHeader
        title={`Bienvenido, ${user.name}`}
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
              label="Proyectos"
              value={projects.length}
              icon={<FolderOpen size={18} className="text-violet-400" />}
              trend={`${activeProjects.length} activos`}
            />
            <StatCard
              label="Reuniones próximas"
              value={upcomingMeetings.length}
              icon={<Video size={18} className="text-blue-400" />}
              trend="Agenda del equipo"
            />
            <StatCard
              label="Mi rol"
              value={user.role === 'manager' ? 'Gerente' : 'Desarrollador'}
              icon={<Activity size={18} className="text-emerald-400" />}
              trend="DashNode"
            />
            <StatCard
              label="Sprints"
              value="—"
              icon={<Users size={18} className="text-amber-400" />}
              trend="Funcionalidad en desarrollo"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-[#F9FAFB]">Próximas reuniones</h2>
                <Link
                  to={PATHS.meetings}
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
                >
                  Ver todas <ArrowRight size={13} />
                </Link>
              </div>
              {upcomingMeetings.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Sin reuniones próximas.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {upcomingMeetings.map((m) => (
                    <li key={m.id} className="flex gap-3 py-2.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                        <Video size={14} className="text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#F9FAFB]">{m.title}</p>
                        <p className="text-xs text-[#6B7280]">
                          {formatDate(m.date)} · {m.start_time}
                        </p>
                        {m.project_name ? (
                          <p className="text-xs text-[#9CA3AF]">{m.project_name}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-[#F9FAFB]">Proyectos recientes</h2>
                <Link
                  to={PATHS.projects}
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
                >
                  Ver todos <ArrowRight size={13} />
                </Link>
              </div>
              <ul className="divide-y divide-white/5">
                {projects.slice(0, 5).map((p) => (
                  <li key={p.id} className="py-2.5">
                    <Link
                      to={`${PATHS.projects}/${p.id}/resumen`}
                      className="text-sm font-medium text-[#F9FAFB] hover:text-blue-300"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs capitalize text-[#6B7280]">{p.status}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="mt-5 border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm text-[#9CA3AF]">
              <span className="font-medium text-[#F9FAFB]">Sesión activa</span> · {user.email}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
