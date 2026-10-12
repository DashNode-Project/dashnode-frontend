import React from 'react';
import { Users, FolderOpen, Video, Activity, CheckCircle, Clock, AlertCircle, ArrowRight, Target, Wrench } from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { StatCard, Badge, Avatar, StatusBadge, ProgressBar, Card, Button } from '../components/ui';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return 'Hace menos de 1h';
  if (h < 24) return `Hace ${h}h`;
  if (d === 1) return 'Ayer';
  return `Hace ${d} días`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function TaskStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'in-progress': 'bg-blue-400', 'code-review': 'bg-violet-400',
    'testing': 'bg-yellow-400', 'fixing': 'bg-orange-400',
    'todo': 'bg-[#374151]', 'completed': 'bg-emerald-400',
  };
  return <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors[status] ?? 'bg-[#374151]'}`} />;
}

export default function Dashboard() {
  const { state, navigate } = useApp();
  const { currentUser, users, projects, meetings, tasks, fixes, sprints, stories } = state;
  if (!currentUser) return null;

  const role = currentUser.role;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingMeetings = meetings
    .filter(m => m.status === 'scheduled' && new Date(m.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const userProjects = role === 'admin' ? projects : projects.filter(p =>
    p.managerId === currentUser.id || p.memberIds.includes(currentUser.id)
  );

  const activeSprints = sprints.filter(s => s.status === 'active' && userProjects.some(p => p.id === s.projectId));
  const myPendingTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'completed');
  const openFixes = fixes.filter(f => (f.status === 'open' || f.status === 'in-progress') && userProjects.some(p => p.id === f.projectId));
  const activeUsers = users.filter(u => u.status === 'active').length;

  const MeetingsPanel = ({ filtered }: { filtered: typeof upcomingMeetings }) => (
    <Card className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#F9FAFB]">Próximas reuniones</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate({ page: 'meetings' })} iconRight={<ArrowRight size={13} />}>Ver todas</Button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-[#6B7280]">Sin reuniones próximas.</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/4">
          {filtered.map(m => {
            const proj = projects.find(p => p.id === m.projectId);
            return (
              <div key={m.id} className="flex items-start gap-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Video size={14} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F9FAFB] truncate">{m.title}</p>
                  <p className="text-xs text-[#6B7280]">{formatDate(m.date)} · {m.startTime} · {m.duration}min</p>
                  {proj && <p className="text-xs text-[#9CA3AF]">{proj.name}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  return (
    <AppShell title="Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F9FAFB]">
          Bienvenido, {currentUser.name}
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ADMIN dashboard */}
      {role === 'admin' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Usuarios totales" value={users.length} icon={<Users size={18} className="text-blue-400" />} trend={`${activeUsers} activos`} />
            <StatCard label="Usuarios activos" value={activeUsers} icon={<Activity size={18} className="text-emerald-400" />} trend={`${users.filter(u => u.role === 'admin').length} admins`} />
            <StatCard label="Proyectos" value={projects.length} icon={<FolderOpen size={18} className="text-violet-400" />} trend={`${projects.filter(p => p.status === 'active').length} activos`} />
            <StatCard label="Fixes abiertos" value={openFixes.length} icon={<Wrench size={18} className="text-amber-400" />} trend="En todos los proyectos" />
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#F9FAFB]">Usuarios recientes</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate({ page: 'users' })} iconRight={<ArrowRight size={13} />}>Ver todos</Button>
              </div>
              <div className="flex flex-col gap-3">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={`${u.name} ${u.lastName}`} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F9FAFB] truncate">{u.name} {u.lastName}</p>
                      <p className="text-xs text-[#6B7280] truncate">{u.email}</p>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#F9FAFB]">Proyectos</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate({ page: 'projects' })} iconRight={<ArrowRight size={13} />}>Ver todos</Button>
              </div>
              <div className="flex flex-col gap-3">
                {projects.map(p => {
                  const manager = users.find(u => u.id === p.managerId);
                  return (
                    <div key={p.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate({ page: 'project-workspace', projectId: p.id })}>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                        <FolderOpen size={14} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F9FAFB] group-hover:text-blue-400 transition-colors truncate">{p.name}</p>
                        <p className="text-xs text-[#6B7280]">{manager?.name} {manager?.lastName}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="font-semibold text-[#F9FAFB] mb-4">Actividad reciente</h2>
            <div className="flex flex-col gap-3">
              {[
                { user: 'Iván Ausecha', action: 'completó la tarea "Tabla de usuarios con filtros"', time: '2026-03-25T10:00:00Z', color: 'text-emerald-400' },
                { user: 'Jhorman Gómez', action: 'creó la reunión "Sprint Review – Sprint 2"', time: '2026-03-24T14:00:00Z', color: 'text-blue-400' },
                { user: 'David Enciso', action: 'reportó el fix "Advertencia faltante al eliminar usuario"', time: '2026-03-25T14:00:00Z', color: 'text-amber-400' },
                { user: 'Andrey Quiceno', action: 'actualizó el estado del proyecto Sistema de Inventarios a activo', time: '2026-04-10T09:00:00Z', color: 'text-violet-400' },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-[#F9FAFB]">
                      <span className={`font-medium ${a.color}`}>{a.user}</span>{' '}{a.action}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{timeAgo(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* MANAGER dashboard */}
      {role === 'manager' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Mis proyectos" value={userProjects.length} icon={<FolderOpen size={18} className="text-blue-400" />} trend={`${userProjects.filter(p => p.status === 'active').length} activos`} />
            <StatCard label="Sprints activos" value={activeSprints.length} icon={<Target size={18} className="text-violet-400" />} trend="En curso ahora" />
            <StatCard label="Reuniones próximas" value={upcomingMeetings.length} icon={<Video size={18} className="text-emerald-400" />} trend="Próximas 7 días" />
            <StatCard label="Fixes abiertos" value={openFixes.length} icon={<Wrench size={18} className="text-amber-400" />} trend="En mis proyectos" />
          </div>

          {/* Row 1: Pending tasks (left) + Upcoming meetings (right) */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#F9FAFB]">Tareas pendientes</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate({ page: 'my-tasks' })} iconRight={<ArrowRight size={13} />}>Mis tareas</Button>
              </div>
              {myPendingTasks.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Sin tareas pendientes.</p>
              ) : (
                <div className="flex flex-col divide-y divide-white/4">
                  {myPendingTasks.slice(0, 5).map(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    return (
                      <div key={t.id} className="flex items-start gap-3 py-2.5">
                        <TaskStatusDot status={t.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F9FAFB] truncate">{t.title}</p>
                          <p className="text-xs text-[#6B7280]">{proj?.name} · {t.estimatedHours}h est.</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <MeetingsPanel filtered={upcomingMeetings} />
          </div>

          {/* Row 2: Active sprints */}
          <Card className="p-5 mb-5">
            <h2 className="font-semibold text-[#F9FAFB] mb-4">Sprints activos</h2>
            {activeSprints.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No hay sprints activos.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {activeSprints.map(sprint => {
                  const proj = projects.find(p => p.id === sprint.projectId);
                  const sprintStories = stories.filter(s => s.sprintId === sprint.id);
                  const completed = sprintStories.filter(s => s.status === 'completed').length;
                  const total = sprintStories.length;
                  const pct = total ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div key={sprint.id} className="cursor-pointer bg-[#1E1F2B] rounded-xl p-4 border border-white/6 hover:border-white/12 transition-colors"
                      onClick={() => navigate({ page: 'project-workspace', projectId: sprint.projectId, projectTab: 'sprints' })}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F9FAFB] truncate">{sprint.name}</p>
                          <p className="text-xs text-[#6B7280]">{proj?.name} · Finaliza {formatDate(sprint.endDate)}</p>
                        </div>
                        <span className="text-sm font-bold text-blue-400 ml-2 shrink-0">{pct}%</span>
                      </div>
                      <ProgressBar value={completed} max={total || 1} color="blue" />
                      <p className="text-xs text-[#6B7280] mt-1">{completed} de {total} historias completadas</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Row 3: My projects */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#F9FAFB]">Mis proyectos</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate({ page: 'projects' })} iconRight={<ArrowRight size={13} />}>Ver todos</Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {userProjects.map(p => {
                const projTasks = tasks.filter(t => t.projectId === p.id);
                const done = projTasks.filter(t => t.status === 'completed').length;
                return (
                  <div key={p.id} className="bg-[#1E1F2B] rounded-lg p-4 cursor-pointer hover:bg-[#20222D] transition-colors border border-white/4"
                    onClick={() => navigate({ page: 'project-workspace', projectId: p.id })}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-md bg-blue-500/15 flex items-center justify-center">
                        <FolderOpen size={13} className="text-blue-400" />
                      </div>
                      <p className="text-sm font-semibold text-[#F9FAFB] flex-1 truncate">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-[#9CA3AF] mb-3 line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between text-xs text-[#6B7280]">
                      <span>{p.memberIds.length} miembros</span>
                      <span>{done}/{projTasks.length} tareas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* DEVELOPER dashboard */}
      {role === 'developer' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Mis proyectos" value={userProjects.length} icon={<FolderOpen size={18} className="text-blue-400" />} />
            <StatCard label="Tareas asignadas" value={myPendingTasks.length} icon={<CheckCircle size={18} className="text-violet-400" />} trend="Pendientes" />
            <StatCard label="Próximas reuniones" value={upcomingMeetings.filter(m => m.participantIds.includes(currentUser.id)).length} icon={<Video size={18} className="text-emerald-400" />} />
            <StatCard label="Fixes asignados" value={fixes.filter(f => f.assigneeId === currentUser.id && f.status !== 'resolved' && f.status !== 'closed').length} icon={<Wrench size={18} className="text-amber-400" />} />
          </div>

          {/* Row 1: Pending tasks (left) + Upcoming meetings (right) */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#F9FAFB]">Mis tareas pendientes</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate({ page: 'my-tasks' })} iconRight={<ArrowRight size={13} />}>Ver todas</Button>
              </div>
              {myPendingTasks.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Sin tareas pendientes. ¡Excelente!</p>
              ) : (
                <div className="flex flex-col divide-y divide-white/4">
                  {myPendingTasks.slice(0, 6).map(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    return (
                      <div key={t.id} className="flex items-start gap-3 py-2.5">
                        <TaskStatusDot status={t.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F9FAFB] truncate">{t.title}</p>
                          <p className="text-xs text-[#6B7280]">{proj?.name} · Est. {t.estimatedHours}h</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <MeetingsPanel filtered={upcomingMeetings.filter(m => m.participantIds.includes(currentUser.id))} />
          </div>

          {/* Row 2: Active sprints */}
          {activeSprints.length > 0 && (
            <Card className="p-5 mb-5">
              <h2 className="font-semibold text-[#F9FAFB] mb-4">Sprints activos</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {activeSprints.map(sprint => {
                  const proj = projects.find(p => p.id === sprint.projectId);
                  const sprintStories = stories.filter(s => s.sprintId === sprint.id);
                  const mySprintTasks = tasks.filter(t => t.sprintId === sprint.id && t.assigneeId === currentUser.id);
                  const doneTasks = mySprintTasks.filter(t => t.status === 'completed').length;
                  return (
                    <div key={sprint.id} className="cursor-pointer bg-[#1E1F2B] rounded-xl p-4 border border-white/6 hover:border-white/12 transition-colors"
                      onClick={() => navigate({ page: 'project-workspace', projectId: sprint.projectId, projectTab: 'sprints' })}>
                      <p className="text-sm font-semibold text-[#F9FAFB]">{sprint.name}</p>
                      <p className="text-xs text-[#6B7280] mb-2">{proj?.name} · {sprintStories.length} HU</p>
                      <p className="text-xs text-[#9CA3AF]">Mis tareas: {doneTasks}/{mySprintTasks.length} completadas</p>
                      {mySprintTasks.length > 0 && <ProgressBar value={doneTasks} max={mySprintTasks.length} size="sm" className="mt-2" />}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Row 3: My projects */}
          <Card className="p-5">
            <h2 className="font-semibold text-[#F9FAFB] mb-4">Proyectos asignados</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {userProjects.map(p => {
                const myProjTasks = tasks.filter(t => t.projectId === p.id && t.assigneeId === currentUser.id);
                const done = myProjTasks.filter(t => t.status === 'completed').length;
                return (
                  <div key={p.id} className="bg-[#1E1F2B] rounded-lg p-4 cursor-pointer hover:bg-[#20222D] transition-colors border border-white/4"
                    onClick={() => navigate({ page: 'project-workspace', projectId: p.id })}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-blue-500/15 flex items-center justify-center">
                        <FolderOpen size={13} className="text-blue-400" />
                      </div>
                      <p className="text-sm font-semibold text-[#F9FAFB] flex-1 truncate">{p.name}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mb-2 line-clamp-2">{p.description}</p>
                    <p className="text-xs text-[#6B7280]">Mis tareas: {done}/{myProjTasks.length}</p>
                    {myProjTasks.length > 0 && <ProgressBar value={done} max={myProjTasks.length} size="sm" className="mt-2" />}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}
