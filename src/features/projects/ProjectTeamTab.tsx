import { LayoutGrid, List, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Avatar, Card, RoleBadge, SearchInput } from '@/components/ui/demo-ui';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import {
  addProjectMember,
  listActiveUsers,
  listProjectMembers,
  removeProjectMember,
  type ProjectMemberRow,
} from './api';
import { useProjectWorkspace } from './ProjectWorkspaceContext';
import { ProjectModal } from './ProjectModal';
import { PROJECT_MESSAGES } from './messages';

type TeamViewMode = 'grid' | 'table';

function memberRoleLabel(member: ProjectMemberRow, managerId: string): string {
  if (member.user_id === managerId) return 'Gerente del proyecto';
  if (member.role === 'manager') return 'Gerente';
  if (member.role === 'developer') return 'Desarrollador';
  return member.role;
}

export default function ProjectTeamTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { project } = useProjectWorkspace();
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<TeamViewMode>('grid');
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberPick, setMemberPick] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberCandidates, setMemberCandidates] = useState<{ id: string; name: string }[]>([]);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<ProjectMemberRow | null>(null);
  const [previewMember, setPreviewMember] = useState<ProjectMemberRow | null>(null);
  const [memberFieldError, setMemberFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const canManage =
    user?.role === 'admin' || (user?.role === 'manager' && project.manager_id === user.id);

  const refreshMembers = async () => {
    setMembers(await listProjectMembers(project.id));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await listProjectMembers(project.id);
        if (!cancelled) setMembers(rows);
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const roster = useMemo(() => {
    const rows = members.filter((m) => m.role !== 'admin');
    if (project.manager_name && !rows.some((m) => m.user_id === project.manager_id)) {
      rows.unshift({
        user_id: project.manager_id,
        name: project.manager_name,
        email: '',
        role: 'manager',
        joined_at: '',
      });
    }
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, project.manager_id, project.manager_name, debouncedSearch]);

  const openAddMember = async () => {
    setMemberPick('');
    setMemberSearch('');
    setMemberFieldError('');
    setMemberOpen(true);
    try {
      const rows = await listActiveUsers();
      const existingIds = new Set([project.manager_id, ...members.map((m) => m.user_id)]);
      const availableCandidates = rows
        .filter((u) => u.role !== 'admin' && !existingIds.has(u.id))
        .map((u) => ({ id: u.id, name: u.name }));
      setMemberCandidates(availableCandidates);
    } catch {
      showToast(MESSAGES.loadFailure, 'error');
    }
  };

  const filteredCandidates = memberCandidates.filter((c) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q);
  });

  const handleAddMember = async () => {
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
    if (!removeMemberTarget) return;
    setSubmitting(true);
    try {
      const res = await removeProjectMember(project.id, removeMemberTarget.user_id);
      await refreshMembers();
      setRemoveMemberTarget(null);
      setPreviewMember(null);
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

  const viewToggle = (
    <div
      className="inline-flex rounded-lg border border-white/10 bg-[#12131C] p-1"
      role="group"
      aria-label="Vista del equipo"
    >
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
        aria-pressed={viewMode === 'table'}
        onClick={() => setViewMode('table')}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
          viewMode === 'table'
            ? 'bg-blue-500/15 text-blue-400'
            : 'text-[#6B7280] hover:text-[#F9FAFB]'
        }`}
      >
        <List size={14} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#F9FAFB]">Equipo</h2>
        <div className="flex flex-wrap items-center gap-2">
          {viewToggle}
          {canManage ? (
            <Button type="button" onClick={() => void openAddMember()}>
              Agregar miembro
            </Button>
          ) : null}
        </div>
      </div>

      <div className="relative mb-4 min-w-[220px] max-w-md">
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

      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Cargando miembros…</p>
      ) : roster.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">
          {debouncedSearch ? 'No se encontraron miembros con ese criterio.' : 'No hay miembros registrados.'}
        </p>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {roster.map((m) => (
            <Card
              key={m.user_id}
              className={`flex items-center gap-3 p-4 ${
                m.user_id === project.manager_id ? 'ring-1 ring-blue-500/20' : ''
              }`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => setPreviewMember(m)}
              >
                <Avatar name={m.name} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#F9FAFB]">{m.name}</p>
                  <p className="truncate text-xs text-[#9CA3AF]">{m.email || '—'}</p>
                  <p className="mt-1 text-xs text-blue-300">{memberRoleLabel(m, project.manager_id)}</p>
                </div>
              </button>
              {canManage && m.user_id !== project.manager_id ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  title="Retirar miembro del proyecto"
                  onClick={() => setRemoveMemberTarget(m)}
                >
                  Retirar
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#12131C]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-[#0A0B0E] text-xs uppercase tracking-wide text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3 font-medium">Miembro</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Correo</th>
                <th className="px-4 py-3 font-medium">Rol en el proyecto</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {roster.map((m) => (
                <tr key={m.user_id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-3"
                      onClick={() => setPreviewMember(m)}
                    >
                      <Avatar name={m.name} size={32} />
                      <span className="font-medium text-[#F9FAFB]">{m.name}</span>
                    </button>
                  </td>
                  <td className="hidden px-4 py-3 text-[#9CA3AF] md:table-cell">{m.email || '—'}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={m.user_id === project.manager_id ? 'manager' : m.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage && m.user_id !== project.manager_id ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        title="Retirar miembro del proyecto"
                        onClick={() => setRemoveMemberTarget(m)}
                      >
                        Retirar
                      </Button>
                    ) : (
                      <span className="text-xs text-[#6B7280]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
          <p className="text-sm text-[#9CA3AF]">
            {PROJECT_MESSAGES.memberRemoveConfirm}
            {removeMemberTarget.name ? (
              <>
                {' '}
                <span className="text-[#F9FAFB]">{removeMemberTarget.name}</span>
              </>
            ) : null}
          </p>
        </ProjectModal>
      ) : null}

      {previewMember ? (
        <ProjectModal
          title="Detalle del miembro"
          onClose={() => setPreviewMember(null)}
          footer={
            <Button type="button" variant="secondary" onClick={() => setPreviewMember(null)}>
              Cerrar
            </Button>
          }
        >
          <div className="flex items-center gap-3">
            <Avatar name={previewMember.name} size={48} />
            <div>
              <p className="font-medium text-[#F9FAFB]">{previewMember.name}</p>
              <p className="text-sm text-[#9CA3AF]">{previewMember.email || 'Correo no disponible'}</p>
            </div>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <div>
              <dt className="text-xs text-[#6B7280]">Rol en el proyecto</dt>
              <dd className="text-[#F9FAFB]">
                {memberRoleLabel(previewMember, project.manager_id)}
              </dd>
            </div>
            {previewMember.joined_at ? (
              <div>
                <dt className="text-xs text-[#6B7280]">Fecha de incorporación</dt>
                <dd className="text-[#F9FAFB]">
                  {new Date(previewMember.joined_at).toLocaleDateString('es')}
                </dd>
              </div>
            ) : null}
          </dl>
        </ProjectModal>
      ) : null}
    </div>
  );
}