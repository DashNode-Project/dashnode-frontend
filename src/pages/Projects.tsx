import React, { useState } from 'react';
import { Plus, FolderOpen, Users, Calendar, MoreVertical, Edit2, Archive, Trash2, ArrowRight, Search, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { Button, Avatar, StatusBadge, SearchInput, SectionHeader, Modal, ConfirmModal, Dropdown, Input, Select, EmptyState, Card } from '../components/ui';
import { Project, ProjectStatus } from '../types';

interface ProjectForm {
  name: string; description: string; objective: string;
  managerId: string; status: ProjectStatus; meetingLink: string; endDate: string;
}

const emptyForm: ProjectForm = {
  name: '', description: '', objective: '', managerId: '', status: 'planning', meetingLink: '', endDate: '',
};

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: '#10B981', planning: '#8B5CF6', completed: '#3B82F6', archived: '#6B7280', 'on-hold': '#F59E0B',
};

export default function Projects() {
  const { state, dispatch, showToast, navigate } = useApp();
  const { currentUser, users, projects, tasks, meetings } = state;
  if (!currentUser) return null;

  const role = currentUser.role;
  const canCreate = role === 'admin' || role === 'manager';

  const myProjects = role === 'admin' ? projects : projects.filter(p =>
    p.managerId === currentUser.id || p.memberIds.includes(currentUser.id)
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<ProjectForm>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const managers = users.filter(u => u.role === 'admin' || u.role === 'manager');

  const filtered = myProjects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || `${p.name} ${p.description}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function validate(f: ProjectForm) {
    const e: Partial<ProjectForm> = {};
    if (!f.name.trim()) e.name = 'El nombre es requerido.';
    if (!f.description.trim()) e.description = 'La descripción es requerida.';
    if (!f.managerId) e.managerId = 'Selecciona un responsable.';
    return e;
  }

  function openCreate() {
    setForm({ ...emptyForm, managerId: currentUser!.id });
    setErrors({});
    setCreateOpen(true);
  }

  function openEdit(p: Project) {
    setForm({ name: p.name, description: p.description, objective: p.objective, managerId: p.managerId, status: p.status, meetingLink: p.meetingLink ?? '', endDate: p.endDate ?? '' });
    setErrors({});
    setEditProject(p);
  }

  async function handleCreate() {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    const p: Project = {
      id: `p${Date.now()}`, ...form, memberIds: [form.managerId],
      startDate: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString(), tags: [],
    };
    dispatch({ type: 'ADD_PROJECT', project: p });
    setSaving(false); setCreateOpen(false);
    showToast(`Proyecto "${form.name}" creado.`);
  }

  async function handleEdit() {
    if (!editProject) return;
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'UPDATE_PROJECT', project: { ...editProject, ...form } });
    setSaving(false); setEditProject(null);
    showToast('Proyecto actualizado.');
  }

  async function handleDelete() {
    if (!deleteProject) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'DELETE_PROJECT', projectId: deleteProject.id });
    setDeleting(false); setDeleteProject(null);
    showToast('Proyecto eliminado.', 'info');
  }

  function archiveProject(p: Project) {
    dispatch({ type: 'UPDATE_PROJECT', project: { ...p, status: 'archived' } });
    showToast(`Proyecto "${p.name}" archivado.`, 'info');
  }

  const ProjectForm = () => (
    <div className="flex flex-col gap-4">
      <Input label="Nombre del proyecto *" placeholder="e.g. Sistema de Inventarios" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#F9FAFB]">Descripción *</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Descripción general del proyecto..."
          className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-blue-500 transition-colors" />
        {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#F9FAFB]">Objetivo</label>
        <textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={2} placeholder="Objetivo estratégico del proyecto..."
          className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-blue-500 transition-colors" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Responsable funcional *" value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} error={errors.managerId}
          options={[{ value: '', label: 'Seleccionar...' }, ...managers.map(m => ({ value: m.id, label: `${m.name} ${m.lastName}` }))]} />
        <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
          options={[{ value: 'planning', label: 'Planificación' }, { value: 'active', label: 'Activo' }, { value: 'on-hold', label: 'En Pausa' }, { value: 'completed', label: 'Completado' }, { value: 'archived', label: 'Archivado' }]} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Enlace de reunión" type="url" placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} />
        <Input label="Fecha de fin estimada" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <AppShell title="Proyectos">
      <SectionHeader
        title="Proyectos"
        description={`${myProjects.filter(p => p.status === 'active').length} activos de ${myProjects.length} en total`}
        actions={canCreate ? <Button icon={<Plus size={15} />} onClick={openCreate}>Nuevo proyecto</Button> : undefined}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar proyecto..." />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="h-9 px-3 bg-[#1E1F2B] border border-white/10 rounded-md text-sm text-[#9CA3AF] focus:outline-none focus:border-blue-500"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}>
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="planning">Planificación</option>
          <option value="on-hold">En Pausa</option>
          <option value="completed">Completado</option>
          <option value="archived">Archivado</option>
        </select>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setViewMode('grid')} className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-blue-500/15 text-blue-400' : 'text-[#6B7280] hover:text-[#F9FAFB]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button onClick={() => setViewMode('list')} className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-blue-500/15 text-blue-400' : 'text-[#6B7280] hover:text-[#F9FAFB]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={22} />}
          title="No hay proyectos"
          description={canCreate ? 'Crea el primer proyecto para comenzar.' : 'No tienes proyectos asignados.'}
          action={canCreate ? <Button icon={<Plus size={15} />} onClick={openCreate}>Crear proyecto</Button> : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const manager = users.find(u => u.id === p.managerId);
            const projTasks = tasks.filter(t => t.projectId === p.id);
            const done = projTasks.filter(t => t.status === 'completed').length;
            const projMeetings = meetings.filter(m => m.projectId === p.id);
            const canEdit = role === 'admin' || p.managerId === currentUser.id;
            return (
              <div key={p.id} className="bg-[#12131C] border border-white/6 rounded-xl overflow-hidden hover:border-white/12 transition-colors group relative">
                <div className="h-0.5 w-full" style={{ background: STATUS_COLORS[p.status] }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${STATUS_COLORS[p.status]}15` }}>
                        <FolderOpen size={15} style={{ color: STATUS_COLORS[p.status] }} />
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    {canEdit && (
                      <Dropdown
                        trigger={<button className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/8 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={14} /></button>}
                        items={[
                          { label: 'Abrir workspace', icon: <ArrowRight size={14} />, onClick: () => navigate({ page: 'project-workspace', projectId: p.id }) },
                          { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => openEdit(p) },
                          { label: 'Archivar', icon: <Archive size={14} />, onClick: () => archiveProject(p), disabled: p.status === 'archived' },
                          { label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => setDeleteProject(p), danger: true },
                        ]}
                      />
                    )}
                  </div>
                  <button className="text-left w-full" onClick={() => navigate({ page: 'project-workspace', projectId: p.id })}>
                    <h3 className="font-semibold text-[#F9FAFB] mb-1 group-hover:text-blue-400 transition-colors">{p.name}</h3>
                    <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-4">{p.description}</p>
                  </button>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
                    <span className="flex items-center gap-1"><Users size={12} />{p.memberIds.length}</span>
                    <span className="flex items-center gap-1"><CheckCircle size={12} />{done}/{projTasks.length}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} />{projMeetings.length}</span>
                  </div>
                  {manager && (
                    <div className="flex items-center gap-2 pt-3 border-t border-white/6">
                      <Avatar name={`${manager.name} ${manager.lastName}`} size={22} />
                      <span className="text-xs text-[#9CA3AF]">{manager.name} {manager.lastName}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#12131C] border border-white/6 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Proyecto</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden md:table-cell">Estado</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden md:table-cell">Responsable</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden lg:table-cell">Miembros</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden lg:table-cell">Tareas</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const manager = users.find(u => u.id === p.managerId);
                const projTasks = tasks.filter(t => t.projectId === p.id);
                const done = projTasks.filter(t => t.status === 'completed').length;
                const canEdit = role === 'admin' || p.managerId === currentUser.id;
                return (
                  <tr key={p.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-3 text-left group" onClick={() => navigate({ page: 'project-workspace', projectId: p.id })}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${STATUS_COLORS[p.status]}15` }}>
                          <FolderOpen size={14} style={{ color: STATUS_COLORS[p.status] }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#F9FAFB] group-hover:text-blue-400 transition-colors">{p.name}</p>
                          <p className="text-xs text-[#6B7280] truncate max-w-[200px]">{p.description}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {manager && <div className="flex items-center gap-2"><Avatar name={`${manager.name} ${manager.lastName}`} size={24} /><span className="text-sm text-[#9CA3AF]">{manager.name}</span></div>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-sm text-[#9CA3AF]">{p.memberIds.length}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-sm text-[#9CA3AF]">{done}/{projTasks.length}</span></td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <Dropdown
                          trigger={<button className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/8"><MoreVertical size={14} /></button>}
                          items={[
                            { label: 'Abrir', icon: <ArrowRight size={14} />, onClick: () => navigate({ page: 'project-workspace', projectId: p.id }) },
                            { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => openEdit(p) },
                            { label: 'Archivar', icon: <Archive size={14} />, onClick: () => archiveProject(p) },
                            { label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => setDeleteProject(p), danger: true },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo proyecto" size="lg"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button loading={saving} onClick={handleCreate}>Crear proyecto</Button></>}>
        <ProjectForm />
      </Modal>

      <Modal open={!!editProject} onClose={() => setEditProject(null)} title={`Editar: ${editProject?.name ?? ''}`} size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditProject(null)}>Cancelar</Button><Button loading={saving} onClick={handleEdit}>Guardar</Button></>}>
        <ProjectForm />
      </Modal>

      {deleteProject && (
        <ConfirmModal open={!!deleteProject} onClose={() => setDeleteProject(null)} onConfirm={handleDelete}
          title={`Eliminar "${deleteProject.name}"`}
          description="Esta acción eliminará el proyecto permanentemente. El backlog, las reuniones y los datos asociados se perderán."
          confirmLabel="Eliminar proyecto" loading={deleting} />
      )}
    </AppShell>
  );
}
