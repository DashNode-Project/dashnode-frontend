import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useParams } from 'react-router';
import { Users } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/demo-ui';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { PATHS, projectTabPath } from '@/app/paths';
import {
  deleteProject,
  getProjectHealth,
  listProjectMembers,
  updateProject,
  updateProjectStatus,
  type ProjectHealth,
  type ProjectMemberRow,
  type ProjectSummary,
  type ProjectStatus,
} from './api';
import { useProjectWorkspace } from './ProjectWorkspaceContext';
import { ProjectModal } from './ProjectModal';
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

function formatCount(value: number | undefined): string {
  return value === undefined ? '—' : String(value);
}

export default function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { project, reload } = useProjectWorkspace();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormValues, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [health, setHealth] = useState<ProjectHealth | null>(null);

  const canManage =
    user?.role === 'admin' || (user?.role === 'manager' && project?.manager_id === user.id);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const memberRows = await listProjectMembers(projectId);
        if (!cancelled) setMembers(memberRows);
      } catch {
        if (!cancelled) setMembers([]);
      }
      try {
        const healthRow = await getProjectHealth(projectId);
        if (!cancelled) setHealth(healthRow);
      } catch {
        if (!cancelled) setHealth(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const teamPreview = useMemo(() => {
    const rows = [...members];
    if (project.manager_name && !rows.some((m) => m.user_id === project.manager_id)) {
      rows.unshift({
        user_id: project.manager_id,
        name: project.manager_name,
        email: '',
        role: 'manager',
        joined_at: '',
      });
    }
    return rows.filter((m) => m.role !== 'admin');
  }, [members, project.manager_id, project.manager_name]);

  const handleSaveEdit = async () => {
    if (!form || !project) return;
    const errors = validateProjectForm({ ...form, managerId: project.manager_id });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      await updateProject(project.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        priority: form.priority as ProjectSummary['priority'],
        tech_stack: parseTechStack(form.techStackInput),
        meeting_link: form.meetingLink.trim() || null,
      });
      setEditOpen(false);
      reload();
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
    try {
      const res = await updateProjectStatus(project.id, next);
      reload();
      showToast(res.message, 'success');
    } catch (error) {
      reload();
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
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

  const healthCards = [
    { label: 'Progreso', value: health ? `${health.progress_percent}%` : '—' },
    { label: 'Velocidad', value: health ? `${health.velocity} pts/sprint` : '—' },
    { label: 'Issues abiertos', value: health ? String(health.open_issues) : '—' },
    { label: 'Historias de usuario', value: formatCount(health?.user_stories_count) },
    { label: 'Tareas', value: formatCount(health?.tasks_count) },
    {
      label: 'Puntos de historia',
      value:
        health?.total_story_points !== undefined
          ? `${health.completed_story_points ?? 0} / ${health.total_story_points}`
          : '—',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-end gap-2">
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm(toForm(project));
                setEditOpen(true);
              }}
            >
              Editar proyecto
            </Button>
          ) : null}
          {isAdmin ? (
            <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
              Eliminar proyecto
            </Button>
          ) : null}
        </div>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {healthCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/6 bg-[#12131C] p-4">
            <p className="text-xs text-[#6B7280]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#F9FAFB]">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-white/6 bg-[#12131C] p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#6B7280]">Estado</dt>
            <dd className="mt-1">
              {canManage ? (
                <select
                  value={project.status}
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

      <section className="mt-6 rounded-xl border border-white/6 bg-[#12131C] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#9CA3AF]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[#F9FAFB]">Equipo</h2>
          </div>
          <Link
            to={projectTabPath(project.id, 'equipo')}
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Ver equipo
          </Link>
        </div>
        {teamPreview.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No hay miembros registrados.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-[#9CA3AF]">
              {teamPreview.length} {teamPreview.length === 1 ? 'miembro' : 'miembros'} en el
              proyecto
              {project.manager_name ? (
                <>
                  {' '}
                  · Gerente: <span className="text-[#F9FAFB]">{project.manager_name}</span>
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {teamPreview.slice(0, 8).map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-2 rounded-lg border border-white/6 bg-[#0A0B0E]/50 px-2 py-1.5"
                  title={member.name}
                >
                  <Avatar name={member.name} size={28} />
                  <span className="max-w-[120px] truncate text-xs text-[#F9FAFB]">
                    {member.name}
                  </span>
                </div>
              ))}
              {teamPreview.length > 8 ? (
                <span className="text-xs text-[#6B7280]">+{teamPreview.length - 8} más</span>
              ) : null}
            </div>
          </>
        )}
      </section>

      {editOpen && form ? (
        <ProjectModal
          title="Editar proyecto"
          onClose={() => {
            setEditOpen(false);
            setForm(null);
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditOpen(false);
                  setForm(null);
                }}
              >
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
            managers={[]}
            showManager={false}
          />
        </ProjectModal>
      ) : null}

      {deleteOpen ? (
        <ProjectModal
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
        </ProjectModal>
      ) : null}
    </div>
  );
}
