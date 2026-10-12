import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  AppState, NavState, User, Project, Meeting, Task, UserStory, Epic, Sprint, Document,
  KnowledgeEntry, Fix, Evidence, AIAnalysis, AuditLog, Notification, AIInteraction, PipelineRun,
} from './types';
import {
  INITIAL_USERS, INITIAL_PROJECTS, INITIAL_EPICS, INITIAL_STORIES,
  INITIAL_TASKS, INITIAL_SPRINTS, INITIAL_MEETINGS,
  INITIAL_DOCUMENTS, INITIAL_KNOWLEDGE, PASSWORDS,
  INITIAL_FIXES, INITIAL_EVIDENCES, INITIAL_AI_ANALYSES,
  INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS, INITIAL_AI_INTERACTIONS, INITIAL_PIPELINE_RUNS,
} from './data';

type Action =
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'NAVIGATE'; nav: NavState }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; open: boolean }
  | { type: 'SHOW_TOAST'; message: string; toastType: 'success' | 'error' | 'info' }
  | { type: 'HIDE_TOAST' }
  | { type: 'ADD_USER'; user: User }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'DELETE_USER'; userId: string }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; projectId: string }
  | { type: 'ADD_MEETING'; meeting: Meeting }
  | { type: 'UPDATE_MEETING'; meeting: Meeting }
  | { type: 'DELETE_MEETING'; meetingId: string }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'ADD_STORY'; story: UserStory }
  | { type: 'UPDATE_STORY'; story: UserStory }
  | { type: 'DELETE_STORY'; storyId: string }
  | { type: 'ADD_EPIC'; epic: Epic }
  | { type: 'UPDATE_EPIC'; epic: Epic }
  | { type: 'DELETE_EPIC'; epicId: string }
  | { type: 'ADD_SPRINT'; sprint: Sprint }
  | { type: 'UPDATE_SPRINT'; sprint: Sprint }
  | { type: 'DELETE_SPRINT'; sprintId: string }
  | { type: 'ADD_DOCUMENT'; doc: Document }
  | { type: 'UPDATE_DOCUMENT'; doc: Document }
  | { type: 'DELETE_DOCUMENT'; docId: string }
  | { type: 'ADD_KNOWLEDGE'; entry: KnowledgeEntry }
  | { type: 'UPDATE_KNOWLEDGE'; entry: KnowledgeEntry }
  | { type: 'DELETE_KNOWLEDGE'; entryId: string }
  | { type: 'ADD_FIX'; fix: Fix }
  | { type: 'UPDATE_FIX'; fix: Fix }
  | { type: 'DELETE_FIX'; fixId: string }
  | { type: 'ADD_EVIDENCE'; evidence: Evidence }
  | { type: 'DELETE_EVIDENCE'; evidenceId: string }
  | { type: 'ADD_AI_ANALYSIS'; analysis: AIAnalysis }
  | { type: 'UPDATE_AI_ANALYSIS'; analysis: AIAnalysis }
  | { type: 'ADD_AUDIT_LOG'; log: AuditLog }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; notificationId: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ'; userId: string }
  | { type: 'ADD_AI_INTERACTION'; interaction: AIInteraction }
  | { type: 'UPDATE_AI_INTERACTION'; interaction: AIInteraction }
  | { type: 'ADD_PIPELINE_RUN'; run: PipelineRun }
  | { type: 'IMPORT_PROJECT'; project: Project; epics: Epic[]; stories: UserStory[]; tasks: Task[]; sprints: Sprint[] }
  | { type: 'IMPORT_BACKLOG'; projectId: string; epics: Epic[]; stories: UserStory[]; tasks: Task[] };

function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem('dashnode_state');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveState(state: AppState) {
  try {
    localStorage.setItem('dashnode_state', JSON.stringify({
      currentUser: state.currentUser,
      users: state.users,
      projects: state.projects,
      epics: state.epics,
      stories: state.stories,
      tasks: state.tasks,
      sprints: state.sprints,
      meetings: state.meetings,
      fixes: state.fixes,
      evidences: state.evidences,
      aiAnalyses: state.aiAnalyses,
      documents: state.documents,
      knowledge: state.knowledge,
      auditLogs: state.auditLogs,
      notifications: state.notifications,
      aiInteractions: state.aiInteractions,
      pipelineRuns: state.pipelineRuns,
      nav: state.nav,
    }));
  } catch {}
}

