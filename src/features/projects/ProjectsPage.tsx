import { FolderOpen, Plus } from 'lucide-react';
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
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { createProject, listActiveManagers, listProjects, type ProjectSummary } from './api';
import { PROJECT_MESSAGES, PROJECT_PRIORITY_LABELS, PROJECT_STATUS_LABELS } from './messages';
import { parseTechStack, validateProjectForm, type ProjectFormValues } from './validation';
import { projectDetailPath } from '@/app/paths';

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
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

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
    if (statusFilter === 'all') return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

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
            Organice el trabajo del equipo en espacios con responsable definido.
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={() => void openCreate()}>
            <Plus size={16} aria-hidden="true" />
            Nuevo proyecto
          </Button>
        ) : null}
      </div>

      <div className="mb-4">
        <label htmlFor="status-filter" className="sr-only">
          Filtrar por estado
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#9CA3AF] focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[#9CA3AF]" role="status">
          Cargando proyectos…
        </p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-[#12131C] p-8 text-center">
          <FolderOpen className="mx-auto mb-3 text-[#6B7280]" size={28} aria-hidden="true" />
          <p className="text-sm text-[#9CA3AF]">No hay proyectos para mostrar.</p>
          {canCreate ? (
            <Button type="button" className="mt-4" onClick={() => void openCreate()}>
              Crear proyecto
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((project) => (
            <li key={project.id}>
              <Link
                to={projectDetailPath(project.id)}
                className="block rounded-xl border border-white/6 bg-[#12131C] p-5 transition-colors hover:border-white/12"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-[#F9FAFB]">{project.name}</h2>
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
                    {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-[#9CA3AF]">{project.description || '—'}</p>
                <p className="mt-3 text-xs text-[#6B7280]">
                  Prioridad: {PROJECT_PRIORITY_LABELS[project.priority] ?? project.priority}
                </p>
              </Link>
            </li>
          ))}
        </ul>
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
