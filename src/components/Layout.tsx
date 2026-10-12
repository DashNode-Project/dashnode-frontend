import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, FolderOpen, Calendar, Clock, User,
  LogOut, Menu, ChevronLeft, Video, Layers, ChevronRight,
  Brain, Mic, MicOff, Send, X, Bell, Search, CheckSquare,
  AlertTriangle, BookOpen,
} from 'lucide-react';
import { useApp } from '../store';
import { Avatar, Badge } from './ui';
import { NavState } from '../types';

interface NavItem {
  id: NavState['page'];
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'manager', 'developer'] },
  { id: 'users', label: 'Usuarios', icon: <Users size={18} />, roles: ['admin'] },
  { id: 'projects', label: 'Proyectos', icon: <FolderOpen size={18} />, roles: ['manager', 'developer'] },
  { id: 'my-tasks', label: 'Mis Tareas', icon: <CheckSquare size={18} />, roles: ['developer', 'manager'] },
  { id: 'meetings', label: 'Reuniones', icon: <Video size={18} />, roles: ['manager', 'developer'] },
  { id: 'calendar', label: 'Calendario', icon: <Calendar size={18} />, roles: ['manager', 'developer'] },
  { id: 'availability', label: 'Disponibilidad', icon: <Clock size={18} />, roles: ['manager', 'developer'] },
  { id: 'profile', label: 'Perfil', icon: <User size={18} />, roles: ['admin', 'manager', 'developer'] },
  { id: 'user-manual', label: 'Manual de Usuario', icon: <BookOpen size={18} />, roles: ['manager', 'developer'] },
];

