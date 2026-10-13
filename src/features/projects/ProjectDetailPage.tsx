import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { PATHS } from '@/app/paths';
import {
  assignProjectManager,
  deleteProject,
  getProject,
  listActiveManagers,
  updateProject,
  updateProjectStatus,
  type ProjectSummary,
  type ProjectStatus,
} from './api';
import { ProjectFormFields } from './ProjectsPage';
import { PROJECT_MESSAGES, PROJECT_PRIORITY_LABELS, PROJECT_STATUS_LABELS } from './messages';
import { parseTechStack, validateProjectForm, type ProjectFormValues } from './validation';

function toForm(project: ProjectSummary): ProjectFormValues {
  return {
    name: project.name,
    description: project.description,
    priority: project.priority,
    techStackInput: project.tech_stack.join(', '),
    meetingLink: project.meeting_link ?? '',
    managerId: project.manager_id,
  };
}

export default function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormValues, string>>>(
    {},
  );
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusValue, setStatusValue] = useState<ProjectStatus>('planificacion');
  const [managerPick, setManagerPick] = useState('');

  const canManage =
    user?.role === 'admin' || (user?.role === 'manager' && project?.manager_id === user.id);
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getProject(projectId);
      setProject(data);
      setStatusValue(data.status);
      setManagerPick(data.manager_id);
      setForm(toForm(data));
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
  }, [projectId, showToast]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getProject(projectId);
        if (cancelled) return;
        setProject(data);
        setStatusValue(data.status);
        setManagerPick(data.manager_id);
        setForm(toForm(data));
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
  }, [projectId, showToast]);

  const loadManagers = async () => {
    try {
      const rows = await listActiveManagers();
      setManagers(rows.map((m) => ({ id: m.id, name: m.name })));
    } catch {
      showToast(MESSAGES.loadFailure, 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!form || !project) return;
    const errors = validateProjectForm({ ...form, managerId: project.manager_id });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      const updated = await updateProject(project.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        priority: form.priority as ProjectSummary['priority'],
        tech_stack: parseTechStack(form.techStackInput),
        meeting_link: form.meetingLink.trim() || null,
      });
      setProject(updated);
      setEditOpen(false);
      showToast(PROJECT_MESSAGES.updated, 'success');
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (next: ProjectStatus) => {
    if (!project) return;
    setStatusValue(next);
    try {
      const res = await updateProjectStatus(project.id, next);
      setProject({ ...project, status: next });
      showToast(res.message, 'success');
    } catch (error) {
      setStatusValue(project.status);
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    }
  };

  const handleAssignManager = async () => {
    if (!project || !managerPick) {
      setFieldErrors({ managerId: PROJECT_MESSAGES.managerRequired });
      return;
    }
    setSubmitting(true);
    try {
      const res = await assignProjectManager(project.id, managerPick);
      await load();
      setManagerOpen(false);
      showToast(res.message, 'success');
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setSubmitting(true);
    try {
      const res = await deleteProject(project.id);
      showToast(res.message, 'info');
      window.location.href = PATHS.projects;
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
    }
  };

  if (loading || !project || !form) {
    return (
      <p className="text-sm text-[#9CA3AF]" role="status">
        Cargando proyecto…
      </p>
    );
  }

  return (
    <div>
      <Link to={PATHS.projects} className="mb-4 inline-block text-sm text-blue-400 hover:underline">
        ← Proyectos
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6B7280]">Resumen</p>
          <h1 className="text-2xl font-semibold text-[#F9FAFB]">{project.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
              Editar proyecto
            </Button>
          ) : null}
          {canManage ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void loadManagers();
                setManagerOpen(true);
              }}
            >
              Cambiar gerente responsable
            </Button>
          ) : null}
          {isAdmin ? (
            <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
              Eliminar proyecto
            </Button>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-white/6 bg-[#12131C] p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#6B7280]">Estado</dt>
            <dd className="mt-1">
              {canManage ? (
                <select
                  value={statusValue}
                  onChange={(e) => void handleStatusChange(e.target.value as ProjectStatus)}
                  className="h-9 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
                  aria-label="Estado"
                >
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-[#F9FAFB]">
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#6B7280]">Prioridad</dt>
            <dd className="mt-1 text-sm text-[#F9FAFB]">
              {PROJECT_PRIORITY_LABELS[project.priority]}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#6B7280]">Descripción</dt>
            <dd className="mt-1 text-sm text-[#9CA3AF]">{project.description || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#6B7280]">Stack tecnológico</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {project.tech_stack.length ? (
                project.tech_stack.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[#9CA3AF]"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#6B7280]">—</span>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#6B7280]">Enlace de reunión predeterminado</dt>
            <dd className="mt-1 text-sm text-blue-400">
              {project.meeting_link ? (
                <a href={project.meeting_link} target="_blank" rel="noreferrer">
                  {project.meeting_link}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </section>

      {editOpen ? (
        <Modal
          title="Editar proyecto"
          onClose={() => setEditOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" loading={submitting} onClick={() => void handleSaveEdit()}>
                Guardar cambios
              </Button>
            </>
          }
        >
          <ProjectFormFields
            form={form}
            setForm={setForm as Dispatch<SetStateAction<ProjectFormValues>>}
            fieldErrors={fieldErrors}
            managers={managers}
            showManager={false}
          />
        </Modal>
      ) : null}

      {managerOpen ? (
        <Modal
          title="Cambiar gerente responsable"
          onClose={() => setManagerOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setManagerOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" loading={submitting} onClick={() => void handleAssignManager()}>
                Guardar
              </Button>
            </>
          }
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#F9FAFB]">Gerente responsable</span>
            <select
              value={managerPick}
              onChange={(e) => setManagerPick(e.target.value)}
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
        </Modal>
      ) : null}

      {deleteOpen ? (
        <Modal
          title="Eliminar proyecto"
          onClose={() => setDeleteOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={submitting}
                onClick={() => void handleDelete()}
              >
                Confirmar
              </Button>
            </>
          }
        >
          <p className="text-sm text-[#9CA3AF]">{PROJECT_MESSAGES.deleteConfirm}</p>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#12131C] p-6 shadow-xl">
        <h2 id="modal-title" className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        {children}
        <div className="mt-6 flex justify-end gap-2">{footer}</div>
      </div>
      <button type="button" className="sr-only" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}
