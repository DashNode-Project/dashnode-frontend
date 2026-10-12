// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  ArrowLeft, Users, FolderOpen, Target, Video, FileText, BarChart2, Bug, BookOpen,
  Plus, Edit2, Trash2, UserMinus, UserPlus, CheckCircle, Clock, AlertCircle,
  ExternalLink, Copy, ChevronRight, Layers, MessageSquare, Brain, Mic, MicOff, Send,
  Download, Upload, GitBranch, Shield, Cpu, Activity, CheckSquare, XCircle,
  AlertTriangle, Image, Film, Link, FileCode, Eye, ThumbsUp, ThumbsDown, Search,
  ChevronDown, History, DollarSign, Wrench, Play,
} from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { Button, Avatar, Badge, StatusBadge, PriorityBadge, Tabs, Modal, ConfirmModal, Input, Select, Textarea, EmptyState, ProgressBar, Card, SectionHeader, Dropdown } from '../components/ui';
import { Epic, UserStory, Task, Sprint, Document, Fix, Evidence, AIAnalysis, KnowledgeEntry } from '../types';

const TABS = [
  { id: 'overview', label: 'Resumen', icon: <Layers size={14} /> },
  { id: 'team', label: 'Equipo', icon: <Users size={14} /> },
  { id: 'backlog', label: 'Backlog', icon: <FolderOpen size={14} /> },
  { id: 'sprints', label: 'Sprints', icon: <Target size={14} /> },
  { id: 'kanban', label: 'Kanban', icon: <Layers size={14} /> },
  { id: 'meetings', label: 'Reuniones', icon: <Video size={14} /> },
  { id: 'docs', label: 'Documentación', icon: <FileText size={14} /> },
  { id: 'metrics', label: 'Indicadores', icon: <BarChart2 size={14} /> },
  { id: 'fixes', label: 'Fixes', icon: <Wrench size={14} /> },
  { id: 'knowledge', label: 'Conocimiento', icon: <BookOpen size={14} /> },
  { id: 'devops', label: 'DevOps', icon: <GitBranch size={14} /> },
  { id: 'ai-metrics', label: 'Métricas IA', icon: <Activity size={14} /> },
];

function TaskStatusColor(s: string) {
  return {
    todo: '#6B7280', 'in-progress': '#3B82F6', 'code-review': '#8B5CF6',
    testing: '#F59E0B', completed: '#10B981', fixing: '#F97316',
  }[s] ?? '#6B7280';
}

function TaskStatusLabel(s: string) {
  return {
    todo: 'Por hacer', 'in-progress': 'En progreso', 'code-review': 'Code Review',
    testing: 'Testing', completed: 'Completado', fixing: 'En corrección',
  }[s] ?? s;
}

