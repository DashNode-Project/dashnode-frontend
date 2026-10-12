import React, { useState } from 'react';
import { Edit2, Globe, Mail, Key, Eye, EyeOff, Check, ArrowLeft, ExternalLink, GitBranch, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { Button, Avatar, Badge, RoleBadge, StatusBadge, Input, Select, Card } from '../components/ui';
import { User, UserRole, WeeklyAvailability, TimeRange } from '../types';

const SKILL_SUGGESTIONS = ['React', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'SQLAlchemy', 'Redis', 'JWT', 'Scrum', 'UX Design', 'Figma', 'Vue.js', 'Node.js'];

const DAY_KEYS: (keyof WeeklyAvailability)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

function parseAvailText(text: string): WeeklyAvailability {
  const result: WeeklyAvailability = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
  const dayMap: Record<string, keyof WeeklyAvailability> = {
    'lunes': 'monday', 'martes': 'tuesday', 'miercoles': 'wednesday', 'miércoles': 'wednesday',
    'jueves': 'thursday', 'viernes': 'friday', 'sabado': 'saturday', 'sábado': 'saturday', 'domingo': 'sunday',
  };
  for (const line of text.split('\n').map(l => l.trim()).filter(Boolean)) {
    const ci = line.indexOf(':');
    if (ci === -1) continue;
    const raw = line.slice(0, ci).trim().toLowerCase();
    const dayKey = dayMap[raw] ?? dayMap[raw.normalize('NFD').replace(/[̀-ͯ]/g, '')];
    if (!dayKey) continue;
    const ranges: TimeRange[] = [];
    for (const part of line.slice(ci + 1).split(',').map(r => r.trim())) {
      const m = part.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
      if (m) ranges.push({ start: m[1].padStart(5, '0'), end: m[2].padStart(5, '0') });
    }
    result[dayKey] = ranges;
  }
  return result;
}

function avToText(av: WeeklyAvailability): string {
  return DAY_KEYS.map(d => {
    const slots = av[d];
    if (!slots || !slots.length) return null;
    return `${DAY_LABELS[d]}: ${slots.map(s => `${s.start}-${s.end}`).join(', ')}`;
  }).filter(Boolean).join('\n');
}

export default function Profile() {
  const { state, dispatch, showToast, navigate } = useApp();
  const { currentUser, users, projects, tasks, nav } = state;

  const profileUserId = nav.userId;
  const viewedUser = profileUserId ? users.find(u => u.id === profileUserId) ?? currentUser : currentUser;
  const isOwnProfile = viewedUser?.id === currentUser?.id;

  if (!viewedUser || !currentUser) return null;

  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('info');
  const [form, setForm] = useState({
    name: viewedUser.name, lastName: viewedUser.lastName, nickname: viewedUser.nickname,
    description: viewedUser.description ?? '', skills: viewedUser.skills.join(', '),
    experience: viewedUser.experience ?? '', github: viewedUser.github ?? '',
    linkedin: viewedUser.linkedin ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Security
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Availability editing (own profile, non-admin)
  const [avText, setAvText] = useState(() =>
    viewedUser?.availability ? avToText(viewedUser.availability) :
    'Lunes: 09:00-12:00, 14:00-18:00\nMartes: 09:00-12:00, 14:00-18:00\nMiércoles: 09:00-12:00\nJueves: 09:00-12:00, 14:00-18:00\nViernes: 09:00-12:00'
  );
  const [avParsed, setAvParsed] = useState<WeeklyAvailability | null>(viewedUser?.availability ?? null);
  const [avError, setAvError] = useState('');

  const userProjects = projects.filter(p => p.memberIds.includes(viewedUser.id) || p.managerId === viewedUser.id);
  const userTasks = tasks.filter(t => t.assigneeId === viewedUser.id);
  const completedTasks = userTasks.filter(t => t.status === 'completed').length;

  async function saveProfile() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({
      type: 'UPDATE_USER',
      user: { ...viewedUser!, ...form, id: viewedUser!.id, email: viewedUser!.email, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) } as import('../types').User,
    });
    setSaving(false);
    setEditing(false);
    showToast('Perfil actualizado correctamente.');
  }

  function changePwd() {
    setPwdError('');
    if (!oldPwd) { setPwdError('Ingresa tu contraseña actual.'); return; }
    if (newPwd.length < 6) { setPwdError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Las contraseñas no coinciden.'); return; }
    setPwdSuccess(true);
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    showToast('Contraseña actualizada. (Simulado — cambio real requiere backend)');
    setTimeout(() => setPwdSuccess(false), 3000);
  }

  const sections = [
    { id: 'info', label: 'Información personal' },
    { id: 'professional', label: 'Info profesional' },
    { id: 'skills', label: 'Habilidades' },
    { id: 'links', label: 'Enlaces' },
    { id: 'projects', label: 'Proyectos' },
    { id: 'tasks', label: 'Tareas' },
    ...(isOwnProfile && viewedUser.role !== 'admin' ? [{ id: 'availability', label: 'Disponibilidad' }] : []),
    ...(isOwnProfile ? [{ id: 'security', label: 'Seguridad' }] : []),
  ];

  return (
    <AppShell title="Perfil">
      {nav.userId && (
        <button onClick={() => navigate({ page: 'users' })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#9CA3AF] mb-4 transition-colors">
          <ArrowLeft size={14} /> Volver a usuarios
        </button>
      )}

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Left panel */}
        <div className="lg:w-64 shrink-0 space-y-4">
          {/* Avatar + name */}
          <Card className="p-5 text-center">
            <div className="flex justify-center mb-3">
              <Avatar name={`${viewedUser.name} ${viewedUser.lastName}`} size={72} />
            </div>
            <h1 className="font-bold text-[#F9FAFB] text-lg">{viewedUser.name} {viewedUser.lastName}</h1>
            <p className="text-sm text-[#9CA3AF]">@{viewedUser.nickname}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <RoleBadge role={viewedUser.role} />
              <StatusBadge status={viewedUser.status} />
            </div>
            {viewedUser.description && (
              <p className="text-xs text-[#9CA3AF] mt-3 leading-relaxed">{viewedUser.description}</p>
            )}
            {isOwnProfile && !editing && (
              <Button variant="secondary" size="sm" className="w-full mt-4" icon={<Edit2 size={13} />} onClick={() => setEditing(true)}>
                Editar perfil
              </Button>
            )}
          </Card>

          {/* Stats */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Proyectos', value: userProjects.length },
                { label: 'Tareas', value: userTasks.length },
                { label: 'Completadas', value: completedTasks },
                { label: '% Completado', value: userTasks.length ? `${Math.round((completedTasks / userTasks.length) * 100)}%` : '—' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold text-[#F9FAFB]">{s.value}</p>
                  <p className="text-xs text-[#6B7280]">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick links */}
          {(viewedUser.github || viewedUser.linkedin) && (
            <Card className="p-4">
              <div className="flex flex-col gap-2">
                {viewedUser.github && (
                  <a href={`https://${viewedUser.github}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
                    <ExternalLink size={14} />{viewedUser.github}
                  </a>
                )}
                {viewedUser.linkedin && (
                  <a href={`https://${viewedUser.linkedin}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
                    <Globe size={14} />{viewedUser.linkedin}
                  </a>
                )}
                <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                  <Mail size={14} />{viewedUser.email}
                </div>
              </div>
            </Card>
          )}

          {/* Nav */}
          <nav className="flex flex-col gap-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${activeSection === s.id ? 'bg-blue-500/15 text-blue-400' : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/4'}`}>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {editing && isOwnProfile ? (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#F9FAFB]">Editar perfil</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <Input label="Apellido" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
                <Input label="Nickname" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#F9FAFB]">Descripción</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                    className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500" />
                </div>
                <Input label="Habilidades (separadas por coma)" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
                <Input label="Experiencia" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
                <Input label="GitHub" placeholder="github.com/usuario" value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} />
                <Input label="LinkedIn" placeholder="linkedin.com/in/usuario" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
                <div className="flex gap-2">
                  <Button loading={saving} onClick={saveProfile} icon={<Check size={14} />}>Guardar cambios</Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {activeSection === 'info' && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-4">Información personal</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Nombre completo', value: `${viewedUser.name} ${viewedUser.lastName}` },
                      { label: 'Correo electrónico', value: viewedUser.email },
                      { label: 'Nickname', value: `@${viewedUser.nickname}` },
                      { label: 'Rol', value: { admin: 'Administrador', manager: 'Gerente', developer: 'Desarrollador' }[viewedUser.role] },
                      { label: 'Estado', value: { active: 'Activo', inactive: 'Inactivo', disabled: 'Deshabilitado' }[viewedUser.status] },
                      { label: 'Miembro desde', value: viewedUser.createdAt.slice(0, 10) },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs text-[#6B7280] mb-1">{f.label}</p>
                        <p className="text-sm text-[#F9FAFB]">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  {viewedUser.description && (
                    <div className="mt-4 pt-4 border-t border-white/6">
                      <p className="text-xs text-[#6B7280] mb-1">Descripción</p>
                      <p className="text-sm text-[#9CA3AF]">{viewedUser.description}</p>
                    </div>
                  )}
                </Card>
              )}

              {activeSection === 'professional' && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-4">Información profesional</h2>
                  {viewedUser.experience ? (
                    <div className="mb-4">
                      <p className="text-xs text-[#6B7280] mb-1">Experiencia</p>
                      <p className="text-sm text-[#9CA3AF]">{viewedUser.experience}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B7280]">Sin información de experiencia.</p>
                  )}
                </Card>
              )}

              {activeSection === 'skills' && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-4">Habilidades</h2>
                  {viewedUser.skills.length === 0 ? (
                    <p className="text-sm text-[#6B7280]">Sin habilidades registradas.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {viewedUser.skills.map(s => <Badge key={s} variant="blue">{s}</Badge>)}
                    </div>
                  )}
                </Card>
              )}

              {activeSection === 'links' && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-4">Enlaces</h2>
                  <div className="flex flex-col gap-3">
                    {viewedUser.github && (
                      <div className="flex items-center gap-3">
                        <GitBranch size={16} className="text-[#9CA3AF]" />
                        <a href={`https://${viewedUser.github}`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">{viewedUser.github}</a>
                      </div>
                    )}
                    {viewedUser.linkedin && (
                      <div className="flex items-center gap-3">
                        <ExternalLink size={16} className="text-[#9CA3AF]" />
                        <a href={`https://${viewedUser.linkedin}`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">{viewedUser.linkedin}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-[#9CA3AF]" />
                      <span className="text-sm text-[#9CA3AF]">{viewedUser.email}</span>
                    </div>
                    {!viewedUser.github && !viewedUser.linkedin && <p className="text-sm text-[#6B7280]">Sin enlaces registrados.</p>}
                  </div>
                </Card>
              )}

              {activeSection === 'projects' && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-4">Proyectos ({userProjects.length})</h2>
                  {userProjects.length === 0 ? (
                    <p className="text-sm text-[#6B7280]">Sin proyectos asignados.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {userProjects.map(p => {
                        const isManager = p.managerId === viewedUser.id;
                        return (
                          <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                              <Globe size={14} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#F9FAFB]">{p.name}</p>
                              <p className="text-xs text-[#6B7280]">{isManager ? 'Responsable funcional' : 'Miembro'}</p>
                            </div>
                            <StatusBadge status={p.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {activeSection === 'tasks' && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-4">Tareas ({userTasks.length})</h2>
                  {userTasks.length === 0 ? (
                    <p className="text-sm text-[#6B7280]">Sin tareas asignadas.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {userTasks.map(t => {
                        const proj = projects.find(p => p.id === t.projectId);
                        return (
                          <div key={t.id} className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0">
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: ({ todo: '#6B7280', 'in-progress': '#3B82F6', 'code-review': '#8B5CF6', testing: '#F59E0B', completed: '#10B981', blocked: '#F97316' } as Record<string, string>)[t.status] ?? '#6B7280' }} />
                            <div className="flex-1">
                              <p className="text-sm text-[#F9FAFB]">{t.title}</p>
                              <p className="text-xs text-[#6B7280]">{proj?.name} · Est. {t.estimatedHours}h</p>
                            </div>
                            <StatusBadge status={t.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {activeSection === 'availability' && isOwnProfile && viewedUser.role !== 'admin' && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-1 flex items-center gap-2">
                    <Clock size={16} className="text-blue-400" />Disponibilidad semanal
                  </h2>
                  <p className="text-sm text-[#9CA3AF] mb-4">
                    Define tus franjas horarias disponibles para reuniones. Los rangos representan horas en las que <strong className="text-[#F9FAFB]">puedes asistir</strong>.
                  </p>
                  <div className="bg-[#0A0B0E] border border-white/6 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs font-mono text-[#6B7280]">Formato:<br />Lunes: 09:00-12:00, 14:00-18:00<br />Miércoles: 14:00-18:00</p>
                  </div>
                  <textarea
                    value={avText}
                    onChange={e => setAvText(e.target.value)}
                    rows={8}
                    placeholder="Lunes: 09:00-12:00, 14:00-18:00&#10;Martes: 09:00-12:00, 14:00-18:00&#10;Miércoles: 09:00-18:00&#10;Jueves: 09:00-12:00, 14:00-18:00&#10;Viernes: 09:00-12:00"
                    className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-blue-500 font-mono transition-colors mb-3"
                  />
                  {avError && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-red-400">
                      <AlertCircle size={12} />{avError}
                    </div>
                  )}
                  <Button
                    icon={<Check size={15} />}
                    onClick={() => {
                      setAvError('');
                      try {
                        const av = parseAvailText(avText);
                        const hasData = DAY_KEYS.some(d => (av[d] ?? []).length > 0);
                        if (!hasData) { setAvError('No se encontraron rangos válidos. Verifica el formato.'); return; }
                        setAvParsed(av);
                        dispatch({ type: 'UPDATE_USER', user: { ...viewedUser!, email: viewedUser!.email, availability: av } as User });
                        showToast('Disponibilidad actualizada.');
                      } catch { setAvError('Error al parsear. Verifica el formato.'); }
                    }}
                  >
                    Validar y guardar
                  </Button>
                  {avParsed && (
                    <div className="mt-5 pt-4 border-t border-white/6">
                      <h3 className="text-sm font-medium text-[#F9FAFB] mb-3">Vista semanal</h3>
                      <div className="overflow-x-auto">
                        <div className="min-w-[400px]">
                          {DAY_KEYS.filter(d => (avParsed[d] ?? []).length > 0).map(d => (
                            <div key={d} className="flex items-start gap-3 mb-2">
                              <span className="text-xs font-medium text-[#9CA3AF] w-24 shrink-0 pt-0.5">{DAY_LABELS[d]}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {avParsed[d].map((s, i) => (
                                  <span key={i} className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                                    {s.start}–{s.end}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {activeSection === 'security' && isOwnProfile && (
                <Card className="p-5">
                  <h2 className="font-semibold text-[#F9FAFB] mb-1">Seguridad</h2>
                  <p className="text-sm text-[#9CA3AF] mb-5">Cambia tu contraseña de acceso.</p>
                  <div className="flex flex-col gap-4 max-w-sm">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[#F9FAFB]">Contraseña actual</label>
                      <div className="relative">
                        <input type={showPwd ? 'text' : 'password'} value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                          className="w-full bg-[#1E1F2B] border border-white/10 rounded-md h-9 px-3 pr-10 text-sm text-[#F9FAFB] focus:outline-none focus:border-blue-500" />
                        <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <Input label="Nueva contraseña" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                    <Input label="Confirmar contraseña" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                    {pwdError && <p className="text-xs text-red-400">{pwdError}</p>}
                    {pwdSuccess && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check size={12} />Contraseña actualizada.</p>}
                    <Button icon={<Key size={14} />} onClick={changePwd} className="w-fit">Cambiar contraseña</Button>
                    {viewedUser.tempPassword && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                        <p className="text-xs text-amber-400">Tu contraseña es temporal. Se recomienda cambiarla ahora.</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