const saved = loadState();

const initialState: AppState = {
  currentUser: saved.currentUser ?? null,
  users: saved.users ?? INITIAL_USERS,
  projects: saved.projects ?? INITIAL_PROJECTS,
  epics: saved.epics ?? INITIAL_EPICS,
  stories: saved.stories ?? INITIAL_STORIES,
  tasks: saved.tasks ?? INITIAL_TASKS,
  sprints: saved.sprints ?? INITIAL_SPRINTS,
  meetings: saved.meetings ?? INITIAL_MEETINGS,
  fixes: saved.fixes ?? INITIAL_FIXES,
  evidences: saved.evidences ?? INITIAL_EVIDENCES,
  aiAnalyses: saved.aiAnalyses ?? INITIAL_AI_ANALYSES,
  documents: saved.documents ?? INITIAL_DOCUMENTS,
  knowledge: saved.knowledge ?? INITIAL_KNOWLEDGE,
  auditLogs: saved.auditLogs ?? INITIAL_AUDIT_LOGS,
  notifications: saved.notifications ?? INITIAL_NOTIFICATIONS,
  aiInteractions: saved.aiInteractions ?? INITIAL_AI_INTERACTIONS,
  pipelineRuns: saved.pipelineRuns ?? INITIAL_PIPELINE_RUNS,
  nav: saved.nav ?? (saved.currentUser ? { page: 'dashboard' } : { page: 'landing' }),
  sidebarOpen: true,
  toast: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.user, nav: { page: 'dashboard' } };
    case 'LOGOUT':
      return { ...state, currentUser: null, nav: { page: 'landing' }, sidebarOpen: true };
    case 'NAVIGATE':
      return { ...state, nav: action.nav };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.open };
    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.message, type: action.toastType } };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.user] };
    case 'UPDATE_USER': {
      const updated = state.users.map(u => u.id === action.user.id ? action.user : u);
      const curr = state.currentUser?.id === action.user.id ? action.user : state.currentUser;
      return { ...state, users: updated, currentUser: curr };
    }
    case 'DELETE_USER': {
      const tasks = state.tasks.map(t => t.assigneeId === action.userId && t.status !== 'completed' ? { ...t, assigneeId: undefined } : t);
      return { ...state, users: state.users.filter(u => u.id !== action.userId), tasks };
    }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.project] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.project.id ? action.project : p) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.projectId) };
    case 'ADD_MEETING':
      return { ...state, meetings: [...state.meetings, action.meeting] };
    case 'UPDATE_MEETING':
      return { ...state, meetings: state.meetings.map(m => m.id === action.meeting.id ? action.meeting : m) };
    case 'DELETE_MEETING':
      return { ...state, meetings: state.meetings.filter(m => m.id !== action.meetingId) };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.task.id ? action.task : t) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.taskId) };
    case 'ADD_STORY':
      return { ...state, stories: [...state.stories, action.story] };
    case 'UPDATE_STORY':
      return { ...state, stories: state.stories.map(s => s.id === action.story.id ? action.story : s) };
    case 'DELETE_STORY':
      return { ...state, stories: state.stories.filter(s => s.id !== action.storyId) };
    case 'ADD_EPIC':
      return { ...state, epics: [...state.epics, action.epic] };
    case 'UPDATE_EPIC':
      return { ...state, epics: state.epics.map(e => e.id === action.epic.id ? action.epic : e) };
    case 'DELETE_EPIC':
      return { ...state, epics: state.epics.filter(e => e.id !== action.epicId) };
    case 'ADD_SPRINT':
      return { ...state, sprints: [...state.sprints, action.sprint] };
    case 'UPDATE_SPRINT':
      return { ...state, sprints: state.sprints.map(s => s.id === action.sprint.id ? action.sprint : s) };
    case 'DELETE_SPRINT':
      return { ...state, sprints: state.sprints.filter(s => s.id !== action.sprintId) };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.doc] };
    case 'UPDATE_DOCUMENT':
      return { ...state, documents: state.documents.map(d => d.id === action.doc.id ? action.doc : d) };
    case 'DELETE_DOCUMENT':
      return { ...state, documents: state.documents.filter(d => d.id !== action.docId) };
    case 'ADD_KNOWLEDGE':
      return { ...state, knowledge: [...state.knowledge, action.entry] };
    case 'UPDATE_KNOWLEDGE':
      return { ...state, knowledge: state.knowledge.map(k => k.id === action.entry.id ? action.entry : k) };
    case 'DELETE_KNOWLEDGE':
      return { ...state, knowledge: state.knowledge.filter(k => k.id !== action.entryId) };
    case 'ADD_FIX':
      return { ...state, fixes: [...state.fixes, action.fix] };
    case 'UPDATE_FIX':
      return { ...state, fixes: state.fixes.map(f => f.id === action.fix.id ? action.fix : f) };
    case 'DELETE_FIX':
      return { ...state, fixes: state.fixes.filter(f => f.id !== action.fixId) };
    case 'ADD_EVIDENCE':
      return { ...state, evidences: [...state.evidences, action.evidence] };
    case 'DELETE_EVIDENCE':
      return { ...state, evidences: state.evidences.filter(e => e.id !== action.evidenceId) };
    case 'ADD_AI_ANALYSIS':
      return { ...state, aiAnalyses: [...state.aiAnalyses, action.analysis] };
    case 'UPDATE_AI_ANALYSIS':
      return { ...state, aiAnalyses: state.aiAnalyses.map(a => a.id === action.analysis.id ? action.analysis : a) };
    case 'ADD_AUDIT_LOG':
      return { ...state, auditLogs: [...state.auditLogs, action.log] };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.notification] };
    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.notificationId ? { ...n, read: true } : n) };
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map(n => n.userId === action.userId ? { ...n, read: true } : n) };
    case 'ADD_AI_INTERACTION':
      return { ...state, aiInteractions: [...state.aiInteractions, action.interaction] };
    case 'UPDATE_AI_INTERACTION':
      return { ...state, aiInteractions: state.aiInteractions.map(i => i.id === action.interaction.id ? action.interaction : i) };
    case 'ADD_PIPELINE_RUN':
      return { ...state, pipelineRuns: [...state.pipelineRuns, action.run] };
    case 'IMPORT_PROJECT': {
      const existingProject = state.projects.find(p => p.id === action.project.id);
      const hasActiveSprint = state.sprints.some(s => s.projectId === action.project.id && s.status === 'active');
      if (existingProject && hasActiveSprint) return state;
      const projects = existingProject
        ? state.projects.map(p => p.id === action.project.id ? action.project : p)
        : [...state.projects, action.project];
      const epics = [...state.epics.filter(e => e.projectId !== action.project.id), ...action.epics];
      const stories = [...state.stories.filter(s => s.projectId !== action.project.id), ...action.stories];
      const tasks = [...state.tasks.filter(t => t.projectId !== action.project.id), ...action.tasks];
      const sprints = [...state.sprints.filter(s => s.projectId !== action.project.id), ...action.sprints];
      return { ...state, projects, epics, stories, tasks, sprints };
    }
    case 'IMPORT_BACKLOG': {
      const hasActiveSprint = state.sprints.some(s => s.projectId === action.projectId && s.status === 'active');
      if (hasActiveSprint) return state;
      const epics = [...state.epics.filter(e => e.projectId !== action.projectId), ...action.epics];
      const stories = [...state.stories.filter(s => s.projectId !== action.projectId), ...action.stories];
      const tasks = [...state.tasks.filter(t => t.projectId !== action.projectId), ...action.tasks];
      return { ...state, epics, stories, tasks };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  navigate: (nav: NavState) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
      return () => clearTimeout(t);
    }
  }, [state.toast]);

  const login = useCallback((email: string, password: string) => {
    const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'No existe una cuenta con ese correo.' };
    if (user.status === 'disabled') return { success: false, error: 'Esta cuenta está deshabilitada.' };
    if (PASSWORDS[user.email] !== password) return { success: false, error: 'Contraseña incorrecta.' };
    dispatch({ type: 'LOGIN', user });
    return { success: true };
  }, [state.users]);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const navigate = useCallback((nav: NavState) => dispatch({ type: 'NAVIGATE', nav }), []);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    dispatch({ type: 'SHOW_TOAST', message, toastType: type });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, navigate, showToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useSelector<T>(selector: (state: AppState) => T): T {
  const { state } = useApp();
  return selector(state);
}
