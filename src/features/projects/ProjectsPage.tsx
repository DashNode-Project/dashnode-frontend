import { ArrowRight, FolderOpen, LayoutGrid, List, Plus } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Avatar, SearchInput, StatusBadge } from '@/components/ui/demo-ui';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { createProject, listActiveManagers, listProjects, type ProjectSummary } from './api';
import { PROJECT_MESSAGES, PROJECT_PRIORITY_LABELS, PROJECT_STATUS_LABELS } from './messages';
import { parseTechStack, validateProjectForm, type ProjectFormValues } from './validation';
import { projectDetailPath } from '@/app/paths';

const STATUS_ACCENT: Record<string, string> = {
  activo: '#10B981',
  active: '#10B981',
  planificacion: '#8B5CF6',
  planning: '#8B5CF6',
  completado: '#3B82F6',
  completed: '#3B82F6',
  archivado: '#6B7280',
  archived: '#6B7280',
  pausa: '#F59E0B',
  'on-hold': '#F59E0B',
};

const EMPTY_FORM: ProjectFormValues = {
  name: '',
  description: '',
  priority: 'media',
  techStackInput: '',
  meetingLink: '',
  managerId: '',
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canCreate = user?.role === 'manager';

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormValues, string>>>(
    {},
  );
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listProjects());
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listProjects();
        if (!cancelled) setProjects(data);
      } catch (error) {
        if (cancelled) return;
        showToast(
          error instanceof ApiError && !isTechnicalFailure(error)
            ? error.message
            : MESSAGES.technicalFailure,
          'error',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const openCreate = async () => {
    setForm({ ...EMPTY_FORM, managerId: user?.role === 'manager' ? user.id : '' });
    setFieldErrors({});
    setCreateOpen(true);
    if (canCreate) {
      try {
        const rows = await listActiveManagers();
        setManagers(rows.map((m) => ({ id: m.id, name: m.name })));
        if (user?.role === 'manager') {
          setForm((f) => ({ ...f, managerId: user.id }));
        }
      } catch {
        showToast(MESSAGES.loadFailure, 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return projects.filter((p) => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [projects, statusFilter, debouncedSearch]);

  const activeCount = useMemo(
    () => projects.filter((p) => p.status === 'activo').length,
    [projects],
  );

  const handleCreate = async () => {
    const errors = validateProjectForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        priority: form.priority as 'baja' | 'media' | 'alta' | 'critica',
        tech_stack: parseTechStack(form.techStackInput),
        meeting_link: form.meetingLink.trim() || null,
        manager_id: form.managerId,
      });
      showToast(PROJECT_MESSAGES.created, 'success');
      setCreateOpen(false);
      await load();
      navigate(projectDetailPath(created.id));
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        const mapped: Partial<Record<keyof ProjectFormValues, string>> = {};
        if (error.fields.name) mapped.name = error.fields.name;
        if (error.fields.manager_id) mapped.managerId = error.fields.manager_id;
        if (error.fields.meeting_link) mapped.meetingLink = error.fields.meeting_link;
        setFieldErrors(mapped);
      } else {
        showToast(
          error instanceof ApiError && !isTechnicalFailure(error)
            ? error.message
            : MESSAGES.technicalFailure,
          'error',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#F9FAFB]">Proyectos</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {activeCount} activos de {projects.length} en total
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={() => void openCreate()}>
            <Plus size={16} aria-hidden="true" />
            Nuevo proyecto
          </Button>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar proyecto…"
            className="h-9 w-full"
          />
        </div>
        <label htmlFor="status-filter" className="sr-only">
          Filtrar por estado
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="Filtrar proyectos por estado"
          className="h-9 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#9CA3AF] focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-[#1E1F2B] p-1">
          <button
            type="button"
            title="Vista en tarjetas"
            aria-label="Vista en tarjetas"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-[#6B7280] hover:text-[#F9FAFB]'
            }`}
          >
            <LayoutGrid size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Vista en tabla"
            aria-label="Vista en tabla"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-[#6B7280] hover:text-[#F9FAFB]'
            }`}
          >
            <List size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#9CA3AF]" role="status">
          Cargando proyectos…
        </p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-[#12131C] p-8 text-center">
          <FolderOpen className="mx-auto mb-3 text-[#6B7280]" size={28} aria-hidden="true" />
          <p className="text-sm text-[#9CA3AF]">{PROJECT_MESSAGES.noProjectsAssigned}</p>
          {canCreate ? (
            <Button type="button" className="mt-4" onClick={() => void openCreate()}>
              Crear proyecto
            </Button>
          ) : null}
        </div>
      ) : viewMode === 'grid' ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const accent = STATUS_ACCENT[project.status] ?? '#3B82F6';
            return (
              <li key={project.id}>
                <div className="group relative overflow-hidden rounded-xl border border-white/6 bg-[#12131C] transition-all duration-200 hover:-translate-y-1 hover:border-white/15 hover:shadow-lg hover:shadow-black/20">
                  <div className="h-0.5 w-full" style={{ background: accent }} />
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: `${accent}22` }}
                        >
                          <FolderOpen size={15} style={{ color: accent }} aria-hidden="true" />
                        </div>
                        <StatusBadge status={project.status} />
                      </div>
                      <IconActionButton
                        icon={ArrowRight}
                        label={`Abrir proyecto ${project.name}`}
                        tone="blue"
                        className="opacity-80 group-hover:opacity-100"
                        onClick={() => navigate(projectDetailPath(project.id))}
                      />
                    </div>
                    <Link
                      to={projectDetailPath(project.id)}
                      className="block text-left"
                      title={`Ver detalle de ${project.name}`}
                    >
                      <h2 className="mb-1 font-semibold text-[#F9FAFB] transition-colors group-hover:text-blue-400">
                        {project.name}
                      </h2>
                      <p className="mb-4 line-clamp-2 text-xs text-[#9CA3AF]">
                        {project.description || '—'}
                      </p>
                    </Link>
                    <p className="text-xs text-[#6B7280]">
                      Prioridad: {PROJECT_PRIORITY_LABELS[project.priority] ?? project.priority}
                    </p>
                    {project.tech_stack.length > 0 ? (
                      <p className="mt-2 line-clamp-1 text-xs text-[#9CA3AF]">
                        Stack: {project.tech_stack.join(', ')}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
                      <Avatar name={project.manager_name || 'Gerente'} size={22} />
                      <span className="text-xs text-[#9CA3AF]">{project.manager_name || '—'}</span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/6 bg-[#12131C]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/6 text-xs uppercase tracking-wide text-[#6B7280]">
              <tr>
                <th className="px-4 py-3 font-medium">Proyecto</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Estado</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Gerente</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Prioridad</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((project) => {
                const accent = STATUS_ACCENT[project.status] ?? '#3B82F6';
                return (
                  <tr key={project.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link
                        to={projectDetailPath(project.id)}
                        className="group flex items-center gap-3"
                        title={`Abrir ${project.name}`}
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${accent}22` }}
                        >
                          <FolderOpen size={14} style={{ color: accent }} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium text-[#F9FAFB] group-hover:text-blue-400">
                            {project.name}
                          </p>
                          <p className="max-w-[240px] truncate text-xs text-[#6B7280]">
                            {project.description}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar name={project.manager_name || '—'} size={24} />
                        <span className="text-[#9CA3AF]">{project.manager_name || '—'}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-[#9CA3AF] lg:table-cell">
                      {PROJECT_PRIORITY_LABELS[project.priority] ?? project.priority}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <IconActionButton
                          icon={ArrowRight}
                          label={`Abrir proyecto ${project.name}`}
                          tone="blue"
                          onClick={() => navigate(projectDetailPath(project.id))}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#12131C] p-6 shadow-xl">
            <h2 id="create-project-title" className="mb-4 text-lg font-semibold">
              Crear proyecto
            </h2>
            <ProjectFormFields
              form={form}
              setForm={setForm}
              fieldErrors={fieldErrors}
              managers={managers}
              showManager
              showStatusReadonly
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" loading={submitting} onClick={() => void handleCreate()}>
                Crear proyecto
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProjectFormFields({
  form,
  setForm,
  fieldErrors,
  managers,
  showManager,
  showStatusReadonly,
}: {
  form: ProjectFormValues;
  setForm: Dispatch<SetStateAction<ProjectFormValues>>;
  fieldErrors: Partial<Record<keyof ProjectFormValues, string>>;
  managers: { id: string; name: string }[];
  showManager: boolean;
  showStatusReadonly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Nombre"
        required
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        error={fieldErrors.name}
        maxLength={100}
      />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#F9FAFB]">Descripción</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          maxLength={2000}
          className="rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#F9FAFB]">Prioridad</span>
        <select
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          className="h-10 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
        >
          {Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <TextField
        label="Stack tecnológico"
        hint="Etiquetas separadas por coma"
        value={form.techStackInput}
        onChange={(e) => setForm((f) => ({ ...f, techStackInput: e.target.value }))}
      />
      <TextField
        label="Enlace de reunión predeterminado"
        type="url"
        value={form.meetingLink}
        onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
        error={fieldErrors.meetingLink}
      />
      {showManager ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[#F9FAFB]">Gerente responsable</span>
          <select
            value={form.managerId}
            onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}
            className="h-10 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
          >
            <option value="">Seleccionar…</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {fieldErrors.managerId ? (
            <span className="text-xs text-red-400">{fieldErrors.managerId}</span>
          ) : null}
        </label>
      ) : null}
      {showStatusReadonly ? (
        <TextField label="Estado" value="Planificación" readOnly disabled />
      ) : null}
    </div>
  );
}
