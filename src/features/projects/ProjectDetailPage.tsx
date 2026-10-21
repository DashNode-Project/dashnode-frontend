import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { PATHS } from '@/app/paths';
import {
  addProjectMember,
  deleteProject,
  getProject,
  getProjectHealth,
  listActiveUsers,
  listProjectMembers,
  removeProjectMember,
  updateProject,
  updateProjectStatus,
  type ProjectHealth,
  type ProjectMemberRow,
  type ProjectSummary,
  type ProjectStatus,
} from './api';
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

export default function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormValues, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [statusValue, setStatusValue] = useState<ProjectStatus>('planificacion');
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberPick, setMemberPick] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberCandidates, setMemberCandidates] = useState<{ id: string; name: string }[]>([]);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<ProjectMemberRow | null>(null);
  const [memberFieldError, setMemberFieldError] = useState('');

  const canManage =
    user?.role === 'admin' || (user?.role === 'manager' && project?.manager_id === user.id);
  const isAdmin = user?.role === 'admin';

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
        setForm(toForm(data));
        const [memberRows, healthRow] = await Promise.all([
          listProjectMembers(projectId),
          getProjectHealth(projectId),
        ]);
        if (cancelled) return;
        setMembers(memberRows);
        setHealth(healthRow);
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

  const refreshMembers = async () => {
    if (!projectId) return;
    setMembers(await listProjectMembers(projectId));
  };

  const openAddMember = async () => {
    setMemberPick('');
    setMemberSearch('');
    setMemberFieldError('');
    setMemberOpen(true);
    try {
      const rows = await listActiveUsers();
      const existingIds = new Set([project?.manager_id, ...members.map((m) => m.user_id)]);
      const availableCandidates = rows
        .filter((u) => u.role !== 'admin' && !existingIds.has(u.id))
        .map((u) => ({ id: u.id, name: u.name }));
      setMemberCandidates(availableCandidates);
    } catch {
      showToast(MESSAGES.loadFailure, 'error');
    }
  };

  const handleAddMember = async () => {
    if (!project) return;
    if (!memberPick) {
      setMemberFieldError(PROJECT_MESSAGES.memberUserRequired);
      return;
    }
    setSubmitting(true);
    try {
      const res = await addProjectMember(project.id, memberPick);
      await refreshMembers();
      setMemberOpen(false);
      showToast(res.message, 'success');
    } catch (error) {
      if (error instanceof ApiError && error.fields?.user_id) {
        setMemberFieldError(error.fields.user_id);
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

  const handleRemoveMember = async () => {
    if (!project || !removeMemberTarget) return;
    setSubmitting(true);
    try {
      const res = await removeProjectMember(project.id, removeMemberTarget.user_id);
      await refreshMembers();
      setRemoveMemberTarget(null);
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

  const filteredCandidates = memberCandidates.filter((c) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-end gap-2">
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
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

      {health ? (
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Progreso', value: `${health.progress_percent}%` },
            { label: 'Velocidad', value: `${health.velocity} pts/sprint` },
            { label: 'Issues abiertos', value: String(health.open_issues) },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-white/6 bg-[#12131C] p-4">
              <p className="text-xs text-[#6B7280]">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#F9FAFB]">{card.value}</p>
            </div>
          ))}
        </section>
      ) : null}

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

      <section className="mt-6 rounded-xl border border-white/6 bg-[#12131C] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#F9FAFB]">Miembros</h2>
          {canManage ? (
            <Button type="button" onClick={() => void openAddMember()}>
              Agregar miembro
            </Button>
          ) : null}
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No hay miembros registrados.</p>
        ) : (
          <ul className="divide-y divide-white/6">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#F9FAFB]">{member.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{member.email}</p>
                </div>
                {canManage && member.user_id !== project.manager_id ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRemoveMemberTarget(member)}
                  >
                    Retirar
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {editOpen ? (
        <ProjectModal
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
            managers={[]}
            showManager={false}
          />
        </ProjectModal>
      ) : null}

      {memberOpen ? (
        <ProjectModal
          title="Agregar miembro"
          onClose={() => setMemberOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setMemberOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" loading={submitting} onClick={() => void handleAddMember()}>
                Agregar
              </Button>
            </>
          }
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#F9FAFB]">Usuario</span>
            <input
              type="search"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="mb-2 h-10 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
            />
            <select
              value={memberPick}
              onChange={(e) => setMemberPick(e.target.value)}
              className="h-10 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
            >
              <option value="">Seleccionar…</option>
              {filteredCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {memberFieldError ? (
              <span className="text-xs text-red-400">{memberFieldError}</span>
            ) : null}
          </label>
        </ProjectModal>
      ) : null}

      {removeMemberTarget ? (
        <ProjectModal
          title="Retirar miembro"
          onClose={() => setRemoveMemberTarget(null)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setRemoveMemberTarget(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={submitting}
                onClick={() => void handleRemoveMember()}
              >
                Confirmar
              </Button>
            </>
          }
        >
          <p className="text-sm text-[#9CA3AF]">{PROJECT_MESSAGES.memberRemoveConfirm}</p>
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