function NavLink({ item, active, collapsed, onClick }: {
  item: NavItem; active: boolean; collapsed: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm font-medium transition-colors group relative ${
        active ? 'bg-blue-500/15 text-blue-400' : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
      }`}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
      {collapsed && (
        <span className="absolute left-full ml-2 bg-[#272A38] text-[#F9FAFB] text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-50 border border-white/10">
          {item.label}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { state, dispatch, navigate, logout } = useApp();
  const { currentUser, sidebarOpen: open, nav } = state;
  if (!currentUser) return null;
  const role = currentUser.role;
  const filtered = NAV_ITEMS.filter(i => i.roles.includes(role));

  return (
    <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col bg-[#0A0B0E] border-r border-white/6 sidebar-transition ${open ? 'w-56' : 'w-[52px]'}`}>
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-white/6 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <Layers size={16} className="text-white" />
        </div>
        {open && <span className="text-sm font-bold text-[#F9FAFB]">DashNode</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {filtered.map(item => (
          <NavLink
            key={item.id}
            item={item}
            active={nav.page === item.id}
            collapsed={!open}
            onClick={() => navigate({ page: item.id })}
          />
        ))}
      </nav>

      <div className="px-2 py-2 border-t border-white/6 flex flex-col gap-0.5">
        <button
          onClick={() => navigate({ page: 'profile' })}
          className={`w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors group relative ${nav.page === 'profile' ? 'bg-blue-500/15 text-blue-400' : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'}`}
          title={!open ? 'Perfil' : undefined}
        >
          <User size={18} className="shrink-0" />
          {open && <span>Perfil</span>}
          {!open && <span className="absolute left-full ml-2 bg-[#272A38] text-[#F9FAFB] text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-50 border border-white/10">Perfil</span>}
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/8 transition-colors group relative"
          title={!open ? 'Salir' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {open && <span>Salir</span>}
          {!open && <span className="absolute left-full ml-2 bg-[#272A38] text-[#F9FAFB] text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-50 border border-white/10">Salir</span>}
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          {open && <span>Contraer</span>}
        </button>
      </div>

      {open && (
        <div className="px-3 py-3 border-t border-white/6">
          <div className="flex items-center gap-2">
            <Avatar name={`${currentUser.name} ${currentUser.lastName}`} size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#F9FAFB] truncate">{currentUser.name} {currentUser.lastName}</p>
              <p className="text-xs text-[#6B7280] truncate">@{currentUser.nickname}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const { currentUser, notifications } = state;
  if (!currentUser) return null;
  const myNotifications = notifications
    .filter(n => n.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = myNotifications.filter(n => !n.read).length;

  const typeColors: Record<string, string> = { assignment: 'text-blue-400', meeting: 'text-emerald-400', sprint: 'text-violet-400', fix: 'text-orange-400', ai: 'text-pink-400', security: 'text-red-400', document: 'text-yellow-400', story: 'text-cyan-400', task: 'text-blue-400' };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-[#12131C] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[#9CA3AF]" />
          <span className="text-sm font-medium text-[#F9FAFB]">Notificaciones</span>
          {unread > 0 && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>}
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ', userId: currentUser.id })} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Leer todas
            </button>
          )}
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#F9FAFB]"><X size={14} /></button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {myNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#6B7280]">Sin notificaciones</div>
        ) : myNotifications.map(n => (
          <div
            key={n.id}
            className={`px-4 py-3 border-b border-white/4 cursor-pointer hover:bg-white/3 transition-colors ${!n.read ? 'bg-blue-500/4' : ''}`}
            onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', notificationId: n.id })}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 ${typeColors[n.type] || 'text-[#6B7280]'}`}>
                <Bell size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium mb-0.5 ${!n.read ? 'text-[#F9FAFB]' : 'text-[#9CA3AF]'}`}>{n.title}</p>
                <p className="text-xs text-[#6B7280] leading-relaxed">{n.message}</p>
                <p className="text-xs text-[#4B5563] mt-1">{new Date(n.createdAt).toLocaleDateString('es-CO')}</p>
              </div>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const { state, navigate } = useApp();
  const { projects, tasks, stories, users, fixes, documents, knowledge, currentUser } = state;
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const q = query.toLowerCase().trim();

  interface CmdItem { label: string; sublabel?: string; action: () => void; }
  interface CmdSection { title: string; items: CmdItem[]; }

  const myProjects = currentUser ? projects.filter(p => p.memberIds.includes(currentUser.id) || p.managerId === currentUser.id) : projects;

  const navCmds: CmdItem[] = [
    { label: 'Dashboard', action: () => { navigate({ page: 'dashboard' }); onClose(); } },
    { label: 'Proyectos', action: () => { navigate({ page: 'projects' }); onClose(); } },
    { label: 'Mis Tareas', action: () => { navigate({ page: 'my-tasks' }); onClose(); } },
    { label: 'Reuniones', action: () => { navigate({ page: 'meetings' }); onClose(); } },
    { label: 'Calendario', action: () => { navigate({ page: 'calendar' }); onClose(); } },
    { label: 'Disponibilidad', action: () => { navigate({ page: 'availability' }); onClose(); } },
    { label: 'Manual de Usuario', action: () => { navigate({ page: 'user-manual' }); onClose(); } },
  ].filter(c => !q || c.label.toLowerCase().includes(q));

  const projectResults: CmdItem[] = myProjects.filter(p => !q || p.name.toLowerCase().includes(q)).slice(0, 4).map(p => ({
    label: p.name, sublabel: 'Proyecto', action: () => { navigate({ page: 'project-workspace', projectId: p.id }); onClose(); },
  }));

  const taskResults: CmdItem[] = tasks.filter(t => !q || t.title.toLowerCase().includes(q)).slice(0, 3).map(t => ({
    label: t.title, sublabel: 'Tarea', action: () => { navigate({ page: 'my-tasks' }); onClose(); },
  }));

  const storyResults: CmdItem[] = stories.filter(s => !q || s.title.toLowerCase().includes(q)).slice(0, 3).map(s => ({
    label: s.title, sublabel: 'Historia de Usuario', action: () => {
      const p = projects.find(px => px.id === s.projectId);
      if (p) navigate({ page: 'project-workspace', projectId: p.id, projectTab: 'backlog' });
      onClose();
    },
  }));

  const fixResults: CmdItem[] = fixes.filter(f => !q || f.title.toLowerCase().includes(q)).slice(0, 3).map(f => ({
    label: f.title, sublabel: 'Fix', action: () => {
      const p = projects.find(px => px.id === f.projectId);
      if (p) navigate({ page: 'project-workspace', projectId: p.id, projectTab: 'fixes' });
      onClose();
    },
  }));

  const docResults: CmdItem[] = documents.filter(d => !q || d.title.toLowerCase().includes(q)).slice(0, 2).map(d => ({
    label: d.title, sublabel: 'Documento', action: () => {
      const p = projects.find(px => px.id === d.projectId);
      if (p) navigate({ page: 'project-workspace', projectId: p.id, projectTab: 'docs' });
      onClose();
    },
  }));

  const knowledgeResults: CmdItem[] = knowledge.filter(k => !q || k.title.toLowerCase().includes(q)).slice(0, 2).map(k => ({
    label: k.title, sublabel: 'Conocimiento', action: () => {
      const p = projects.find(px => px.id === k.projectId);
      if (p) navigate({ page: 'project-workspace', projectId: p.id, projectTab: 'knowledge' });
      onClose();
    },
  }));

  const userResults: CmdItem[] = users.filter(u => !q || `${u.name} ${u.lastName}`.toLowerCase().includes(q)).slice(0, 2).map(u => ({
    label: `${u.name} ${u.lastName}`, sublabel: u.role, action: () => { navigate({ page: 'profile', userId: u.id }); onClose(); },
  }));

  const sections: CmdSection[] = [
    { title: 'Navegar', items: navCmds.slice(0, 5) },
    { title: 'Proyectos', items: projectResults },
    { title: 'Tareas', items: taskResults },
    { title: 'Historias', items: storyResults },
    { title: 'Fixes', items: fixResults },
    { title: 'Documentos', items: docResults },
    { title: 'Conocimiento', items: knowledgeResults },
    { title: 'Usuarios', items: userResults },
  ].filter(s => s.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#12131C] border border-white/12 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
          <Search size={16} className="text-[#6B7280] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar proyectos, tareas, fixes, documentos..."
            className="flex-1 bg-transparent text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:outline-none"
          />
          <kbd className="text-xs text-[#6B7280] bg-white/6 px-1.5 py-0.5 rounded border border-white/10">Esc</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto py-2">
          {sections.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
              {query ? `Sin resultados para "${query}"` : 'Escribe para buscar'}
            </div>
          ) : sections.map(section => (
            <div key={section.title} className="mb-1">
              <div className="px-4 py-1.5">
                <span className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">{section.title}</span>
              </div>
              {section.items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm text-[#F9FAFB]">{item.label}</p>
                    {item.sublabel && <p className="text-xs text-[#6B7280]">{item.sublabel}</p>}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-white/6 flex gap-4 text-xs text-[#4B5563]">
          <span>Ctrl+K para abrir</span>
          <span>Esc para cerrar</span>
        </div>
      </div>
    </div>
  );
}

export function Topbar({ title, actions }: { title?: string; actions?: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const { currentUser, sidebarOpen, notifications } = state;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!currentUser) return null;
  const offset = sidebarOpen ? 'ml-56' : 'ml-[52px]';
  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;

  return (
    <>
      <header className={`fixed top-0 right-0 h-14 bg-[#0A0B0E]/90 backdrop-blur-sm border-b border-white/6 flex items-center gap-3 px-4 z-20 transition-all ${offset} left-0`}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="text-[#6B7280] hover:text-[#F9FAFB] transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        {title && <h1 className="text-sm font-semibold text-[#F9FAFB]">{title}</h1>}
        <div className="flex-1" />
        <button
          onClick={() => setShowCommandPalette(true)}
          className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg bg-white/5 border border-white/8 text-xs text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors"
          title="Búsqueda global (Ctrl+K)"
        >
          <Search size={13} />
          <span>Buscar...</span>
          <kbd className="ml-2 text-xs bg-white/6 px-1 py-0.5 rounded border border-white/10 font-mono">⌘K</kbd>
        </button>
        {actions}
        {currentUser.role !== 'admin' && (
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Avatar name={`${currentUser.name} ${currentUser.lastName}`} size={30} />
          <div className="block lg:hidden">
            <p className="text-xs font-medium text-[#F9FAFB]">{currentUser.name}</p>
            <p className="text-xs text-[#6B7280]">{{ admin: 'Admin', manager: 'Gerente', developer: 'Desarrollador' }[currentUser.role]}</p>
          </div>
        </div>
      </header>
      {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} />}
    </>
  );
}

function AIFloatingWidget() {
  const { state } = useApp();
  const { currentUser, projects, tasks, sprints, meetings, fixes } = state;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hola, soy el asistente DashNode. Pregúntame sobre tus tareas, proyectos, sprints, reuniones, issues o fixes.' },
  ]);
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!currentUser) return null;

  function getReply(msg: string): string {
    const q = msg.toLowerCase();
    const myTasks = tasks.filter(t => t.assigneeId === currentUser!.id);
    const myProjects = projects.filter(p => p.managerId === currentUser!.id || p.memberIds.includes(currentUser!.id));
    const activeSprint = sprints.find(s => s.status === 'active');
    const nextMeeting = meetings.filter(m => m.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))[0];
    const openFixes = fixes.filter(f => f.status === 'open' || f.status === 'in-progress');

    if (q.includes('fix') || q.includes('bug')) return openFixes.length ? `Hay ${openFixes.length} fix(es) activos:\n${openFixes.slice(0, 3).map(f => `• [${f.priority.toUpperCase()}] ${f.title}`).join('\n')}` : 'No hay fixes activos.';
    if (q.includes('tarea') && (q.includes('pendiente') || q.includes('mis'))) {
      const pending = myTasks.filter(t => t.status !== 'completed');
      return pending.length ? `Tienes ${pending.length} tarea(s) pendiente(s):\n${pending.slice(0, 3).map(t => `• ${t.title}`).join('\n')}` : 'No tienes tareas pendientes.';
    }
    if (q.includes('proyecto')) return `Tienes acceso a ${myProjects.length} proyecto(s): ${myProjects.map(p => p.name).join(', ')}.`;
    if (q.includes('reunión') || q.includes('meeting')) return nextMeeting ? `Próxima reunión: "${nextMeeting.title}" el ${nextMeeting.date} a las ${nextMeeting.startTime}.` : 'No hay reuniones próximas.';
    if (q.includes('sprint')) return activeSprint ? `Sprint activo: "${activeSprint.name}". Fin: ${activeSprint.endDate}. Historias: ${activeSprint.storyIds.length}.` : 'No hay sprint activo.';
    if (q.includes('hola') || q.includes('ayuda')) return '¡Hola! Puedo responder preguntas sobre tus tareas, proyectos, sprints, reuniones y fixes. ¿Qué necesitas?';
    return 'No encontré información suficiente. Prueba: "¿qué tareas tengo pendientes?", "¿hay fixes activos?", "¿cuál es el sprint activo?".';
  }

  function send() {
    if (!query.trim() || thinking) return;
    const msg = query.trim();
    setQuery('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setThinking(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: getReply(msg) }]);
      setThinking(false);
    }, 700);
  }

  async function toggleVoice() {
    if (voiceState !== 'idle') { setVoiceState('idle'); return; }
    setVoiceState('recording');
    await new Promise(r => setTimeout(r, 2000));
    setVoiceState('processing');
    const demos = ['¿Qué tareas tengo pendientes?', '¿Hay fixes activos?', '¿Cuándo es la próxima reunión?'];
    const q = demos[Math.floor(Math.random() * demos.length)];
    await new Promise(r => setTimeout(r, 800));
    setMessages(m => [...m, { role: 'user', text: q + ' (voz)' }]);
    setThinking(true);
    setVoiceState('idle');
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: getReply(q) }]);
      setThinking(false);
    }, 700);
  }

  const quickSuggestions = ['Mis tareas pendientes', 'Fixes activos', 'Próxima reunión', 'Sprint activo'];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-[#12131C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 bg-[#0A0B0E]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Brain size={12} className="text-violet-400" />
              </div>
              <span className="text-sm font-medium text-[#F9FAFB]">DashNode AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <button onClick={() => setOpen(false)} className="text-[#6B7280] hover:text-[#F9FAFB]"><X size={14} /></button>
          </div>
          <div className="h-56 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain size={10} className="text-violet-400" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-[#1E1F2B] border border-white/8 text-[#F9FAFB]'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Brain size={10} className="text-violet-400" />
                </div>
                <div className="bg-[#1E1F2B] border border-white/8 rounded-xl px-3 py-2 flex gap-1">
                  {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {quickSuggestions.map(s => (
                <button key={s} onClick={() => setQuery(s)} className="text-xs bg-white/6 border border-white/8 text-[#9CA3AF] px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="px-3 py-2.5 border-t border-white/6 flex gap-2">
            <button
              onClick={toggleVoice}
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${voiceState === 'recording' ? 'bg-red-500 text-white animate-pulse' : voiceState === 'processing' ? 'bg-violet-500 text-white' : 'bg-[#1E1F2B] border border-white/10 text-[#6B7280] hover:text-[#F9FAFB]'}`}
              title={voiceState === 'recording' ? 'Detener' : 'Hablar'}
            >
              {voiceState === 'recording' ? <MicOff size={13} /> : <Mic size={13} />}
            </button>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Pregunta algo…"
              className="flex-1 bg-[#1E1F2B] border border-white/10 rounded-lg h-8 px-2.5 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={send}
              disabled={!query.trim() || thinking}
              className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all ${open ? 'bg-[#1E1F2B] border border-white/15 text-violet-400' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
        title="DashNode AI"
      >
        <Brain size={20} />
      </button>
    </div>
  );
}

export function AppShell({ children, title, headerActions }: { children: React.ReactNode; title?: string; headerActions?: React.ReactNode }) {
  const { state } = useApp();
  const offset = state.sidebarOpen ? 'ml-56' : 'ml-[52px]';
  return (
    <div className="min-h-screen bg-[#0A0B0E]">
      <Sidebar />
      <Topbar title={title} actions={headerActions} />
      <main className={`${offset} pt-14 transition-all min-h-screen`}>
        <div className="p-5 max-w-[1400px] mx-auto fade-in">
          {children}
        </div>
      </main>
      <AIFloatingWidget />
    </div>
  );
}
