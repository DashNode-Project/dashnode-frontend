import { LayoutList, List, Table2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Card, SectionHeader } from '@/components/ui/demo-ui';
import { listProjects } from '@/features/projects/api';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { changeTaskStatus, listMyTasks, type MyTaskItem } from './api';
import { MyTasksKanbanView } from './MyTasksKanbanView';
import {
  readMyTasksProjectFilter,
  readMyTasksViewMode,
  writeMyTasksProjectFilter,
  writeMyTasksViewMode,
  type MyTasksViewMode,
} from './myTasksPreferences';
import { TASK_STATUS_OPTIONS } from './messages';

function TaskStatusSelect({
  task,
  busyId,
  onStatus,
}: {
  task: MyTaskItem;
  busyId: string | null;
  onStatus: (task: MyTaskItem, next: string) => void;
}) {
  return (
    <select
      aria-label={`Estado de ${task.name}`}
      value={task.status}
      disabled={busyId === task.id || task.status === 'CORRECTION'}
      title={
        task.status === 'CORRECTION'
          ? 'El estado Corrección solo cambia al reportar o resolver un fix.'
          : 'Cambiar estado de la tarea'
      }
      onChange={(event) => onStatus(task, event.target.value)}
      className="rounded-md border border-white/10 bg-[#1E1F2B] px-2 py-1"
    >
      {TASK_STATUS_OPTIONS.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.value === 'CORRECTION'}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function MyTasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<MyTaskItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(() => readMyTasksProjectFilter());
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<MyTasksViewMode>(() => readMyTasksViewMode());
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const projects = await listProjects();
        if (!cancelled) {
          setProjectOptions(projects.map((p) => ({ id: p.id, name: p.name })));
        }
      } catch {
        try {
          const data = await listMyTasks();
          if (!cancelled) {
            const fromTasks = Array.from(
              new Map(data.tasks.map((t) => [t.project.id, t.project.name])).entries(),
            ).map(([id, name]) => ({ id, name }));
            setProjectOptions(fromTasks);
          }
        } catch {
          if (!cancelled) setProjectOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeMyTasksProjectFilter(projectId);
  }, [projectId]);

  useEffect(() => {
    writeMyTasksViewMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listMyTasks({
          projectId: projectId || undefined,
          status: status || undefined,
        });
        if (cancelled) return;
        setTasks(data.tasks);
        setMessage(data.message ?? null);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError && !isTechnicalFailure(err)
              ? err.message
              : MESSAGES.loadFailure,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, status]);

  async function onStatus(task: MyTaskItem, next: string) {
    if (next === 'CORRECTION' || task.status === 'CORRECTION') {
      showToast('El estado Corrección solo cambia al reportar o resolver un fix.', 'error');
      return;
    }
    setBusyId(task.id);
    try {
      const result = await changeTaskStatus(task.project.id, task.id, next);
      showToast(result.message, 'success');
      setTasks((rows) =>
        rows.map((row) => (row.id === task.id ? { ...row, status: result.status } : row)),
      );
    } catch (err) {
      showToast(
        err instanceof ApiError && !isTechnicalFailure(err)
          ? err.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setBusyId(null);
    }
  }

  const viewToggle = (
    <div
      className="inline-flex rounded-lg border border-white/10 bg-[#12131C] p-1"
      role="tablist"
      aria-label="Vista de mis tareas"
    >
      <button
        type="button"
        role="tab"
        title="Vista compacta en lista"
        aria-selected={viewMode === 'list'}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
        }`}
        onClick={() => setViewMode('list')}
      >
        <LayoutList size={14} aria-hidden="true" />
        Lista
      </button>
      <button
        type="button"
        role="tab"
        title="Vista en tabla con columnas detalladas"
        aria-selected={viewMode === 'table'}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
        }`}
        onClick={() => setViewMode('table')}
      >
        <Table2 size={14} aria-hidden="true" />
        Tabla
      </button>
      <button
        type="button"
        role="tab"
        title="Vista Kanban por estado"
        aria-selected={viewMode === 'kanban'}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
        }`}
        onClick={() => setViewMode('kanban')}
      >
        <List size={14} aria-hidden="true" />
        Kanban
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader title="Mis tareas" subtitle="Trabajo asignado en todos sus proyectos" />
        {viewToggle}
      </div>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Card className="flex flex-wrap gap-3 p-4">
        <label className="text-sm text-[#9CA3AF]">
          Proyecto
          <select
            className="mt-1 block rounded-md border border-white/10 bg-[#1E1F2B] px-3 py-2 text-[#F9FAFB]"
            value={projectId}
            title="Filtrar tareas por proyecto"
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Todos</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[#9CA3AF]">
          Estado
          <select
            className="mt-1 block rounded-md border border-white/10 bg-[#1E1F2B] px-3 py-2 text-[#F9FAFB]"
            value={status}
            title="Filtrar tareas por estado"
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos</option>
            {TASK_STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.value === 'CORRECTION'}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </Card>
      <p className="text-xs text-[#6B7280]">
        {projectId
          ? 'Vista de sus tareas asignadas en el proyecto seleccionado. Para ver todo el equipo, use el Kanban del proyecto.'
          : 'Solo se listan tareas asignadas a su usuario.'}
      </p>
      {message ? <p className="text-sm text-[#9CA3AF]">{message}</p> : null}
      {viewMode === 'kanban' ? (
        <MyTasksKanbanView
          tasks={tasks}
          busyId={busyId}
          onStatusChange={(task, next) => void onStatus(task, next)}
        />
      ) : viewMode === 'list' ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-xl border border-white/6 bg-[#12131C] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#F9FAFB]">{task.name}</p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    {task.project.name} · {task.user_story.title}
                  </p>
                </div>
                <TaskStatusSelect task={task} busyId={busyId} onStatus={(t, n) => void onStatus(t, n)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/6">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#12131C] text-[#9CA3AF]">
              <tr>
                <th className="px-3 py-2">Tarea</th>
                <th className="px-3 py-2">Proyecto</th>
                <th className="px-3 py-2">Épica</th>
                <th className="px-3 py-2">Historia</th>
                <th className="px-3 py-2">Sprint</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Horas</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-white/6">
                  <td className="px-3 py-2 text-[#F9FAFB]">{task.name}</td>
                  <td className="px-3 py-2 text-[#9CA3AF]">{task.project.name}</td>
                  <td className="px-3 py-2 text-[#9CA3AF]">{task.epic?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-[#9CA3AF]">{task.user_story.title}</td>
                  <td className="px-3 py-2 text-[#9CA3AF]">{task.sprint?.name ?? '—'}</td>
                  <td className="px-3 py-2">
                    <TaskStatusSelect
                      task={task}
                      busyId={busyId}
                      onStatus={(t, n) => void onStatus(t, n)}
                    />
                  </td>
                  <td className="px-3 py-2 text-[#9CA3AF]">
                    {task.logged_hours} / {task.estimated_hours ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}