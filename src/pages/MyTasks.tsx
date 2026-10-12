// @ts-nocheck
import React, { useState } from 'react';
import { CheckSquare, Clock, AlertTriangle, Filter, ChevronDown, ChevronRight, Plus, Play, PauseCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { AppShell } from '../components/Layout';
import { useApp } from '../store';

const STATUS_LABEL: Record<string, string> = {
  'todo': 'Por hacer',
  'in-progress': 'En progreso',
  'code-review': 'Code Review',
  'testing': 'Testing',
  'completed': 'Completado',
  'blocked': 'Bloqueado',
};

const STATUS_COLOR: Record<string, string> = {
  'todo': 'bg-[#374151] text-[#9CA3AF]',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  'code-review': 'bg-violet-500/20 text-violet-400',
  'testing': 'bg-amber-500/20 text-amber-400',
  'completed': 'bg-emerald-500/20 text-emerald-400',
  'blocked': 'bg-red-500/20 text-red-400',
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-[#6B7280]',
};

function HelpTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="w-4 h-4 rounded-full border border-white/20 text-[#6B7280] hover:text-[#F9FAFB] text-xs flex items-center justify-center transition-colors"
        aria-label="Ayuda"
      >?</button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#272A38] border border-white/12 rounded-lg px-3 py-2 text-xs text-[#D1D5DB] z-50 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

export default function MyTasks() {
  const { state, dispatch, showToast } = useApp();
  const { currentUser, tasks, stories, projects, sprints, issues, fixes } = state;
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'issues'>('tasks');

  if (!currentUser) return null;

  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
  const myIssues = issues.filter(i => i.assigneeId === currentUser.id || i.reporterId === currentUser.id);
  const myFixes = fixes.filter(f => f.assigneeId === currentUser.id);

  const filteredTasks = myTasks
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .filter(t => projectFilter === 'all' || t.projectId === projectFilter);

  const myProjects = projects.filter(p => p.memberIds.includes(currentUser.id) || p.managerId === currentUser.id);

  function updateTaskStatus(taskId: string, newStatus: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    dispatch({ type: 'UPDATE_TASK', task: { ...task, status: newStatus as any, updatedAt: new Date().toISOString() } });
    showToast(`Tarea actualizada a "${STATUS_LABEL[newStatus]}"`, 'success');
  }

  function logHours(taskId: string, hours: number) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    dispatch({ type: 'UPDATE_TASK', task: { ...task, loggedHours: task.loggedHours + hours, updatedAt: new Date().toISOString() } });
    showToast(`+${hours}h registradas`, 'success');
  }

  // Group tasks by story
  const tasksByStory: Record<string, typeof myTasks> = {};
  filteredTasks.forEach(t => {
    if (!tasksByStory[t.storyId]) tasksByStory[t.storyId] = [];
    tasksByStory[t.storyId].push(t);
  });

  const pendingCount = myTasks.filter(t => t.status !== 'completed').length;
  const completedCount = myTasks.filter(t => t.status === 'completed').length;
  const blockedCount = myTasks.filter(t => t.status === 'blocked').length;
  const totalHoursEstimated = myTasks.reduce((a, t) => a + t.estimatedHours, 0);
  const totalHoursLogged = myTasks.reduce((a, t) => a + t.loggedHours, 0);

  return (
    <AppShell title="Mis Tareas">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#F9FAFB] flex items-center gap-2">
            Mis Tareas
            <HelpTooltip text="Vista centralizada de todas las tareas asignadas a ti. Actualiza estados directamente desde aquí sin navegar al proyecto." />
          </h1>
          <p className="text-sm text-[#6B7280]">Gestiona tu trabajo asignado en todos los proyectos</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <div className="text-xs text-[#6B7280] bg-[#1E1F2B] border border-white/8 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <Clock size={12} />
            {totalHoursLogged}h / {totalHoursEstimated}h
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pendientes', value: pendingCount, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Completadas', value: completedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Bloqueadas', value: blockedCount, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Issues asignados', value: myIssues.length, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map(kpi => (
          <div key={kpi.label} className={`border rounded-xl p-4 ${kpi.bg}`}>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1E1F2B] rounded-xl p-1 mb-5 w-fit">
        {[
          { id: 'tasks', label: `Tareas (${myTasks.length})` },
          { id: 'issues', label: `Issues/Fixes (${myIssues.length + myFixes.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[#0A0B0E] text-[#F9FAFB] shadow' : 'text-[#6B7280] hover:text-[#F9FAFB]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[#6B7280]" />
              <span className="text-xs text-[#6B7280]">Filtros:</span>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-[#1E1F2B] border border-white/8 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="text-xs bg-[#1E1F2B] border border-white/8 rounded-lg px-3 py-1.5 text-[#F9FAFB] focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los proyectos</option>
              {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="border border-white/8 rounded-xl p-12 text-center">
              <CheckSquare size={40} className="text-[#374151] mx-auto mb-3" />
              <p className="text-[#9CA3AF] font-medium mb-1">Sin tareas</p>
              <p className="text-sm text-[#6B7280]">No tienes tareas que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(tasksByStory).map(([storyId, storyTasks]) => {
                const story = stories.find(s => s.id === storyId);
                const project = projects.find(p => p.id === storyTasks[0]?.projectId);
                const sprint = storyTasks[0]?.sprintId ? sprints.find(s => s.id === storyTasks[0].sprintId) : null;
                const expanded = expandedStory === storyId;
                const completedInStory = storyTasks.filter(t => t.status === 'completed').length;

                return (
                  <div key={storyId} className="bg-[#12131C] border border-white/8 rounded-xl overflow-hidden">
                    {/* Story header */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
                      onClick={() => setExpandedStory(expanded ? null : storyId)}
                    >
                      {expanded ? <ChevronDown size={14} className="text-[#6B7280] shrink-0" /> : <ChevronRight size={14} className="text-[#6B7280] shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[#F9FAFB] truncate">{story?.title || 'Historia desconocida'}</span>
                          {project && <span className="text-xs bg-[#1E1F2B] border border-white/8 text-[#6B7280] px-2 py-0.5 rounded">{project.name}</span>}
                          {sprint && <span className="text-xs text-[#6B7280]">{sprint.name}</span>}
                        </div>
                      </div>
                      <div className="text-xs text-[#6B7280] shrink-0">
                        {completedInStory}/{storyTasks.length} completadas
                      </div>
                    </button>
                    {/* Progress bar */}
                    <div className="h-0.5 bg-[#1E1F2B] mx-4">
                      <div
                        className="h-full bg-emerald-500 rounded transition-all"
                        style={{ width: `${storyTasks.length ? (completedInStory / storyTasks.length) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Tasks */}
                    {expanded && (
                      <div className="divide-y divide-white/4">
                        {storyTasks.map(task => (
                          <TaskRow key={task.id} task={task} onStatusChange={updateTaskStatus} onLogHours={logHours} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'issues' && (
        <div className="space-y-3">
          {myIssues.length === 0 && myFixes.length === 0 ? (
            <div className="border border-white/8 rounded-xl p-12 text-center">
              <AlertTriangle size={40} className="text-[#374151] mx-auto mb-3" />
              <p className="text-[#9CA3AF] font-medium">Sin issues asignados</p>
            </div>
          ) : (
            <>
              {myIssues.map(issue => {
                const project = projects.find(p => p.id === issue.projectId);
                return (
                  <div key={issue.id} className="bg-[#12131C] border border-white/8 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${PRIORITY_COLOR[issue.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-[#F9FAFB]">{issue.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[issue.status] || 'bg-[#374151] text-[#9CA3AF]'}`}>
                            {issue.status.replace('-', ' ')}
                          </span>
                          <span className={`text-xs font-semibold uppercase ${PRIORITY_COLOR[issue.priority]}`}>{issue.priority}</span>
                        </div>
                        <p className="text-xs text-[#6B7280] mb-2">{issue.description}</p>
                        <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                          {project && <span>{project.name}</span>}
                          <span>{new Date(issue.createdAt).toLocaleDateString('es-CO')}</span>
                          {issue.reporterId === currentUser.id && <span className="text-blue-400">Reportado por ti</span>}
                          {issue.assigneeId === currentUser.id && <span className="text-violet-400">Asignado a ti</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {myFixes.map(fix => {
                const project = projects.find(p => p.id === fix.projectId);
                return (
                  <div key={fix.id} className="bg-[#12131C] border border-white/8 rounded-xl p-4 border-l-2 border-l-orange-500">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 text-xs font-bold shrink-0 ${PRIORITY_COLOR[fix.priority]}`}>FIX</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-[#F9FAFB]">{fix.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            fix.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                            fix.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                            fix.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                            'bg-[#374151] text-[#9CA3AF]'
                          }`}>
                            {fix.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] mb-2">{fix.description}</p>
                        <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                          {project && <span>{project.name}</span>}
                          {fix.estimatedCost && <span>Costo est.: {fix.estimatedCost.toLocaleString()} {fix.currency}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}

function TaskRow({ task, onStatusChange, onLogHours }: {
  task: any;
  onStatusChange: (id: string, status: string) => void;
  onLogHours: (id: string, hours: number) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const progress = task.estimatedHours > 0 ? Math.min((task.loggedHours / task.estimatedHours) * 100, 100) : 0;

  return (
    <div className="px-4 py-3 hover:bg-white/2 transition-colors">
      <div className="flex items-start gap-3">
        <button
          onClick={() => setShowActions(v => !v)}
          className={`w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
            task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
            task.status === 'blocked' ? 'border-red-500/50 text-red-400' :
            'border-white/20 hover:border-blue-400'
          }`}
        >
          {task.status === 'completed' && <CheckCircle2 size={12} />}
          {task.status === 'blocked' && <XCircle size={12} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-[#6B7280]' : 'text-[#F9FAFB]'}`}>
              {task.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[task.status] || 'bg-[#374151] text-[#9CA3AF]'}`}>
              {STATUS_LABEL[task.status]}
            </span>
          </div>
          {task.description && <p className="text-xs text-[#6B7280] mb-2 line-clamp-1">{task.description}</p>}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <Clock size={11} />
              <span>{task.loggedHours}h / {task.estimatedHours}h</span>
            </div>
            <div className="flex-1 max-w-24 h-1 bg-[#1E1F2B] rounded-full">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <button
              onClick={() => onLogHours(task.id, 1)}
              className="text-xs text-[#6B7280] hover:text-blue-400 transition-colors"
              title="Registrar 1 hora"
            >
              +1h
            </button>
          </div>
          {showActions && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['todo', 'in-progress', 'code-review', 'testing', 'completed', 'blocked'].map(s => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(task.id, s); setShowActions(false); }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${task.status === s ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-white/10 text-[#6B7280] hover:border-white/20 hover:text-[#F9FAFB]'}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