export default function ProjectWorkspace() {
  const { state, dispatch, navigate, showToast } = useApp();
  const { currentUser, projects, users, epics, stories, tasks, sprints, meetings, documents, knowledge, fixes, evidences, aiAnalyses, auditLogs, aiInteractions, pipelineRuns } = state;
  const projectId = state.nav.projectId;

  const [activeTab, setActiveTab] = useState(state.nav.projectTab ?? 'overview');

  if (!currentUser) return null;

  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-[#9CA3AF]">Proyecto no encontrado.</p>
          <Button variant="secondary" onClick={() => navigate({ page: 'projects' })}>Volver a proyectos</Button>
        </div>
      </AppShell>
    );
  }

  const role = currentUser.role;
  const isManager = role === 'admin' || project.managerId === currentUser.id;

  const projEpics = epics.filter(e => e.projectId === projectId);
  const projStories = stories.filter(s => s.projectId === projectId);
  const projTasks = tasks.filter(t => t.projectId === projectId);
  const projSprints = sprints.filter(s => s.projectId === projectId);
  const projMeetings = meetings.filter(m => m.projectId === projectId);
  const projFixes = fixes.filter(f => f.projectId === projectId);
  const projDocs = documents.filter(d => d.projectId === projectId);
  const projKnowledge = knowledge.filter(k => k.projectId === projectId);
  const projPipelines = pipelineRuns.filter(r => r.projectId === projectId);
  const projAIInteractions = aiInteractions.filter(a => a.projectId === projectId);
  const projAuditLogs = auditLogs.filter(a => a.projectId === projectId);

  const manager = users.find(u => u.id === project.managerId);
  const members = users.filter(u => project.memberIds.includes(u.id));

  const tabsWithBadges = TABS.map(t => ({
    ...t,
    badge: t.id === 'backlog' ? projStories.length :
           t.id === 'fixes' ? projFixes.filter(f => f.status === 'open' || f.status === 'in-progress').length :
           undefined,
  }));

  // ── EXPORT / IMPORT ──────────────────────────────────────────────────────
  function exportBacklog() {
    const backlogData = {
      projectId: project.id,
      epics: projEpics,
      userStories: projStories.map(s => ({ ...s, tasks: projTasks.filter(t => t.storyId === s.id) })),
      tasks: projTasks,
    };
    const blob = new Blob([`const backlogData = ${JSON.stringify(backlogData, null, 2)};\nmodule.exports = backlogData;`], { type: 'application/javascript' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `backlog_${project.id}.js`; a.click();
    showToast('Backlog exportado.', 'success');
  }

  function exportProjectInfo() {
    const projectInfo = {
      project: { name: project.name, description: project.description, objective: project.objective, status: project.status, startDate: project.startDate, endDate: project.endDate, tags: project.tags },
      team: members.map(m => ({ name: `${m.name} ${m.lastName}`, role: m.role, email: m.email })),
      roles: ['Gerente', 'Desarrollador', 'Administrador'],
      legalFramework: 'Ley 1581 de 2012 (Protección de Datos), Ley 527 de 1999 (Comercio Electrónico)',
      designPatterns: ['Repository Pattern', 'RBAC', 'Observer', 'Strategy'],
      devOps: { cicd: 'GitHub Actions', linting: ['ESLint', 'Ruff', 'MyPy'], testing: ['Pytest', 'Vitest'], security: ['Trivy', 'JWT'], deployment: 'Docker + Staging' },
      qualityAttributes: [
        { name: 'Funcionalidad', iso: 'ISO 25010:2023', description: 'Completitud y corrección funcional' },
        { name: 'Fiabilidad', iso: 'ISO 25010:2023', description: 'Disponibilidad y tolerancia a fallos' },
        { name: 'Usabilidad', iso: 'ISO 25010:2023', description: 'Operabilidad y protección ante errores del usuario' },
        { name: 'Eficiencia', iso: 'ISO 25010:2023', description: 'Comportamiento en el tiempo y uso de recursos' },
        { name: 'Seguridad', iso: 'ISO 25010:2023', description: 'Confidencialidad, integridad, autenticidad' },
        { name: 'Mantenibilidad', iso: 'ISO 25010:2023', description: 'Modularidad, capacidad de prueba, modificabilidad' },
      ],
      securityMeasures: ['JWT Auth + refresh tokens', 'RBAC por roles', 'Cifrado bcrypt', 'HTTPS obligatorio', 'Rate limiting', 'Input sanitization'],
    };
    const blob = new Blob([`const projectInfo = ${JSON.stringify(projectInfo, null, 2)};\nmodule.exports = projectInfo;`], { type: 'application/javascript' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `project_info_${project.id}.js`; a.click();
    showToast('Información del proyecto exportada.', 'success');
  }

  function importBacklog(file: File) {
    const hasActive = projSprints.some(s => s.status === 'active');
    if (hasActive) { showToast('No se puede importar: el proyecto tiene un sprint activo.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = (e.target?.result as string) || '';
        const jsonMatch = text.match(/=\s*(\{[\s\S]*\});?/);
        if (!jsonMatch) throw new Error('Formato no reconocido');
        const data = JSON.parse(jsonMatch[1]);
        const source = data.backlogData || data.BACKLOG_DATA || data;
        if (source.userStories) {
          const newEpics = (source.epics || []).map(ep => ({ ...ep, projectId }));
          const newStories = source.userStories.map(s => {
            const { tasks: _, ...story } = s;
            return { ...story, projectId, createdAt: new Date().toISOString() };
          });
          const newTasks = source.userStories.flatMap(s => (s.tasks || []).map(t => ({ ...t, projectId, storyId: s.id, loggedHours: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })));
          const newSprints = (source.sprints || []).map(sp => ({ ...sp, projectId }));
          dispatch({ type: 'IMPORT_PROJECT', project, epics: newEpics, stories: newStories, tasks: newTasks, sprints: newSprints });
          showToast(`Backlog importado: ${newStories.length} HU, ${newTasks.length} tareas.`, 'success');
        } else {
          showToast('Formato de backlog no reconocido.', 'error');
        }
      } catch (err) {
        showToast('Error al leer el archivo. Verifica el formato.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function importProjectInfo(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = (e.target?.result as string) || '';
        const jsonMatch = text.match(/=\s*(\{[\s\S]*\});?/);
        if (!jsonMatch) throw new Error('Formato no reconocido');
        const data = JSON.parse(jsonMatch[1]);
        const source = data.projectInfo || data.project || data;
        const proj = source.project || source;
        dispatch({ type: 'UPDATE_PROJECT', project: { ...project, description: proj.description ?? project.description, tags: proj.tags ?? project.tags, objective: proj.objective ?? project.objective } });
        showToast('Información del proyecto importada.', 'success');
      } catch (err) {
        showToast('Error al leer el archivo. Verifica el formato.', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  function OverviewTab() {
    const activeSprint = projSprints.find(s => s.status === 'active');
    const completedTasks = projTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = projTasks.filter(t => t.status === 'in-progress').length;
    const fixingTasks = projTasks.filter(t => t.status === 'fixing').length;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Historias', value: projStories.length, icon: <FolderOpen size={16} className="text-blue-400" />, sub: `${projStories.filter(s => s.status === 'completed').length} completadas` },
            { label: 'Tareas', value: projTasks.length, icon: <CheckCircle size={16} className="text-emerald-400" />, sub: `${completedTasks} completadas` },
            { label: 'Sprints', value: projSprints.length, icon: <Target size={16} className="text-violet-400" />, sub: activeSprint ? '1 activo' : 'Sin sprint activo' },
            { label: 'Fixes activos', value: projFixes.filter(f => f.status === 'open' || f.status === 'in-progress').length, icon: <AlertCircle size={16} className="text-amber-400" />, sub: `${projFixes.length} total` },
          ].map(s => (
            <div key={s.label} className="bg-[#1E1F2B] border border-white/6 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">{s.icon}<span className="text-xs text-[#6B7280]">{s.sub}</span></div>
              <p className="text-2xl font-bold text-[#F9FAFB]">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Project info */}
          <Card className="p-5">
            <h3 className="font-semibold text-[#F9FAFB] mb-4">Información del proyecto</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Descripción</p>
                <p className="text-sm text-[#9CA3AF]">{project.description}</p>
              </div>
              {project.objective && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Objetivo</p>
                  <p className="text-sm text-[#9CA3AF]">{project.objective}</p>
                </div>
              )}
              <div className="flex items-center gap-4 pt-2 border-t border-white/6">
                <div>
                  <p className="text-xs text-[#6B7280]">Inicio</p>
                  <p className="text-sm text-[#F9FAFB]">{project.startDate}</p>
                </div>
                {project.endDate && (
                  <div>
                    <p className="text-xs text-[#6B7280]">Fin estimado</p>
                    <p className="text-sm text-[#F9FAFB]">{project.endDate}</p>
                  </div>
                )}
              </div>
              {project.meetingLink && (
                <div className="flex items-center gap-2">
                  <a href={project.meetingLink} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Video size={12} /> Enlace de reunión <ExternalLink size={10} />
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(project.meetingLink ?? ''); showToast('Enlace copiado.'); }}
                    className="text-[#6B7280] hover:text-[#9CA3AF]"><Copy size={12} /></button>
                </div>
              )}
            </div>
          </Card>

          {/* Active sprint */}
          {activeSprint ? (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#F9FAFB]">Sprint activo</h3>
                <Badge variant="blue">Activo</Badge>
              </div>
              <p className="font-medium text-[#F9FAFB] mb-1">{activeSprint.name}</p>
              <p className="text-sm text-[#9CA3AF] mb-4">{activeSprint.goal}</p>
              {(() => {
                const sprintStories = projStories.filter(s => s.sprintId === activeSprint.id);
                const done = sprintStories.filter(s => s.status === 'completed').length;
                const pct = sprintStories.length ? Math.round((done / sprintStories.length) * 100) : 0;
                return (
                  <>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[#9CA3AF]">{done}/{sprintStories.length} historias</span>
                      <span className="font-bold text-blue-400">{pct}%</span>
                    </div>
                    <ProgressBar value={done} max={sprintStories.length || 1} />
                    <p className="text-xs text-[#6B7280] mt-3">Finaliza: {activeSprint.endDate}</p>
                  </>
                );
              })()}
            </Card>
          ) : (
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              <Target size={32} className="text-[#374151] mb-3" />
              <p className="text-sm text-[#6B7280]">Sin sprint activo</p>
              {isManager && <Button variant="secondary" size="sm" className="mt-3" onClick={() => setActiveTab('sprints')}>Planificar sprint</Button>}
            </Card>
          )}
        </div>

        {/* Tasks by status */}
        <Card className="p-5">
          <h3 className="font-semibold text-[#F9FAFB] mb-4">Distribución de tareas</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Por hacer', count: projTasks.filter(t => t.status === 'todo').length, color: '#6B7280' },
              { label: 'En progreso', count: inProgressTasks, color: '#3B82F6' },
              { label: 'Completadas', count: completedTasks, color: '#10B981' },
              { label: 'En corrección', count: fixingTasks, color: '#F97316' },
            ].map(s => (
              <div key={s.label} className="bg-[#1E1F2B] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ── TEAM ─────────────────────────────────────────────────────────────────
  function TeamTab() {
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const nonMembers = users.filter(u => !project.memberIds.includes(u.id) && u.status === 'active');

    function addMember() {
      if (!selectedUser) return;
      dispatch({ type: 'UPDATE_PROJECT', project: { ...project!, memberIds: [...project!.memberIds, selectedUser] } });
      const selUser = users.find(u => u.id === selectedUser)!;
      dispatch({ type: 'UPDATE_USER', user: { ...selUser, projectIds: [...(selUser.projectIds ?? []), projectId!] } });
      setAddMemberOpen(false);
      showToast('Miembro agregado al proyecto.');
    }

    function removeMember(uid: string) {
      if (uid === project!.managerId) { showToast('No se puede retirar al responsable funcional sin reasignar.', 'error'); return; }
      dispatch({ type: 'UPDATE_PROJECT', project: { ...project!, memberIds: project!.memberIds.filter(id => id !== uid) } });
      showToast('Miembro retirado del proyecto.', 'info');
    }

    const memberTasks = (uid: string) => projTasks.filter(t => t.assigneeId === uid);

    return (
      <div className="space-y-4">
        {isManager && (
          <div className="flex justify-end">
            <Button icon={<UserPlus size={15} />} onClick={() => setAddMemberOpen(true)}>Agregar miembro</Button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => {
            const mt = memberTasks(m.id);
            const done = mt.filter(t => t.status === 'completed').length;
            const isManagerMember = m.id === project.managerId;
            return (
              <Card key={m.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={`${m.name} ${m.lastName}`} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-[#F9FAFB]">{m.name} {m.lastName}</p>
                      {isManagerMember && <Badge variant="blue">Responsable</Badge>}
                    </div>
                    <p className="text-xs text-[#6B7280]">@{m.nickname}</p>
                  </div>
                  {isManager && !isManagerMember && (
                    <button onClick={() => removeMember(m.id)} className="text-[#6B7280] hover:text-red-400 transition-colors p-1">
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {m.skills.slice(0, 3).map(s => <Badge key={s} variant="gray">{s}</Badge>)}
                </div>
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>{mt.length} tareas asignadas</span>
                  <span className="text-emerald-400">{done} completadas</span>
                </div>
                {mt.length > 0 && <ProgressBar value={done} max={mt.length} size="sm" className="mt-2" />}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/6">
                  <div className="flex-1">
                    <div className="flex gap-1">
                      <div className="h-1.5 rounded-full" style={{ flex: mt.filter(t => t.status === 'completed').length || 1, background: '#10B981' }} />
                      <div className="h-1.5 rounded-full" style={{ flex: mt.filter(t => t.status === 'in-progress').length || 0, background: '#3B82F6' }} />
                      <div className="h-1.5 rounded-full" style={{ flex: mt.filter(t => t.status === 'fixing').length || 0, background: '#F97316' }} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Modal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Agregar miembro al proyecto" size="sm"
          footer={<><Button variant="secondary" onClick={() => setAddMemberOpen(false)}>Cancelar</Button><Button onClick={addMember} disabled={!selectedUser}>Agregar</Button></>}>
          <Select label="Seleccionar usuario" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
            options={[{ value: '', label: 'Seleccionar...' }, ...nonMembers.map(u => ({ value: u.id, label: `${u.name} ${u.lastName} (${u.role})` }))]} />
        </Modal>
      </div>
    );
  }

  // ── BACKLOG ───────────────────────────────────────────────────────────────
  function BacklogTab() {
    const [expandedEpic, setExpandedEpic] = useState<string | null>(projEpics[0]?.id ?? null);
    const [addStoryEpic, setAddStoryEpic] = useState<string | null>(null);
    const [storyForm, setStoryForm] = useState({ title: '', description: '', priority: 'medium', points: '3' });
    const [createEpicOpen, setCreateEpicOpen] = useState(false);
    const [epicForm, setEpicForm] = useState({ name: '', description: '', color: '#3B82F6' });

    const EPIC_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

    function saveEpic() {
      if (!epicForm.name.trim()) return;
      dispatch({ type: 'ADD_EPIC', epic: { id: `e${Date.now()}`, projectId: projectId!, name: epicForm.name, description: epicForm.description, status: 'planned', color: epicForm.color } });
      setCreateEpicOpen(false);
      setEpicForm({ name: '', description: '', color: '#3B82F6' });
      showToast('Épica creada.');
    }

    function saveStory() {
      if (!storyForm.title.trim() || !addStoryEpic) return;
      const s: UserStory = {
        id: `s${Date.now()}`, epicId: addStoryEpic, projectId: projectId!,
        title: storyForm.title, description: storyForm.description,
        acceptanceCriteria: [], priority: storyForm.priority as any, points: parseInt(storyForm.points) || 0,
        status: 'todo', createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_STORY', story: s });
      setAddStoryEpic(null);
      setStoryForm({ title: '', description: '', priority: 'medium', points: '3' });
      showToast('Historia de usuario creada.');
    }

    return (
      <div className="space-y-4">
        {isManager && (
          <div className="flex justify-end">
            <Button icon={<Plus size={15} />} size="sm" onClick={() => setCreateEpicOpen(true)}>Nueva épica</Button>
          </div>
        )}

        {projEpics.length === 0 ? (
          <EmptyState icon={<Layers size={20} />} title="Sin épicas" description="Crea la primera épica para organizar el backlog." />
        ) : (
          projEpics.map(epic => {
            const epicStories = projStories.filter(s => s.epicId === epic.id);
            const completedStories = epicStories.filter(s => s.status === 'completed').length;
            const isExpanded = expandedEpic === epic.id;
            return (
              <div key={epic.id} className="bg-[#12131C] border border-white/6 rounded-xl overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors"
                  onClick={() => setExpandedEpic(isExpanded ? null : epic.id)}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: epic.color }} />
                  <span className="font-medium text-[#F9FAFB] flex-1 text-left">{epic.name}</span>
                  <span className="text-xs text-[#6B7280]">{completedStories}/{epicStories.length} HU</span>
                  <StatusBadge status={epic.status} />
                  <ChevronRight size={14} className={`text-[#6B7280] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="border-t border-white/6">
                    {epicStories.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-[#6B7280]">Sin historias en esta épica.</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/4">
                            <th className="text-left text-xs text-[#6B7280] px-4 py-2 font-medium">Historia de usuario</th>
                            <th className="text-left text-xs text-[#6B7280] px-4 py-2 font-medium hidden sm:table-cell">Prioridad</th>
                            <th className="text-left text-xs text-[#6B7280] px-4 py-2 font-medium hidden md:table-cell">Puntos</th>
                            <th className="text-left text-xs text-[#6B7280] px-4 py-2 font-medium">Estado</th>
                            <th className="text-left text-xs text-[#6B7280] px-4 py-2 font-medium hidden lg:table-cell">Asignado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {epicStories.map(s => {
                            const assignee = users.find(u => u.id === s.assigneeId);
                            return (
                              <tr key={s.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="text-sm text-[#F9FAFB]">{s.title}</p>
                                  <p className="text-xs text-[#6B7280] truncate max-w-xs">{s.description}</p>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell"><PriorityBadge priority={s.priority} /></td>
                                <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm font-mono text-[#9CA3AF]">{s.points}pt</span></td>
                                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                  {assignee ? <div className="flex items-center gap-1.5"><Avatar name={`${assignee.name} ${assignee.lastName}`} size={20} /><span className="text-xs text-[#9CA3AF]">{assignee.name}</span></div> : <span className="text-xs text-[#6B7280]">—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                    {isManager && (
                      <div className="px-4 py-2 border-t border-white/4">
                        <button onClick={() => setAddStoryEpic(epic.id)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                          <Plus size={12} /> Agregar historia de usuario
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <Modal open={createEpicOpen} onClose={() => setCreateEpicOpen(false)} title="Nueva épica" size="md"
          footer={<><Button variant="secondary" onClick={() => setCreateEpicOpen(false)}>Cancelar</Button><Button onClick={saveEpic}>Crear épica</Button></>}>
          <div className="flex flex-col gap-4">
            <Input label="Nombre *" placeholder="Nombre de la épica" value={epicForm.name} onChange={e => setEpicForm(f => ({ ...f, name: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Descripción</label>
              <textarea value={epicForm.description} onChange={e => setEpicForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-blue-500" placeholder="Descripción opcional..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Color</label>
              <select value={epicForm.color} onChange={e => setEpicForm(f => ({ ...f, color: e.target.value }))} className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm">
                {[['#3B82F6','Azul'],['#8B5CF6','Violeta'],['#10B981','Verde'],['#F59E0B','Ámbar'],['#EC4899','Rosa']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>

        <Modal open={!!addStoryEpic} onClose={() => setAddStoryEpic(null)} title="Nueva historia de usuario" size="md"
          footer={<><Button variant="secondary" onClick={() => setAddStoryEpic(null)}>Cancelar</Button><Button onClick={saveStory}>Crear HU</Button></>}>
          <div className="flex flex-col gap-4">
            <Input label="Título *" placeholder="Como [rol] quiero [acción] para [beneficio]" value={storyForm.title} onChange={e => setStoryForm(f => ({ ...f, title: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Descripción</label>
              <textarea value={storyForm.description} onChange={e => setStoryForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-blue-500" placeholder="Descripción detallada..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Prioridad" value={storyForm.priority} onChange={e => setStoryForm(f => ({ ...f, priority: e.target.value }))} options={[{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' }]} />
              <Input label="Story Points" type="number" min="0" max="100" value={storyForm.points} onChange={e => setStoryForm(f => ({ ...f, points: e.target.value }))} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ── SPRINTS ───────────────────────────────────────────────────────────────
  function SprintsTab() {
    const [createOpen, setCreateOpen] = useState(false);
    const [sprintForm, setSprintForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
    const [expandedSprint, setExpandedSprint] = useState(projSprints.find(s => s.status === 'active')?.id ?? null);
    const [expandedStory, setExpandedStory] = useState(null);
    const [addHuForSprint, setAddHuForSprint] = useState(null);
    const [selectedHuId, setSelectedHuId] = useState('');

    function saveSprint() {
      if (!sprintForm.name.trim()) return;
      dispatch({ type: 'ADD_SPRINT', sprint: { id: `sp${Date.now()}`, projectId: projectId!, ...sprintForm, status: 'planning', storyIds: [] } });
      setCreateOpen(false);
      showToast('Sprint creado.');
    }

    function assignHuToSprint() {
      if (!selectedHuId || !addHuForSprint) return;
      const story = projStories.find(s => s.id === selectedHuId);
      if (!story) return;
      dispatch({ type: 'UPDATE_STORY', story: { ...story, sprintId: addHuForSprint.id, status: 'in-sprint' } });
      dispatch({ type: 'UPDATE_SPRINT', sprint: { ...addHuForSprint, storyIds: [...(addHuForSprint.storyIds || []), selectedHuId] } });
      setAddHuForSprint(null);
      setSelectedHuId('');
      showToast('Historia asignada al sprint.', 'success');
    }

    return (
      <div className="space-y-4">
        {isManager && (
          <div className="flex justify-end">
            <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Crear sprint</Button>
          </div>
        )}
        {projSprints.length === 0 ? (
          <EmptyState icon={<Target size={22} />} title="Sin sprints" description="Crea el primer sprint para comenzar la planificación." />
        ) : (
          projSprints.map(sprint => {
            const sprintStories = projStories.filter(s => s.sprintId === sprint.id);
            const done = sprintStories.filter(s => s.status === 'completed').length;
            const total = sprintStories.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const sprintTasks = projTasks.filter(t => t.sprintId === sprint.id);
            const sprintPts = sprintStories.reduce((a, s) => a + s.points, 0);
            const isExpanded = expandedSprint === sprint.id;

            return (
              <Card key={sprint.id} className="overflow-hidden">
                {/* Sprint header */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setExpandedSprint(isExpanded ? null : sprint.id)} className="text-[#6B7280] hover:text-[#F9FAFB]">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-[#F9FAFB]">{sprint.name}</h3>
                          <StatusBadge status={sprint.status} />
                        </div>
                        <p className="text-xs text-[#9CA3AF]">{sprint.goal}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isManager && sprint.status === 'planning' && (
                        <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'UPDATE_SPRINT', sprint: { ...sprint, status: 'active' } }); showToast('Sprint iniciado.'); }}>Iniciar</Button>
                      )}
                      {isManager && sprint.status === 'active' && (
                        <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'UPDATE_SPRINT', sprint: { ...sprint, status: 'completed', velocity: sprintPts } }); showToast('Sprint completado.'); }}>Completar</Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3 flex-wrap">
                    <span>{sprint.startDate} → {sprint.endDate}</span>
                    <span>{total} HU · {sprintTasks.length} tareas · {sprintPts}pt</span>
                    {sprint.velocity && <span className="text-violet-400">Velocidad: {sprint.velocity}pt</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={done} max={total || 1} />
                    <span className="text-sm font-bold text-blue-400 shrink-0">{pct}%</span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">{done} de {total} historias completadas</p>
                </div>

                {/* Expanded sprint detail with stories, DoD, DoR */}
                {isExpanded && (
                  <div className="border-t border-white/6">
                    {isManager && (
                      <div className="px-5 py-2 border-b border-white/4 flex justify-end">
                        <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => { setAddHuForSprint(sprint); setSelectedHuId(''); }}>Agregar HU al sprint</Button>
                      </div>
                    )}
                    {sprintStories.length === 0 ? (
                      <div className="px-5 py-6 text-center text-sm text-[#6B7280]">Sin historias en este sprint.</div>
                    ) : sprintStories.map(story => {
                      const storyTasks = projTasks.filter(t => t.storyId === story.id);
                      const epic = projEpics.find(e => e.id === story.epicId);
                      const assignee = story.assigneeId ? users.find(u => u.id === story.assigneeId) : null;
                      const tasksDone = storyTasks.filter(t => t.status === 'completed').length;
                      const isStoryExpanded = expandedStory === story.id;

                      return (
                        <div key={story.id} className="border-b border-white/4 last:border-0">
                          {/* Story row */}
                          <button
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors text-left"
                            onClick={() => setExpandedStory(isStoryExpanded ? null : story.id)}
                          >
                            {isStoryExpanded ? <ChevronDown size={13} className="text-[#6B7280] shrink-0" /> : <ChevronRight size={13} className="text-[#6B7280] shrink-0" />}
                            {epic && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: epic.color }} />}
                            <span className="flex-1 text-sm text-[#F9FAFB] truncate">{story.title}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-[#6B7280]">{tasksDone}/{storyTasks.length} tareas</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                story.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                story.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                story.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-[#374151] text-[#6B7280]'}`}>{story.points}pt</span>
                              {assignee && <Avatar name={`${assignee.name} ${assignee.lastName}`} size={20} />}
                            </div>
                          </button>

                          {/* Story expanded: DoR, DoD, Tasks */}
                          {isStoryExpanded && (
                            <div className="px-10 pb-4 bg-black/10">
                              <p className="text-xs text-[#6B7280] mb-3 italic">{story.description}</p>

                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                {/* DoR */}
                                <div className="bg-[#1E1F2B] border border-white/6 rounded-lg p-3">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <span className="text-xs font-semibold text-amber-400">Definición de Listo (DoR)</span>
                                  </div>
                                  {story.definitionOfReady?.length > 0 ? (
                                    <ul className="space-y-1">
                                      {story.definitionOfReady.map((d, i) => (
                                        <li key={i} className="text-xs text-[#9CA3AF] flex items-start gap-1.5">
                                          <span className="text-amber-400 mt-0.5 shrink-0">→</span>{d}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : <p className="text-xs text-[#4B5563]">Sin DoR definido</p>}
                                </div>

                                {/* DoD */}
                                <div className="bg-[#1E1F2B] border border-white/6 rounded-lg p-3">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                    <span className="text-xs font-semibold text-emerald-400">Definición de Hecho (DoD)</span>
                                  </div>
                                  {story.definitionOfDone?.length > 0 ? (
                                    <ul className="space-y-1">
                                      {story.definitionOfDone.map((d, i) => (
                                        <li key={i} className="text-xs text-[#9CA3AF] flex items-start gap-1.5">
                                          <CheckCircle size={11} className="text-emerald-400 mt-0.5 shrink-0" />{d}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : <p className="text-xs text-[#4B5563]">Sin DoD definido</p>}
                                </div>
                              </div>

                              {/* Criterios de aceptación */}
                              {story.acceptanceCriteria?.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs font-semibold text-[#9CA3AF] mb-2">Criterios de Aceptación</p>
                                  <ul className="space-y-1">
                                    {story.acceptanceCriteria.map((ac, i) => (
                                      <li key={i} className="text-xs text-[#6B7280] flex items-start gap-1.5">
                                        <span className="text-blue-400 mt-0.5 shrink-0">{i + 1}.</span>{ac}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Tasks */}
                              {storyTasks.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-[#9CA3AF] mb-2">Tareas</p>
                                  <div className="space-y-1.5">
                                    {storyTasks.map(task => {
                                      const taskAssignee = task.assigneeId ? users.find(u => u.id === task.assigneeId) : null;
                                      return (
                                        <div key={task.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-[#12131C] border border-white/4">
                                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TaskStatusColor(task.status) }} />
                                          <span className={`flex-1 text-xs ${task.status === 'completed' ? 'line-through text-[#4B5563]' : 'text-[#D1D5DB]'}`}>{task.title}</span>
                                          <span className="text-xs text-[#4B5563]">{task.loggedHours}h/{task.estimatedHours}h</span>
                                          {taskAssignee && <Avatar name={`${taskAssignee.name} ${taskAssignee.lastName}`} size={16} />}
                                          {task.assigneeId === currentUser.id ? (
                                            <select
                                              value={task.status}
                                              onChange={e => { dispatch({ type: 'UPDATE_TASK', task: { ...task, status: e.target.value as any, updatedAt: new Date().toISOString() } }); showToast('Tarea actualizada.'); }}
                                              className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm"
                                              onClick={e => e.stopPropagation()}
                                            >
                                              {['todo','in-progress','code-review','testing','completed','fixing'].map(s => <option key={s} value={s}>{TaskStatusLabel(s)}</option>)}
                                            </select>
                                          ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: TaskStatusColor(task.status) + '33', color: TaskStatusColor(task.status) }}>{TaskStatusLabel(task.status)}</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}
        <Modal open={!!addHuForSprint} onClose={() => { setAddHuForSprint(null); setSelectedHuId(''); }} title="Agregar HU al sprint" size="sm"
          footer={<><Button variant="secondary" onClick={() => { setAddHuForSprint(null); setSelectedHuId(''); }}>Cancelar</Button><Button onClick={assignHuToSprint} disabled={!selectedHuId}>Asignar</Button></>}>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#9CA3AF]">Selecciona una historia de usuario sin sprint asignado para agregarla a <strong className="text-[#F9FAFB]">{addHuForSprint?.name}</strong>.</p>
            <select value={selectedHuId} onChange={e => setSelectedHuId(e.target.value)} className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm">
              <option value="">Seleccionar historia...</option>
              {projStories.filter(s => !s.sprintId || s.sprintId !== addHuForSprint?.id).map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        </Modal>

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo sprint" size="md"
          footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={saveSprint}>Crear sprint</Button></>}>
          <div className="flex flex-col gap-4">
            <Input label="Nombre del sprint *" placeholder="Sprint 1 – Autenticación" value={sprintForm.name} onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Objetivo del sprint</label>
              <textarea value={sprintForm.goal} onChange={e => setSprintForm(f => ({ ...f, goal: e.target.value }))} rows={2} className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500" placeholder="Qué debe lograrse en este sprint..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Fecha inicio" type="date" value={sprintForm.startDate} onChange={e => setSprintForm(f => ({ ...f, startDate: e.target.value }))} />
              <Input label="Fecha fin" type="date" value={sprintForm.endDate} onChange={e => setSprintForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ── KANBAN ────────────────────────────────────────────────────────────────
  function KanbanTab() {
    const [dragTaskId, setDragTaskId] = useState(null);
    const [filterAssignee, setFilterAssignee] = useState('all');
    const [filterSprint, setFilterSprint] = useState('all');
    const [dragOverCol, setDragOverCol] = useState(null);

    const columns = [
      { id: 'todo', label: 'Por hacer', color: '#6B7280' },
      { id: 'in-progress', label: 'En progreso', color: '#3B82F6' },
      { id: 'code-review', label: 'Code Review', color: '#8B5CF6' },
      { id: 'testing', label: 'Testing', color: '#F59E0B' },
      { id: 'completed', label: 'Completado', color: '#10B981' },
      { id: 'fixing', label: 'En corrección', color: '#F97316' },
    ];

    function canMove(task) {
      return isManager || task.assigneeId === currentUser.id;
    }

    function moveTask(task, newStatus) {
      if (!canMove(task)) { showToast('Solo el asignado o el gerente puede cambiar el estado.', 'error'); return; }
      dispatch({ type: 'UPDATE_TASK', task: { ...task, status: newStatus, updatedAt: new Date().toISOString() } });
    }

    function onDragStart(e, taskId) {
      setDragTaskId(taskId);
      e.dataTransfer.effectAllowed = 'move';
    }

    function onDrop(e, colId) {
      e.preventDefault();
      setDragOverCol(null);
      if (!dragTaskId) return;
      const task = projTasks.find(t => t.id === dragTaskId);
      if (task && task.status !== colId) moveTask(task, colId);
      setDragTaskId(null);
    }

    const filtered = projTasks.filter(t => {
      if (filterAssignee !== 'all' && t.assigneeId !== filterAssignee) return false;
      if (filterSprint !== 'all' && t.sprintId !== filterSprint) return false;
      return true;
    });

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm"
          >
            <option value="all">Todos los miembros</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name} {m.lastName}</option>)}
          </select>
          <select
            value={filterSprint}
            onChange={e => setFilterSprint(e.target.value)}
            className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm"
          >
            <option value="all">Todos los sprints</option>
            {projSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <span className="text-xs text-[#6B7280]">{filtered.length} tarea{filtered.length !== 1 ? 's' : ''}</span>
          {isManager && (
            <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={() => {
              const title = prompt('Título de la tarea:');
              if (!title) return;
              const storyId = projStories[0]?.id ?? '';
              dispatch({ type: 'ADD_TASK', task: {
                id: `t${Date.now()}`, storyId, projectId: projectId,
                title, description: '', status: 'todo', estimatedHours: 4, loggedHours: 0,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
              }});
              showToast('Tarea creada.');
            }} className="ml-auto">Nueva tarea</Button>
          )}
        </div>

        {/* Board */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id);
            const isOver = dragOverCol === col.id;
            return (
              <div
                key={col.id}
                className="shrink-0 w-[240px]"
                onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => onDrop(e, col.id)}
              >
                {/* Column header */}
                <div className={`flex items-center gap-2 mb-3 px-1 py-1.5 rounded-lg transition-colors ${isOver ? 'bg-white/4' : ''}`}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-sm font-medium text-[#F9FAFB] flex-1">{col.label}</span>
                  <span className="text-xs bg-white/8 text-[#9CA3AF] px-1.5 py-0.5 rounded font-mono">{colTasks.length}</span>
                </div>

                {/* Drop zone */}
                <div className={`flex flex-col gap-2 min-h-[120px] rounded-xl p-1.5 transition-colors ${isOver ? 'bg-white/3 border border-dashed border-white/15' : ''}`}>
                  {colTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const story = stories.find(s => s.id === task.storyId);
                    const canDrag = canMove(task);
                    return (
                      <div
                        key={task.id}
                        draggable={canDrag}
                        onDragStart={e => onDragStart(e, task.id)}
                        onDragEnd={() => setDragTaskId(null)}
                        className={`bg-[#12131C] border border-white/6 rounded-xl p-3 transition-all hover:border-white/15 ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${dragTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                      >
                        <p className="text-sm font-medium text-[#F9FAFB] mb-1 leading-snug">{task.title}</p>
                        {story && <p className="text-xs text-[#6B7280] mb-2 truncate">{story.title}</p>}
                        <div className="flex items-center justify-between mt-2">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={`${assignee.name} ${assignee.lastName}`} size={18} />
                              <span className="text-xs text-[#6B7280]">{assignee.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-white/8 border border-dashed border-white/20" />
                              <span className="text-xs text-[#4B5563]">Sin asignar</span>
                            </div>
                          )}
                          {isManager && (
                            <select
                              value={task.status}
                              onChange={e => moveTask(task, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm"
                            >
                              {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                          )}
                        </div>
                        {task.estimatedHours > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/4">
                            <div className="flex items-center justify-between text-xs text-[#4B5563]">
                              <span>{task.loggedHours}h / {task.estimatedHours}h</span>
                              <div className="w-16 h-1 bg-white/8 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.min(100, (task.loggedHours / task.estimatedHours) * 100)}%`, background: col.color }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className={`flex items-center justify-center h-16 rounded-lg border border-dashed transition-colors ${isOver ? 'border-white/30 bg-white/4' : 'border-white/8'}`}>
                      <span className="text-xs text-[#4B5563]">{isOver ? 'Soltar aquí' : 'Vacío'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DOCS ─────────────────────────────────────────────────────────────────
  function DocsTab() {
    const [createOpen, setCreateOpen] = useState(false);
    const [docForm, setDocForm] = useState({ title: '', url: '', description: '', category: 'technical', isPublic: true });
    const catColors: Record<string, string> = { technical: 'blue', functional: 'green', meeting: 'violet', general: 'gray', prompt: 'violet' };
    const catLabels: Record<string, string> = { technical: 'Técnico', functional: 'Funcional', meeting: 'Reunión', general: 'General', prompt: 'Prompt' };

    function saveDoc() {
      if (!docForm.title.trim() || !docForm.url.trim()) return;
      dispatch({ type: 'ADD_DOCUMENT', doc: { id: `d${Date.now()}`, projectId: projectId!, title: docForm.title, url: docForm.url, description: docForm.description, category: docForm.category as any, isPublic: docForm.isPublic, authorId: currentUser.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
      setCreateOpen(false);
      setDocForm({ title: '', url: '', description: '', category: 'technical', isPublic: true });
      showToast('Documento creado.');
    }

    return (
      <div className="space-y-4">
        {isManager && <div className="flex justify-end"><Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Nuevo documento</Button></div>}
        {projDocs.length === 0 ? (
          <EmptyState icon={<FileText size={22} />} title="Sin documentación" description="Agrega la primera documentación del proyecto." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {projDocs.map(doc => {
              const author = users.find(u => u.id === doc.authorId);
              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={catColors[doc.category] as any}>{catLabels[doc.category]}</Badge>
                    {doc.isPublic ? <Badge variant="green">Público</Badge> : <Badge variant="gray">Privado</Badge>}
                  </div>
                  <h3 className="font-medium text-[#F9FAFB] mb-1">{doc.title}</h3>
                  {doc.description && <p className="text-xs text-[#9CA3AF] mb-2 line-clamp-2">{doc.description}</p>}
                  <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-3 truncate">
                    <ExternalLink size={11} /> {doc.url}
                  </a>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <Avatar name={`${author?.name ?? ''} ${author?.lastName ?? ''}`} size={18} />
                    <span>{author?.name}</span>
                    <span>·</span>
                    <span>{doc.updatedAt.slice(0, 10)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo documento" size="md"
          footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={saveDoc}>Crear documento</Button></>}>
          <div className="flex flex-col gap-4">
            <Input label="Título *" value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre del documento" />
            <Input label="URL *" value={docForm.url} onChange={e => setDocForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Descripción</label>
              <textarea value={docForm.description} onChange={e => setDocForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-blue-500" placeholder="Descripción opcional..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#F9FAFB]">Categoría</label>
                <select value={docForm.category} onChange={e => setDocForm(f => ({ ...f, category: e.target.value }))} className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm">
                  <option value="technical">Técnico</option>
                  <option value="functional">Funcional</option>
                  <option value="meeting">Reunión</option>
                  <option value="general">General</option>
                  <option value="prompt">Prompt</option>
                </select>
              </div>
              <Select label="Visibilidad" value={docForm.isPublic ? 'true' : 'false'} onChange={e => setDocForm(f => ({ ...f, isPublic: e.target.value === 'true' }))} options={[{ value: 'true', label: 'Público' }, { value: 'false', label: 'Privado (solo Gerente)' }]} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ── METRICS ───────────────────────────────────────────────────────────────
  function MetricsTab() {
    const totalPoints = projStories.reduce((sum, s) => sum + s.points, 0);
    const completedPoints = projStories.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.points, 0);
    const totalHours = projTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const loggedHours = projTasks.reduce((sum, t) => sum + t.loggedHours, 0);
    const activeSprint = projSprints.find(s => s.status === 'active');

    // Sprint velocity chart data
    const sprintVelocityData = projSprints.slice(-5).map(sp => {
      const spStories = projStories.filter(s => s.sprintId === sp.id);
      const planned = spStories.reduce((sum, s) => sum + s.points, 0);
      const completed = spStories.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.points, 0);
      return { name: sp.name.slice(0, 10), planned, completed, status: sp.status };
    });

    // Task distribution by developer
    const devDistribution = members.map(m => {
      const mt = projTasks.filter(t => t.assigneeId === m.id);
      return { name: m.name, total: mt.length, done: mt.filter(t => t.status === 'completed').length };
    }).filter(d => d.total > 0);

    // Burndown data for active sprint
    const burndownData = (() => {
      if (!activeSprint) return [];
      const spStories = projStories.filter(s => s.sprintId === activeSprint.id);
      const totalPts = spStories.reduce((sum, s) => sum + s.points, 0);
      const donePts = spStories.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.points, 0);
      const start = new Date(activeSprint.startDate);
      const end = new Date(activeSprint.endDate);
      const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      const elapsed = Math.min(total, Math.ceil((Date.now() - start.getTime()) / 86400000));
      const points = Array.from({ length: total + 1 }, (_, i) => ({
        day: i,
        ideal: totalPts - (totalPts / total) * i,
        actual: i === elapsed ? totalPts - donePts : i < elapsed ? totalPts - (donePts * i / elapsed) : null,
      }));
      return { points, totalPts, elapsed, total };
    })();

    const maxVel = Math.max(...sprintVelocityData.flatMap(d => [d.planned, d.completed]), 1);
    const maxDev = Math.max(...devDistribution.map(d => d.total), 1);

    return (
      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Story Points', value: totalPoints, sub: `${completedPoints} completados`, color: '#3B82F6' },
            { label: 'Horas estimadas', value: `${totalHours}h`, sub: `${loggedHours}h registradas`, color: '#8B5CF6' },
            { label: 'Cobertura', value: totalPoints ? `${Math.round((completedPoints / totalPoints) * 100)}%` : '—', sub: 'puntos completados', color: '#10B981' },
            { label: 'Fixes activos', value: projFixes.filter(f => f.status === 'open' || f.status === 'in-progress').length, sub: `${projFixes.length} total`, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-[#1E1F2B] border border-white/6 rounded-xl p-4">
              <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium text-[#9CA3AF]">{s.label}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Sprint velocity bar chart */}
          <Card className="p-5">
            <h3 className="font-semibold text-[#F9FAFB] mb-4">Velocidad por sprint</h3>
            {sprintVelocityData.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6 text-center">Sin sprints para mostrar.</p>
            ) : (
              <div className="space-y-3">
                {sprintVelocityData.map(d => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#9CA3AF] truncate max-w-[120px]">{d.name}</span>
                      <span className="text-[#6B7280]">{d.completed}/{d.planned}pt</span>
                    </div>
                    <div className="relative h-4 bg-[#0A0B0E] rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-blue-500/25 rounded-full transition-all" style={{ width: `${(d.planned / maxVel) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all" style={{ width: `${(d.completed / maxVel) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280]"><div className="w-3 h-2 rounded-full bg-blue-500/25" />Planificado</div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280]"><div className="w-3 h-2 rounded-full bg-emerald-500" />Completado</div>
                </div>
              </div>
            )}
          </Card>

          {/* Task distribution by developer */}
          <Card className="p-5">
            <h3 className="font-semibold text-[#F9FAFB] mb-4">Carga por desarrollador</h3>
            {devDistribution.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6 text-center">Sin tareas asignadas.</p>
            ) : (
              <div className="space-y-3">
                {devDistribution.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs text-[#9CA3AF] w-20 shrink-0 truncate">{d.name}</span>
                    <div className="flex-1 relative h-4 bg-[#0A0B0E] rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-blue-500/25 rounded-full" style={{ width: `${(d.total / maxDev) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all" style={{ width: `${(d.done / maxDev) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#6B7280] w-12 text-right">{d.done}/{d.total}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Burndown chart */}
        {activeSprint && burndownData.points ? (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#F9FAFB]">Burndown — {activeSprint.name}</h3>
              <span className="text-xs text-[#6B7280]">{burndownData.elapsed}/{burndownData.total} días</span>
            </div>
            <div className="relative">
              <svg width="100%" viewBox={`0 0 ${burndownData.total + 2} ${burndownData.totalPts + 2}`}
                preserveAspectRatio="none" style={{ height: 160, display: 'block' }}>
                {/* Ideal line */}
                <polyline
                  points={burndownData.points.map(p => `${p.day + 1},${burndownData.totalPts - p.ideal + 1}`).join(' ')}
                  fill="none" stroke="#3B82F620" strokeWidth="0.5" strokeDasharray="1,1"
                />
                {/* Actual line */}
                <polyline
                  points={burndownData.points.filter(p => p.actual !== null).map(p => `${p.day + 1},${burndownData.totalPts - (p.actual ?? 0) + 1}`).join(' ')}
                  fill="none" stroke="#10B981" strokeWidth="0.6"
                />
              </svg>
              <div className="flex items-center justify-between text-xs text-[#6B7280] mt-1">
                <span>{activeSprint.startDate}</span>
                <span>{activeSprint.endDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]"><div className="w-5 h-px bg-blue-500/30 border-t border-dashed border-blue-500/30" />Ideal</div>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]"><div className="w-5 h-px bg-emerald-500" />Real</div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 flex items-center gap-4">
            <BarChart2 size={28} className="text-[#374151] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#F9FAFB]">Burndown chart</p>
              <p className="text-xs text-[#6B7280] mt-0.5">Inicia un sprint para visualizar el burndown en tiempo real.</p>
            </div>
          </Card>
        )}

        {/* Fixes summary */}
        <Card className="p-5">
          <h3 className="font-semibold text-[#F9FAFB] mb-4">Resumen de fixes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Abiertos', value: projFixes.filter(f => f.status === 'open').length, color: '#EF4444' },
              { label: 'En progreso', value: projFixes.filter(f => f.status === 'in-progress').length, color: '#3B82F6' },
              { label: 'Resueltos', value: projFixes.filter(f => f.status === 'resolved').length, color: '#10B981' },
              { label: 'Cerrados', value: projFixes.filter(f => f.status === 'closed').length, color: '#6B7280' },
            ].map(s => (
              <div key={s.label} className="bg-[#0A0B0E] rounded-lg p-3 text-center border border-white/4">
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // AITab removed


  // ── KNOWLEDGE ─────────────────────────────────────────────────────────────
  function KnowledgeTab() {
    const [createOpen, setCreateOpen] = useState(false);
    const [kForm, setKForm] = useState({ title: '', content: '', tags: '' });

    function saveEntry() {
      if (!kForm.title.trim()) return;
      dispatch({ type: 'ADD_KNOWLEDGE', entry: { id: `k${Date.now()}`, projectId: projectId!, title: kForm.title, content: kForm.content, tags: kForm.tags.split(',').map(t => t.trim()).filter(Boolean), authorId: currentUser.id, createdAt: new Date().toISOString() } });
      setCreateOpen(false); setKForm({ title: '', content: '', tags: '' });
      showToast('Entrada de conocimiento guardada.');
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end"><Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Nueva entrada</Button></div>
        {projKnowledge.length === 0 ? (
          <EmptyState icon={<BookOpen size={22} />} title="Base de conocimiento vacía" description="Documenta soluciones técnicas, patrones y aprendizajes del equipo." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {projKnowledge.map(k => {
              const author = users.find(u => u.id === k.authorId);
              return (
                <Card key={k.id} className="p-4">
                  <h3 className="font-medium text-[#F9FAFB] mb-2">{k.title}</h3>
                  <p className="text-xs text-[#9CA3AF] mb-3 line-clamp-3">{k.content}</p>
                  <div className="flex flex-wrap gap-1 mb-3">{k.tags.map(t => <Badge key={t} variant="gray">{t}</Badge>)}</div>
                  <p className="text-xs text-[#6B7280]">{author?.name} · {k.createdAt.slice(0, 10)}</p>
                </Card>
              );
            })}
          </div>
        )}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva entrada de conocimiento" size="md"
          footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={saveEntry}>Guardar</Button></>}>
          <div className="flex flex-col gap-4">
            <Input label="Título *" value={kForm.title} onChange={e => setKForm(f => ({ ...f, title: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Contenido</label>
              <textarea value={kForm.content} onChange={e => setKForm(f => ({ ...f, content: e.target.value }))} rows={5} className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500" placeholder="Describe la solución, patrón o aprendizaje..." />
            </div>
            <Input label="Etiquetas" placeholder="fastapi, jwt, auth (separadas por coma)" value={kForm.tags} onChange={e => setKForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
        </Modal>
      </div>
    );
  }

  // ── MEETINGS TAB ─────────────────────────────────────────────────────────
  function MeetingsTab() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 justify-end flex-wrap">
          <Button variant="secondary" onClick={() => navigate({ page: 'meetings' })}>Ver todas las reuniones</Button>
          {isManager && (
            <Button icon={<Clock size={14} />} onClick={() => navigate({ page: 'availability' })}>
              Programar reunión
            </Button>
          )}
        </div>
        {projMeetings.length === 0 ? (
          <EmptyState icon={<Video size={22} />} title="Sin reuniones" description="No hay reuniones registradas en este proyecto." />
        ) : (
          <div className="flex flex-col gap-3">
            {projMeetings.sort((a, b) => b.date.localeCompare(a.date)).map(m => {
              const participants = users.filter(u => m.participantIds.includes(u.id));
              return (
                <Card key={m.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.status === 'completed' ? 'bg-emerald-500/15' : 'bg-blue-500/15'}`}>
                      <Video size={14} className={m.status === 'completed' ? 'text-emerald-400' : 'text-blue-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium text-[#F9FAFB]">{m.title}</p>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="text-xs text-[#6B7280]">{m.date} · {m.startTime} · {m.duration}min</p>
                      {m.summary && <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">{m.summary}</p>}
                      <div className="flex items-center gap-1 mt-2">
                        {participants.slice(0, 4).map(p => <Avatar key={p.id} name={`${p.name} ${p.lastName}`} size={18} />)}
                        {participants.length > 4 && <span className="text-xs text-[#6B7280]">+{participants.length - 4}</span>}
                      </div>
                    </div>
                    <a href={m.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── FIXES ─────────────────────────────────────────────────────────────────
  function FixesTab() {
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedFix, setSelectedFix] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [analyzeEv, setAnalyzeEv] = useState(null);
    const [analyzeState, setAnalyzeState] = useState('idle'); // idle|processing|done
    const [newFixForm, setNewFixForm] = useState({ title: '', description: '', priority: 'medium', storyId: '', taskId: '', currency: 'COP' });
    const [addEvOpen, setAddEvOpen] = useState(false);
    const [evForm, setEvForm] = useState({ type: 'text', title: '', content: '', url: '', description: '' });
    const [videoError, setVideoError] = useState('');

    const FIX_PRIORITY_COLOR = { critical: 'bg-red-500/20 text-red-400', high: 'bg-orange-500/20 text-orange-400', medium: 'bg-yellow-500/20 text-yellow-400', low: 'bg-[#374151] text-[#6B7280]' };
    const FIX_STATUS_COLOR = { open: 'bg-[#374151] text-[#9CA3AF]', 'in-progress': 'bg-blue-500/20 text-blue-400', resolved: 'bg-emerald-500/20 text-emerald-400', closed: 'bg-[#374151] text-[#4B5563]' };
    const FIX_STATUS_CYCLE = ['open', 'in-progress', 'resolved', 'closed'];

    const filtered = projFixes
      .filter(f => filterStatus === 'all' || f.status === filterStatus)
      .filter(f => filterPriority === 'all' || f.priority === filterPriority)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    function createFix() {
      if (!newFixForm.title.trim()) return;
      const fix = {
        id: `f${Date.now()}`, projectId,
        ...newFixForm,
        status: 'open', reporterId: currentUser.id,
        estimatedCost: undefined, actualCost: undefined,
        solution: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        resolvedAt: undefined, history: [{ id: `fh${Date.now()}`, date: new Date().toISOString(), userId: currentUser.id, action: 'Creación', note: 'Fix creado' }],
      };
      dispatch({ type: 'ADD_FIX', fix });
      setCreateOpen(false);
      showToast('Fix creado.', 'success');
    }

    function updateFixStatus(fix, newStatus) {
      const nextFix = {
        ...fix, status: newStatus, updatedAt: new Date().toISOString(),
        resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : fix.resolvedAt,
        history: [...fix.history, { id: `fh${Date.now()}`, date: new Date().toISOString(), userId: currentUser.id, action: 'Cambio de estado', from: fix.status, to: newStatus }],
      };
      dispatch({ type: 'UPDATE_FIX', fix: nextFix });
      if (selectedFix?.id === fix.id) setSelectedFix(nextFix);
      showToast(`Fix actualizado a "${newStatus}".`, 'success');
    }

    function addEvidence() {
      if (!evForm.title.trim() || !selectedFix) return;
      if (evForm.type === 'video') {
        setVideoError('');
        // Simulated validation
        if (evForm.url && !evForm.url.includes('15s')) {
          // We'll just allow any URL for demo, but show the restriction
        }
      }
      const ev = { id: `ev${Date.now()}`, fixId: selectedFix.id, type: evForm.type, title: evForm.title, description: evForm.description, url: evForm.url || undefined, content: evForm.content || undefined, uploadedBy: currentUser.id, uploadedAt: new Date().toISOString() };
      dispatch({ type: 'ADD_EVIDENCE', evidence: ev });
      setAddEvOpen(false);
      setEvForm({ type: 'text', title: '', content: '', url: '', description: '' });
      showToast('Evidencia agregada.', 'success');
    }

    function runAIAnalysis(ev) {
      setAnalyzeEv(ev);
      setAnalyzeState('processing');
      setTimeout(() => setAnalyzeState('done'), 2500);
    }

    const existingAnalysis = analyzeEv ? aiAnalyses.find(a => a.evidenceId === analyzeEv.id) : null;

    const evTypeIcon = (t) => ({
      screenshot: <Image size={13} />, image: <Image size={13} />, video: <Film size={13} />,
      log: <FileCode size={13} />, link: <Link size={13} />, text: <FileText size={13} />,
    }[t] || <FileText size={13} />);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm">
              <option value="all">Todos los estados</option>
              {['open','in-progress','resolved','closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm">
              <option value="all">Todas las prioridades</option>
              {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Nuevo Fix</Button>
        </div>

        {/* Cycle legend */}
        <div className="flex items-center gap-1 text-xs text-[#6B7280] overflow-x-auto pb-1">
          {FIX_STATUS_CYCLE.map((s, i) => (
            <React.Fragment key={s}>
              <span className={`px-2 py-0.5 rounded-full ${FIX_STATUS_COLOR[s] || ''}`}>{s}</span>
              {i < FIX_STATUS_CYCLE.length - 1 && <ChevronRight size={10} className="text-[#374151] shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Wrench size={22} />} title="Sin fixes" description="No hay fixes registrados con los filtros actuales." />
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Fix list */}
            <div className="lg:col-span-1 space-y-2">
              {filtered.map(fix => {
                const reporter = users.find(u => u.id === fix.reporterId);
                const assignee = fix.assigneeId ? users.find(u => u.id === fix.assigneeId) : null;
                const fixEvs = evidences.filter(e => e.fixId === fix.id);
                return (
                  <div
                    key={fix.id}
                    onClick={() => setSelectedFix(fix)}
                    className={`bg-[#12131C] border rounded-xl p-3 cursor-pointer transition-all ${selectedFix?.id === fix.id ? 'border-blue-500/50 bg-blue-500/4' : 'border-white/8 hover:border-white/15'}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${FIX_PRIORITY_COLOR[fix.priority] || ''}`}>{fix.priority.toUpperCase()}</span>
                      <p className="text-sm font-medium text-[#F9FAFB] leading-snug flex-1">{fix.title}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${FIX_STATUS_COLOR[fix.status] || ''}`}>{fix.status}</span>
                      <div className="flex items-center gap-1">
                        {fixEvs.length > 0 && <span className="text-xs text-[#6B7280]">{fixEvs.length} ev.</span>}
                        {assignee && <Avatar name={`${assignee.name} ${assignee.lastName}`} size={18} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fix detail */}
            <div className="lg:col-span-2">
              {selectedFix ? (
                <Card className="p-5 space-y-5">
                  {/* Fix header */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${FIX_PRIORITY_COLOR[selectedFix.priority] || ''}`}>{selectedFix.priority.toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${FIX_STATUS_COLOR[selectedFix.status] || ''}`}>{selectedFix.status}</span>
                      </div>
                      <h3 className="font-semibold text-[#F9FAFB] mb-1">{selectedFix.title}</h3>
                      <p className="text-sm text-[#9CA3AF]">{selectedFix.description}</p>
                    </div>
                    {isManager && (
                      <select
                        value={selectedFix.status}
                        onChange={e => updateFixStatus(selectedFix, e.target.value)}
                        className="bg-[#1E1F2B] border border-white/10 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500 text-sm shrink-0"
                      >
                        {FIX_STATUS_CYCLE.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Cost */}
                  {(selectedFix.estimatedCost || isManager) && (
                    <div className="bg-[#1E1F2B] border border-white/6 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={13} className="text-yellow-400" />
                        <span className="text-xs font-semibold text-[#9CA3AF]">Costos</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {selectedFix.estimatedCost && <div><span className="text-[#6B7280]">Estimado: </span><span className="text-[#F9FAFB] font-medium">{selectedFix.estimatedCost.toLocaleString()} {selectedFix.currency}</span></div>}
                        {selectedFix.actualCost && <div><span className="text-[#6B7280]">Real: </span><span className="text-emerald-400 font-medium">{selectedFix.actualCost.toLocaleString()} {selectedFix.currency}</span></div>}
                        {selectedFix.costNote && <div className="col-span-2 text-[#6B7280]">{selectedFix.costNote}</div>}
                      </div>
                    </div>
                  )}

                  {/* Solution */}
                  {selectedFix.solution && (
                    <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-400 mb-1">Solución implementada</p>
                      <p className="text-sm text-[#9CA3AF]">{selectedFix.solution}</p>
                    </div>
                  )}

                  {/* Evidences */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Evidencias</p>
                      <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={() => setAddEvOpen(true)}>Agregar</Button>
                    </div>
                    {evidences.filter(e => e.fixId === selectedFix.id).length === 0 ? (
                      <p className="text-xs text-[#4B5563]">Sin evidencias. Agrega capturas, logs o videos para documentar el problema.</p>
                    ) : (
                      <div className="space-y-2">
                        {evidences.filter(e => e.fixId === selectedFix.id).map(ev => {
                          const analysis = aiAnalyses.find(a => a.evidenceId === ev.id || a.fixId === selectedFix.id);
                          return (
                            <div key={ev.id} className="bg-[#1E1F2B] border border-white/6 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#6B7280]">{evTypeIcon(ev.type)}</span>
                                  <span className="text-sm font-medium text-[#F9FAFB]">{ev.title}</span>
                                  <span className="text-xs text-[#4B5563] bg-white/5 px-1.5 py-0.5 rounded">{ev.type}</span>
                                </div>
                                <button onClick={() => runAIAnalysis(ev)} className="text-xs bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                                  <Brain size={11} /> Analizar con IA
                                </button>
                              </div>
                              {ev.description && <p className="text-xs text-[#6B7280] mb-2">{ev.description}</p>}
                              {ev.url && ev.type === 'screenshot' && (
                                <div className="rounded-lg overflow-hidden border border-white/8 mb-2">
                                  <img src={ev.url} alt={ev.title} className="w-full h-32 object-cover" />
                                </div>
                              )}
                              {ev.url && ev.type === 'video' && (
                                <div className="bg-black/20 rounded-lg p-2 text-xs text-[#6B7280] mb-2 flex items-center gap-2">
                                  <Film size={14} className="text-violet-400" />
                                  <div><span className="text-[#F9FAFB]">Video adjunto</span> · Máx 15s / 20MB</div>
                                </div>
                              )}
                              {ev.content && <pre className="text-xs text-[#6B7280] bg-black/20 rounded-lg p-2 overflow-x-auto max-h-32 font-mono whitespace-pre-wrap">{ev.content}</pre>}

                              {/* AI Analysis result */}
                              {analyzeEv?.id === ev.id && (
                                <div className="mt-3 border-t border-white/6 pt-3">
                                  {analyzeState === 'processing' && (
                                    <div className="flex items-center gap-2 text-xs text-violet-400">
                                      <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                                      Procesando evidencia...
                                    </div>
                                  )}
                                  {analyzeState === 'done' && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-xs text-violet-400">
                                        <Brain size={12} /> Análisis IA — Solo propone, el desarrollador debe validar
                                      </div>
                                      {analysis ? (
                                        <>
                                          {analysis.diagnosis && <div><p className="text-xs font-semibold text-[#F9FAFB] mb-1">Diagnóstico</p><p className="text-xs text-[#9CA3AF]">{analysis.diagnosis}</p></div>}
                                          {analysis.observations?.length > 0 && <div><p className="text-xs font-semibold text-[#F9FAFB] mb-1">Evidencia observada</p><ul className="space-y-0.5">{analysis.observations.map((o, i) => <li key={i} className="text-xs text-[#9CA3AF]">• {o}</li>)}</ul></div>}
                                          {analysis.possibleCauses?.length > 0 && <div><p className="text-xs font-semibold text-[#F9FAFB] mb-1">Posibles causas</p><ul className="space-y-0.5">{analysis.possibleCauses.map((c, i) => <li key={i} className="text-xs text-[#9CA3AF] flex gap-1.5"><span className="text-orange-400 shrink-0">{i + 1}.</span>{c}</li>)}</ul></div>}
                                          {analysis.suggestedSteps?.length > 0 && <div><p className="text-xs font-semibold text-[#F9FAFB] mb-1">Pasos sugeridos</p><ul className="space-y-0.5">{analysis.suggestedSteps.map((s, i) => <li key={i} className="text-xs text-[#9CA3AF] flex gap-1.5"><span className="text-blue-400 shrink-0">{i + 1}.</span>{s}</li>)}</ul></div>}
                                          {analysis.recommendation && <div className="bg-violet-500/8 border border-violet-500/20 rounded-lg p-2"><p className="text-xs font-semibold text-violet-400 mb-0.5">Recomendación</p><p className="text-xs text-[#9CA3AF]">{analysis.recommendation}</p></div>}
                                        </>
                                      ) : (
                                        <div className="space-y-2 text-xs text-[#9CA3AF]">
                                          <div><p className="font-semibold text-[#F9FAFB] mb-1">Diagnóstico</p><p>Basado en el contenido de la evidencia, se detectan patrones que sugieren un problema de validación o manejo de datos en la capa de presentación. El error parece ser determinístico y reproducible.</p></div>
                                          <div><p className="font-semibold text-[#F9FAFB] mb-1">Posibles causas</p><ul className="space-y-0.5"><li>• Falta de validación de entrada antes del procesamiento</li><li>• Estado inconsistente entre componentes</li><li>• Problema de sincronización de datos asincrónicos</li></ul></div>
                                          <div><p className="font-semibold text-[#F9FAFB] mb-1">Pasos sugeridos</p><ol className="space-y-0.5"><li>1. Verificar la entrada de datos con logs adicionales</li><li>2. Aislar el componente problemático</li><li>3. Agregar unit tests para el caso de fallo</li><li>4. Implementar la corrección y validar</li></ol></div>
                                          <div className="bg-violet-500/8 border border-violet-500/20 rounded-lg p-2"><p className="font-semibold text-violet-400 mb-0.5">Recomendación</p><p>Implementar validación temprana en el punto de entrada de datos. Esta es la solución más robusta y previene casos similares.</p></div>
                                          <div className="flex gap-2 pt-1">
                                            <button onClick={() => { showToast('Propuesta validada. Recuerda implementarla manualmente.', 'success'); setAnalyzeState('idle'); }} className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><ThumbsUp size={11} /> Validar propuesta</button>
                                            <button onClick={() => { showToast('Propuesta rechazada.', 'info'); setAnalyzeState('idle'); }} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><ThumbsDown size={11} /> Rechazar</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* History */}
                  <div>
                    <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Historial</p>
                    <div className="space-y-2">
                      {selectedFix.history.map(h => {
                        const u = users.find(u => u.id === h.userId);
                        return (
                          <div key={h.id} className="flex items-start gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full bg-[#1E1F2B] border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                              <History size={9} className="text-[#6B7280]" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[#9CA3AF]">{h.action}</span>
                              {h.from && <span className="text-[#6B7280]"> · {h.from} → {h.to}</span>}
                              {h.note && <span className="text-[#6B7280]"> · {h.note}</span>}
                              <span className="text-[#4B5563] ml-2">— {u ? `${u.name} ${u.lastName}` : 'Sistema'}, {new Date(h.date).toLocaleDateString('es-CO')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-white/8 rounded-xl h-48 flex items-center justify-center">
                  <p className="text-sm text-[#6B7280]">Selecciona un fix para ver el detalle</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Fix Modal */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Fix" size="md"
          footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={createFix}>Crear Fix</Button></>}>
          <div className="space-y-4">
            <Input label="Título *" placeholder="Fix: Descripción breve del problema" value={newFixForm.title} onChange={e => setNewFixForm(f => ({ ...f, title: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Descripción</label>
              <textarea value={newFixForm.description} onChange={e => setNewFixForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500" placeholder="Describe el problema, su impacto y contexto..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#F9FAFB]">Prioridad</label>
                <select value={newFixForm.priority} onChange={e => setNewFixForm(f => ({ ...f, priority: e.target.value }))} className="bg-[#1E1F2B] border border-white/10 rounded-md h-10 px-3 text-sm text-[#F9FAFB] focus:outline-none">
                  {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#F9FAFB]">HU relacionada</label>
                <select value={newFixForm.storyId} onChange={e => setNewFixForm(f => ({ ...f, storyId: e.target.value }))} className="bg-[#1E1F2B] border border-white/10 rounded-md h-10 px-3 text-sm text-[#F9FAFB] focus:outline-none">
                  <option value="">Sin HU</option>
                  {projStories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>

        {/* Add Evidence Modal */}
        <Modal open={addEvOpen} onClose={() => setAddEvOpen(false)} title="Agregar Evidencia" size="md"
          footer={<><Button variant="secondary" onClick={() => setAddEvOpen(false)}>Cancelar</Button><Button onClick={addEvidence}>Agregar</Button></>}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#F9FAFB]">Tipo de evidencia</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'screenshot', label: 'Captura', icon: <Image size={14} /> },
                  { id: 'video', label: 'Video', icon: <Film size={14} /> },
                  { id: 'log', label: 'Log', icon: <FileCode size={14} /> },
                  { id: 'link', label: 'Enlace', icon: <Link size={14} /> },
                  { id: 'text', label: 'Texto', icon: <FileText size={14} /> },
                  { id: 'image', label: 'Imagen', icon: <Image size={14} /> },
                ].map(t => (
                  <button key={t.id} onClick={() => setEvForm(f => ({ ...f, type: t.id }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors ${evForm.type === t.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 text-[#6B7280] hover:border-white/20'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {evForm.type === 'video' && (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={12} /> Video: máximo 15 segundos y 20 MB
                </div>
              )}
            </div>
            <Input label="Título *" value={evForm.title} onChange={e => setEvForm(f => ({ ...f, title: e.target.value }))} placeholder="Descripción breve de la evidencia" />
            {(evForm.type === 'screenshot' || evForm.type === 'image' || evForm.type === 'video' || evForm.type === 'link') && (
              <Input label="URL" value={evForm.url} onChange={e => setEvForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            )}
            {(evForm.type === 'log' || evForm.type === 'text') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#F9FAFB]">Contenido</label>
                <textarea value={evForm.content} onChange={e => setEvForm(f => ({ ...f, content: e.target.value }))} rows={5} className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500 font-mono" placeholder={evForm.type === 'log' ? '[ERROR] Pega aquí el log...' : 'Describe el comportamiento esperado vs actual...'} />
              </div>
            )}
            <Input label="Descripción adicional" value={evForm.description} onChange={e => setEvForm(f => ({ ...f, description: e.target.value }))} placeholder="Contexto adicional..." />
          </div>
        </Modal>
      </div>
    );
  }

  // ── DEVOPS ─────────────────────────────────────────────────────────────────
  function DevOpsTab() {
    const [selectedRun, setSelectedRun] = useState(projPipelines[0] ?? null);
    const [selectedStep, setSelectedStep] = useState(null);

    const STEP_STATUS_COLOR = { success: 'text-emerald-400', failed: 'text-red-400', running: 'text-blue-400', pending: 'text-[#6B7280]', skipped: 'text-[#374151]' };
    const STEP_STATUS_BG = { success: 'bg-emerald-500/20', failed: 'bg-red-500/20', running: 'bg-blue-500/20 animate-pulse', pending: 'bg-[#374151]', skipped: 'bg-[#272A38]' };
    const STEP_STATUS_ICON = { success: <CheckCircle size={13} />, failed: <XCircle size={13} />, running: <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />, pending: <Clock size={13} />, skipped: <span className="text-[10px]">—</span> };

    function simulatePipeline() {
      const steps = ['Git Push','Pull Request','ESLint','Unit Tests','Integration Tests','SonarQube','Build','Deploy Staging'].map((name, i) => ({
        id: `ps${Date.now()}_${i}`, name, status: 'pending', duration: undefined, log: undefined,
      }));
      const run = { id: `pr${Date.now()}`, projectId, branch: 'feat/new-feature', commit: Math.random().toString(36).substr(2, 7), author: `${currentUser.name} ${currentUser.lastName}`, message: 'feat: nueva funcionalidad', steps, status: 'running', startedAt: new Date().toISOString() };
      dispatch({ type: 'ADD_PIPELINE_RUN', run });
      setSelectedRun(run);
      showToast('Pipeline iniciado en simulación.', 'info');
      // Simulate step completions
      steps.forEach((_, i) => {
        setTimeout(() => {
          const isLast = i === steps.length - 1;
          dispatch({ type: 'UPDATE_AI_ANALYSIS', analysis: { id: 'dummy' } }); // just to trigger re-render
        }, (i + 1) * 800);
      });
    }

    const gitFlowBranches = [
      { name: 'main', color: '#10B981', desc: 'Producción estable' },
      { name: 'develop', color: '#3B82F6', desc: 'Integración continua' },
      { name: 'feature/auth', color: '#8B5CF6', desc: 'HU-01: Autenticación', parent: 'develop' },
      { name: 'feature/users', color: '#8B5CF6', desc: 'HU-03: CRUD usuarios', parent: 'develop' },
      { name: 'feature/backlog', color: '#8B5CF6', desc: 'HU-05: Product Backlog', parent: 'develop' },
      { name: 'fix/parser-unicode', color: '#F59E0B', desc: 'Fix f1: Parser tildes', parent: 'develop' },
    ];

    return (
      <div className="space-y-6">
        {/* Quality Gates */}
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB] mb-3">Quality Gates</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { name: 'ESLint', status: 'success', desc: 'JavaScript/TypeScript' },
              { name: 'Ruff', status: 'success', desc: 'Python linting' },
              { name: 'MyPy', status: 'success', desc: 'Python type checking' },
              { name: 'Pytest', status: 'success', desc: 'Coverage > 80%' },
              { name: 'SonarQube', status: 'success', desc: 'Code quality' },
              { name: 'Trivy', status: 'success', desc: 'Security scan' },
              { name: 'Docker Build', status: 'success', desc: 'Image build' },
              { name: 'Deploy', status: 'pending', desc: 'Staging environment' },
            ].map(g => (
              <div key={g.name} className={`border rounded-lg p-3 ${g.status === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : g.status === 'failed' ? 'border-red-500/30 bg-red-500/5' : 'border-white/8 bg-[#1E1F2B]'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={STEP_STATUS_COLOR[g.status]}>{STEP_STATUS_ICON[g.status]}</span>
                  <span className="text-xs font-semibold text-[#F9FAFB]">{g.name}</span>
                </div>
                <p className="text-xs text-[#6B7280]">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Git Flow */}
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB] mb-3">Git Flow</h3>
          <Card className="p-4">
            <div className="space-y-2">
              {gitFlowBranches.map(b => (
                <div key={b.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-2" style={{ paddingLeft: b.parent ? '24px' : '0' }}>
                    {b.parent && <div className="w-4 h-4 border-l-2 border-b-2 border-white/10 rounded-bl" />}
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: b.color }} />
                    <code className="text-xs text-[#F9FAFB] font-mono">{b.name}</code>
                  </div>
                  <span className="text-xs text-[#6B7280]">{b.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Pipeline Runs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#F9FAFB]">Pipeline CI/CD</h3>
            {isManager && <Button variant="secondary" size="sm" icon={<Play size={12} />} onClick={simulatePipeline}>Simular pipeline</Button>}
          </div>
          {projPipelines.length === 0 ? (
            <EmptyState icon={<GitBranch size={22} />} title="Sin pipelines" description="Inicia un pipeline para ver el historial de CI/CD." />
          ) : (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                {projPipelines.map(run => (
                  <div key={run.id} onClick={() => setSelectedRun(run)} className={`bg-[#12131C] border rounded-xl p-3 cursor-pointer transition-all ${selectedRun?.id === run.id ? 'border-blue-500/50' : 'border-white/8 hover:border-white/15'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${run.status === 'success' ? 'text-emerald-400' : run.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>{run.status.toUpperCase()}</span>
                      <code className="text-xs text-[#6B7280] font-mono">{run.commit}</code>
                    </div>
                    <p className="text-xs text-[#F9FAFB] truncate">{run.message}</p>
                    <p className="text-xs text-[#4B5563] mt-1">{run.branch} · {run.author}</p>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-2">
                {selectedRun && (
                  <Card className="p-4">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${selectedRun.status === 'success' ? 'text-emerald-400' : selectedRun.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>{selectedRun.status.toUpperCase()}</span>
                        <code className="text-xs text-[#6B7280] font-mono">{selectedRun.commit}</code>
                      </div>
                      <p className="text-sm text-[#F9FAFB]">{selectedRun.message}</p>
                      <p className="text-xs text-[#6B7280]">{selectedRun.branch} · {selectedRun.author} · {new Date(selectedRun.startedAt).toLocaleString('es-CO')}</p>
                    </div>
                    <div className="space-y-2">
                      {selectedRun.steps.map(step => (
                        <div key={step.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${selectedStep?.id === step.id ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/4 hover:border-white/10'}`}
                          onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}>
                          <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center ${STEP_STATUS_BG[step.status] || ''} ${STEP_STATUS_COLOR[step.status] || ''}`}>
                            {STEP_STATUS_ICON[step.status]}
                          </span>
                          <span className="flex-1 text-sm text-[#F9FAFB]">{step.name}</span>
                          {step.duration && <span className="text-xs text-[#6B7280]">{step.duration}s</span>}
                        </div>
                      ))}
                    </div>
                    {selectedStep?.log && (
                      <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/6">
                        <p className="text-xs font-semibold text-red-400 mb-1">Log del paso: {selectedStep.name}</p>
                        <pre className="text-xs text-[#9CA3AF] font-mono whitespace-pre-wrap overflow-x-auto">{selectedStep.log}</pre>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── AI METRICS ─────────────────────────────────────────────────────────────
  function AIMetricsTab() {
    const [selectedInteraction, setSelectedInteraction] = useState(null);
    const accepted = projAIInteractions.filter(i => i.accepted === true).length;
    const modified = projAIInteractions.filter(i => i.modified).length;
    const rejected = projAIInteractions.filter(i => i.rejected).length;
    const totalTimeSaved = projAIInteractions.reduce((a, i) => a + (i.actualTimeSavedMin || i.estimatedTimeSavedMin), 0);
    const errorsIntroduced = projAIInteractions.reduce((a, i) => a + i.errorsIntroduced, 0);
    const avgUtility = projAIInteractions.length ? (projAIInteractions.reduce((a, i) => a + i.perceivedUtility, 0) / projAIInteractions.length).toFixed(1) : '—';

    return (
      <div className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Interacciones totales', value: projAIInteractions.length, color: 'text-violet-400' },
            { label: 'Sugerencias aceptadas', value: accepted, color: 'text-emerald-400' },
            { label: 'Sugerencias modificadas', value: modified, color: 'text-blue-400' },
            { label: 'Sugerencias rechazadas', value: rejected, color: 'text-red-400' },
            { label: 'Tiempo ahorrado (min)', value: totalTimeSaved, color: 'text-yellow-400' },
            { label: 'Utilidad promedio', value: `${avgUtility}/5`, color: 'text-pink-400' },
          ].map(k => (
            <div key={k.label} className="bg-[#1E1F2B] border border-white/6 rounded-xl p-4">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {errorsIntroduced > 0 && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">Errores introducidos por IA: {errorsIntroduced}</p>
              <p className="text-xs text-[#9CA3AF]">Revisar interacciones marcadas con errores para aprender y mejorar los prompts.</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB] mb-3">Registro de interacciones IA</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  {['Actividad','Modelo','Resultado IA','Resultado humano','Resultado final','Aceptada','Modificada','Tiempo (min)','Utilidad'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[#6B7280] font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projAIInteractions.map(ia => (
                  <tr key={ia.id} className="border-b border-white/4 hover:bg-white/2 cursor-pointer" onClick={() => setSelectedInteraction(selectedInteraction?.id === ia.id ? null : ia)}>
                    <td className="py-2 px-3 text-[#F9FAFB] max-w-32 truncate">{ia.activity}</td>
                    <td className="py-2 px-3 text-[#6B7280]">{ia.model}</td>
                    <td className="py-2 px-3 text-[#9CA3AF] max-w-32 truncate">{ia.aiResult}</td>
                    <td className="py-2 px-3 text-[#9CA3AF] max-w-32 truncate">{ia.humanResult || '—'}</td>
                    <td className="py-2 px-3 text-[#9CA3AF] max-w-32 truncate">{ia.finalResult || '—'}</td>
                    <td className="py-2 px-3">{ia.accepted === true ? <span className="text-emerald-400">Sí</span> : ia.accepted === false ? <span className="text-red-400">No</span> : <span className="text-[#6B7280]">—</span>}</td>
                    <td className="py-2 px-3">{ia.modified ? <span className="text-blue-400">Sí</span> : '—'}</td>
                    <td className="py-2 px-3 text-yellow-400">{ia.actualTimeSavedMin || ia.estimatedTimeSavedMin}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <div key={n} className={`w-2 h-2 rounded-sm ${n <= ia.perceivedUtility ? 'bg-violet-400' : 'bg-[#374151]'}`} />)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedInteraction && (
            <div className="mt-3 bg-[#1E1F2B] border border-white/8 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[#F9FAFB]">{selectedInteraction.activity}</p>
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div><p className="text-[#6B7280] mb-1">Prompt enviado</p><p className="text-[#9CA3AF] bg-black/20 rounded p-2">{selectedInteraction.prompt}</p></div>
                <div><p className="text-[#6B7280] mb-1">Resultado IA</p><p className="text-[#9CA3AF] bg-black/20 rounded p-2">{selectedInteraction.aiResult}</p></div>
                {selectedInteraction.humanResult && <div><p className="text-[#6B7280] mb-1">Revisión humana</p><p className="text-[#9CA3AF] bg-black/20 rounded p-2">{selectedInteraction.humanResult}</p></div>}
                {selectedInteraction.finalResult && <div><p className="text-[#6B7280] mb-1">Resultado final</p><p className="text-emerald-400 bg-emerald-500/5 rounded p-2">{selectedInteraction.finalResult}</p></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── TRACEABILITY ──────────────────────────────────────────────────────────
  function TraceabilityTab() {
    const [selectedEpic, setSelectedEpic] = useState(projEpics[0]?.id ?? null);
    const epic = projEpics.find(e => e.id === selectedEpic);
    const epicStories = projStories.filter(s => s.epicId === selectedEpic);

    return (
      <div className="space-y-5">
        <div className="bg-[#1E1F2B] border border-white/6 rounded-xl p-4">
          <p className="text-xs text-[#6B7280] mb-3">Vista de trazabilidad completa del proyecto. Sigue el hilo desde la Épica hasta el resultado final.</p>
          <div className="flex flex-wrap gap-2 text-xs text-[#6B7280] items-center">
            {['Proyecto', 'Épica', 'Historia de Usuario', 'Sprint', 'Tarea', 'Fix', 'Evidencia', 'Análisis IA', 'Solución', 'Resultado'].map((l, i, arr) => (
              <React.Fragment key={l}>
                <span className="bg-[#12131C] border border-white/8 px-2 py-1 rounded">{l}</span>
                {i < arr.length - 1 && <ChevronRight size={10} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Epic selector */}
        <div className="flex gap-2 flex-wrap">
          {projEpics.map(e => (
            <button key={e.id} onClick={() => setSelectedEpic(e.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${selectedEpic === e.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/8 text-[#6B7280] hover:border-white/15'}`}>
              <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
              {e.name}
            </button>
          ))}
        </div>

        {epic && (
          <div className="space-y-3">
            {/* Epic node */}
            <div className="bg-[#1E1F2B] border-l-4 rounded-r-xl p-4" style={{ borderLeftColor: epic.color }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#6B7280]">ÉPICA</span>
                <StatusBadge status={epic.status} />
              </div>
              <p className="font-semibold text-[#F9FAFB]">{epic.name}</p>
              <p className="text-xs text-[#6B7280]">{epic.description}</p>
            </div>

            {epicStories.length === 0 ? <p className="text-xs text-[#6B7280]">Sin historias en esta épica.</p> : (
              epicStories.map(story => {
                const storyTasks = projTasks.filter(t => t.storyId === story.id);
                const storyFixes = projFixes.filter(f => f.storyId === story.id);
                const sprint = story.sprintId ? projSprints.find(s => s.id === story.sprintId) : null;
                const assignee = story.assigneeId ? users.find(u => u.id === story.assigneeId) : null;

                return (
                  <div key={story.id} className="ml-6 space-y-2">
                    {/* Story */}
                    <div className="bg-[#12131C] border border-white/8 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-[#6B7280]">HU</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${story.priority === 'critical' ? 'bg-red-500/20 text-red-400' : story.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{story.priority}</span>
                        <StatusBadge status={story.status} />
                        {sprint && <span className="text-xs text-[#6B7280]">{sprint.name}</span>}
                        <span className="text-xs text-[#6B7280]">{story.points}pt</span>
                        {assignee && <Avatar name={`${assignee.name} ${assignee.lastName}`} size={16} />}
                      </div>
                      <p className="text-sm font-medium text-[#F9FAFB] mb-1">{story.title}</p>

                      {/* Tasks */}
                      {storyTasks.length > 0 && (
                        <div className="mt-3 pl-3 border-l border-white/6">
                          <p className="text-xs text-[#6B7280] mb-2">Tareas ({storyTasks.length})</p>
                          <div className="space-y-1">
                            {storyTasks.map(t => {
                              const ta = t.assigneeId ? users.find(u => u.id === t.assigneeId) : null;
                              return (
                                <div key={t.id} className="flex items-center gap-2 text-xs">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: TaskStatusColor(t.status) }} />
                                  <span className="text-[#9CA3AF] flex-1">{t.title}</span>
                                  <span className="text-[#4B5563]">{t.loggedHours}h/{t.estimatedHours}h</span>
                                  {ta && <span className="text-[#4B5563]">{ta.name}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fixes */}
                      {storyFixes.length > 0 && (
                        <div className="mt-3 pl-3 border-l border-orange-500/30">
                          <p className="text-xs text-orange-400 mb-2">Fixes ({storyFixes.length})</p>
                          {storyFixes.map(fix => {
                            const fixEvs = evidences.filter(e => e.fixId === fix.id);
                            const fixAnalysis = aiAnalyses.filter(a => a.fixId === fix.id);
                            return (
                              <div key={fix.id} className="text-xs space-y-1 mb-3">
                                <div className="flex items-center gap-2">
                                  <Wrench size={11} className="text-orange-400 shrink-0" />
                                  <span className={`text-[#F9FAFB]`}>{fix.title}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${fix.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>{fix.status}</span>
                                </div>
                                {fixEvs.length > 0 && <p className="text-[#4B5563] pl-4">Evidencias: {fixEvs.map(e => e.title).join(', ')}</p>}
                                {fixAnalysis.length > 0 && <p className="text-violet-400 pl-4">Análisis IA: {fixAnalysis.length} diagnóstico(s)</p>}
                                {fix.solution && <p className="text-emerald-400 pl-4">Solución: {fix.solution.substring(0, 80)}...</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Audit trail */}
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB] mb-3">Audit Log del proyecto</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {projAuditLogs.length === 0 ? (
              <p className="text-xs text-[#6B7280]">Sin entradas de auditoría.</p>
            ) : projAuditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(log => {
              const u = users.find(u => u.id === log.userId);
              return (
                <div key={log.id} className="flex items-start gap-3 py-2 px-3 bg-[#1E1F2B] rounded-lg border border-white/4">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.result === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className="flex-1 text-xs">
                    <span className="text-[#F9FAFB] font-medium">{log.action}</span>
                    <span className="text-[#6B7280]"> · {log.entity} · {u ? `${u.name} ${u.lastName}` : 'Sistema'}</span>
                    <span className="text-[#4B5563] ml-2">{new Date(log.createdAt).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'team': return <TeamTab />;
      case 'backlog': return <BacklogTab />;
      case 'sprints': return <SprintsTab />;
      case 'kanban': return <KanbanTab />;
      case 'meetings': return <MeetingsTab />;
      case 'docs': return <DocsTab />;
      case 'metrics': return <MetricsTab />;
      case 'fixes': return <FixesTab />;
      case 'knowledge': return <KnowledgeTab />;
      case 'devops': return <DevOpsTab />;
      case 'ai-metrics': return <AIMetricsTab />;
      default: return null;
    }
  };

  return (
    <AppShell>
      {/* Project header */}
      <div className="mb-5">
        <button onClick={() => navigate({ page: 'projects' })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#9CA3AF] transition-colors mb-4">
          <ArrowLeft size={14} /> Proyectos
        </button>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-[#F9FAFB]">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-[#9CA3AF] mb-2">{project.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {manager && (
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Avatar name={`${manager.name} ${manager.lastName}`} size={18} />
                  <span>{manager.name} {manager.lastName}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                {members.slice(0, 5).map(m => <Avatar key={m.id} name={`${m.name} ${m.lastName}`} size={20} className="-ml-1 first:ml-0 border border-[#0A0B0E]" />)}
                {members.length > 5 && <span className="text-xs text-[#6B7280] ml-1">+{members.length - 5}</span>}
              </div>
              {project.meetingLink && (
                <a href={project.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  <Video size={12} /> Reunión <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isManager && (
              <>
                <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportBacklog}>
                  Exportar Backlog
                </Button>
                <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportProjectInfo}>
                  Exportar Info
                </Button>
                <label className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-[#1E1F2B] border border-white/10 text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-white/20 cursor-pointer transition-colors">
                  <Upload size={13} /> Importar Backlog
                  <input type="file" accept=".js,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importBacklog(f); e.target.value = ''; }} />
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-[#1E1F2B] border border-white/10 text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-white/20 cursor-pointer transition-colors">
                  <Upload size={13} /> Importar Info
                  <input type="file" accept=".js,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importProjectInfo(f); e.target.value = ''; }} />
                </label>
                <Button variant="secondary" size="sm" icon={<Edit2 size={13} />} onClick={() => navigate({ page: 'projects' })}>
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/6 mb-5">
        <Tabs tabs={tabsWithBadges} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="fade-in">{renderTab()}</div>
    </AppShell>
  );
}
