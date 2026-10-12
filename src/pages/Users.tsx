import React, { useState } from 'react';
import { Plus, MoreVertical, Eye, Edit2, Trash2, UserX, UserCheck, Search, Filter, Shield } from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { Button, Avatar, Badge, RoleBadge, StatusBadge, SearchInput, SectionHeader, Modal, ConfirmModal, Dropdown, Input, Select, Textarea, EmptyState } from '../components/ui';
import { User, UserRole, UserStatus } from '../types';

type Tab = 'all' | 'admin' | 'manager' | 'developer';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return 'Hace <1h';
  if (h < 24) return `Hace ${h}h`;
  if (d === 1) return 'Ayer';
  return `Hace ${d}d`;
}

interface UserFormData {
  name: string; lastName: string; email: string; nickname: string;
  role: UserRole; status: UserStatus; description: string; skills: string;
  github: string; linkedin: string; experience: string;
}

const emptyForm: UserFormData = {
  name: '', lastName: '', email: '', nickname: '', role: 'developer',
  status: 'active', description: '', skills: '', github: '', linkedin: '', experience: '',
};

export default function Users() {
  const { state, dispatch, showToast, navigate } = useApp();
  const { currentUser, users, projects } = state;

  if (!currentUser || currentUser.role !== 'admin') {
    return <AppShell><div className="flex items-center justify-center h-64 text-[#9CA3AF]">Acceso restringido.</div></AppShell>;
  }

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: users.length },
    { id: 'admin', label: 'Admins', count: users.filter(u => u.role === 'admin').length },
    { id: 'manager', label: 'Gerentes', count: users.filter(u => u.role === 'manager').length },
    { id: 'developer', label: 'Desarrolladores', count: users.filter(u => u.role === 'developer').length },
  ];

  const filtered = users.filter(u => {
    const matchTab = tab === 'all' || u.role === tab;
    const q = search.toLowerCase();
    const matchSearch = !search || `${u.name} ${u.lastName} ${u.email} ${u.nickname}`.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  function validate(f: UserFormData) {
    const e: Partial<UserFormData> = {};
    if (!f.name.trim()) e.name = 'Requerido';
    if (!f.lastName.trim()) e.lastName = 'Requerido';
    if (!f.email.trim() || !f.email.includes('@')) e.email = 'Correo inválido';
    if (!f.nickname.trim()) e.nickname = 'Requerido';
    return e;
  }

  function openCreate() {
    setForm(emptyForm);
    setErrors({});
    setCreateOpen(true);
  }

  function openEdit(u: User) {
    setForm({ name: u.name, lastName: u.lastName, email: u.email, nickname: u.nickname, role: u.role, status: u.status, description: u.description ?? '', skills: u.skills.join(', '), github: u.github ?? '', linkedin: u.linkedin ?? '', experience: u.experience ?? '' });
    setErrors({});
    setEditUser(u);
  }

  async function handleCreate() {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) { setErrors({ email: 'Ya existe este correo.' }); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    const newUser: User = {
      id: `u${Date.now()}`, name: form.name, lastName: form.lastName, email: form.email, nickname: form.nickname,
      role: form.role, status: form.status, description: form.description,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      github: form.github, linkedin: form.linkedin, experience: form.experience,
      projectIds: [], lastActivity: new Date().toISOString(), createdAt: new Date().toISOString(),
      tempPassword: true,
    };
    dispatch({ type: 'ADD_USER', user: newUser });
    setSaving(false);
    setCreateOpen(false);
    showToast(`Usuario ${form.name} ${form.lastName} creado correctamente.`);
  }

  async function handleEdit() {
    if (!editUser) return;
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'UPDATE_USER', user: { ...editUser, ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) } });
    setSaving(false);
    setEditUser(null);
    showToast('Usuario actualizado correctamente.');
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'DELETE_USER', userId: deleteUser.id });
    setDeleting(false);
    setDeleteUser(null);
    showToast(`Usuario ${deleteUser.name} ${deleteUser.lastName} eliminado. Tareas pendientes desasignadas.`, 'info');
  }

  function toggleStatus(u: User) {
    const newStatus: UserStatus = u.status === 'active' ? 'disabled' : 'active';
    dispatch({ type: 'UPDATE_USER', user: { ...u, status: newStatus } });
    showToast(`${u.name} ${u.lastName} ${newStatus === 'active' ? 'habilitado' : 'deshabilitado'}.`);
  }

  const UserForm = () => (
    <div className="grid grid-cols-2 gap-4">
      <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
      <Input label="Apellido *" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} error={errors.lastName} />
      <Input label="Correo electrónico *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} className="col-span-2" />
      <Input label="Nickname *" placeholder="sin espacios" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} error={errors.nickname} />
      <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} options={[{ value: 'admin', label: 'Administrador' }, { value: 'manager', label: 'Gerente' }, { value: 'developer', label: 'Desarrollador' }]} />
      <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as UserStatus }))} options={[{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }, { value: 'disabled', label: 'Deshabilitado' }]} />
      <Input label="GitHub" placeholder="github.com/usuario" value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} />
      <Input label="LinkedIn" placeholder="linkedin.com/in/usuario" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
      <div className="col-span-2">
        <Input label="Habilidades" placeholder="React, Python, Docker (separadas por coma)" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-[#F9FAFB] mb-1.5">Descripción</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Descripción del perfil profesional..."
          className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-blue-500 transition-colors" />
      </div>
      <div className="col-span-2">
        <Input label="Experiencia" placeholder="Años de experiencia..." value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <AppShell title="Usuarios">
      <SectionHeader
        title="Gestión de Usuarios"
        description={`${users.filter(u => u.status === 'active').length} usuarios activos de ${users.length} en total`}
        actions={<Button icon={<Plus size={15} />} onClick={openCreate}>Crear usuario</Button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 h-8 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${tab === t.id ? 'bg-blue-500/15 text-blue-400' : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded ${tab === t.id ? 'bg-blue-500/25 text-blue-300' : 'bg-white/8 text-[#6B7280]'}`}>{t.count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar usuario..." />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Shield size={22} />} title="Sin resultados" description="No hay usuarios que coincidan con los filtros aplicados." />
      ) : (
        <div className="bg-[#12131C] border border-white/6 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden md:table-cell">Rol</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden sm:table-cell">Estado</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden lg:table-cell">Proyectos</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 hidden lg:table-cell">Última actividad</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const userProjects = projects.filter(p => p.memberIds.includes(u.id) || p.managerId === u.id);
                return (
                  <tr key={u.id} className={`border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${u.name} ${u.lastName}`} size={34} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-[#F9FAFB] truncate">{u.name} {u.lastName}</p>
                            {u.tempPassword && <span className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">temp pwd</span>}
                          </div>
                          <p className="text-xs text-[#6B7280] truncate">@{u.nickname} · {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-[#9CA3AF]">{userProjects.length} proyecto{userProjects.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-[#6B7280]">{timeAgo(u.lastActivity)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Dropdown
                        trigger={
                          <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors">
                            <MoreVertical size={15} />
                          </button>
                        }
                        items={[
                          { label: 'Ver perfil', icon: <Eye size={14} />, onClick: () => navigate({ page: 'profile', userId: u.id }) },
                          { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => openEdit(u), disabled: u.id === currentUser.id },
                          {
                            label: u.status === 'active' ? 'Deshabilitar' : 'Habilitar',
                            icon: u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />,
                            onClick: () => toggleStatus(u),
                            disabled: u.id === currentUser.id,
                          },
                          { label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => setDeleteUser(u), danger: true, disabled: u.id === currentUser.id },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Crear nuevo usuario" size="xl"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button loading={saving} onClick={handleCreate}>Crear usuario</Button></>}>
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <p className="text-xs text-amber-400">La contraseña inicial se marcará como temporal. El usuario deberá cambiarla en su primer acceso.</p>
        </div>
        <UserForm />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Editar usuario: ${editUser?.name ?? ''}`} size="xl"
        footer={<><Button variant="secondary" onClick={() => setEditUser(null)}>Cancelar</Button><Button loading={saving} onClick={handleEdit}>Guardar cambios</Button></>}>
        <UserForm />
      </Modal>

      {/* Delete Confirm */}
      {deleteUser && (
        <ConfirmModal
          open={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDelete}
          title={`Eliminar a ${deleteUser.name} ${deleteUser.lastName}`}
          description="Las tareas completadas mantendrán su historial. Las tareas pendientes o en progreso quedarán DESASIGNADAS y deberán ser reasignadas manualmente."
          confirmLabel="Sí, eliminar"
          loading={deleting}
        />
      )}
    </AppShell>
  );
}
