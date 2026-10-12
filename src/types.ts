export type UserRole = 'admin' | 'manager' | 'developer';
export type UserStatus = 'active' | 'inactive' | 'disabled';
export type ProjectStatus = 'active' | 'planning' | 'completed' | 'archived' | 'on-hold';
export type TaskStatus = 'todo' | 'in-progress' | 'code-review' | 'testing' | 'fixing' | 'completed';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';
export type SprintStatus = 'planning' | 'active' | 'completed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';
export type StoryStatus = 'todo' | 'in-sprint' | 'in-progress' | 'completed';
export type EpicStatus = 'planned' | 'active' | 'completed';
export type DocCategory = 'technical' | 'functional' | 'meeting' | 'general' | 'prompt';
export type FixStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type FixPriority = 'critical' | 'high' | 'medium' | 'low';
export type EvidenceType = 'screenshot' | 'image' | 'video' | 'log' | 'link' | 'text';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'assignment' | 'meeting' | 'sprint' | 'story' | 'task' | 'fix' | 'document' | 'ai' | 'security';
export type PipelineStepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface TimeRange {
  start: string;
  end: string;
}

export interface WeeklyAvailability {
  monday: TimeRange[];
  tuesday: TimeRange[];
  wednesday: TimeRange[];
  thursday: TimeRange[];
  friday: TimeRange[];
  saturday: TimeRange[];
  sunday: TimeRange[];
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  description?: string;
  skills: string[];
  experience?: string;
  github?: string;
  linkedin?: string;
  projectIds: string[];
  lastActivity: string;
  createdAt: string;
  availability?: WeeklyAvailability;
  tempPassword?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  objective: string;
  status: ProjectStatus;
  managerId: string;
  memberIds: string[];
  meetingLink?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  tags: string[];
}

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: EpicStatus;
  color: string;
}

export interface UserStory {
  id: string;
  epicId: string;
  projectId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  definitionOfDone?: string[];
  definitionOfReady?: string[];
  priority: StoryPriority;
  points: number;
  status: StoryStatus;
  sprintId?: string;
  assigneeId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  storyId: string;
  projectId: string;
  sprintId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId?: string;
  estimatedHours: number;
  loggedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  storyIds: string[];
  velocity?: number;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  duration: number;
  participantIds: string[];
  link: string;
  status: MeetingStatus;
  creatorId: string;
  summary?: string;
  minutesUrl?: string;
}


export interface FixHistoryEntry {
  id: string;
  date: string;
  userId: string;
  action: string;
  from?: string;
  to?: string;
  note?: string;
}

export interface AIAnalysis {
  id: string;
  fixId: string;
  evidenceId?: string;
  type: 'image' | 'video' | 'text';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  diagnosis?: string;
  observations?: string[];
  possibleCauses?: string[];
  suggestedSteps?: string[];
  recommendation?: string;
  createdAt: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface Evidence {
  id: string;
  fixId: string;
  type: EvidenceType;
  title: string;
  description?: string;
  url?: string;
  content?: string;
  uploadedBy: string;
  uploadedAt: string;
  aiAnalysisId?: string;
}

export interface Fix {
  id: string;
  projectId: string;
  issueId?: string;
  storyId?: string;
  taskId?: string;
  title: string;
  description: string;
  status: FixStatus;
  priority: FixPriority;
  reporterId: string;
  assigneeId?: string;
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  costAuthorizerId?: string;
  costNote?: string;
  solution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  history: FixHistoryEntry[];
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  url: string;
  description?: string;
  category: DocCategory;
  authorId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  projectId: string;
  title: string;
  question?: string;
  content: string;
  answer?: string;
  source?: string;
  category?: string;
  tags: string[];
  authorId: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  aiGenerated?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  projectId?: string;
  before?: string;
  after?: string;
  result: 'success' | 'error';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  projectId?: string;
  entityId?: string;
  createdAt: string;
}

export interface AIInteraction {
  id: string;
  projectId: string;
  userId: string;
  activity: string;
  model: string;
  prompt: string;
  aiResult: string;
  humanResult?: string;
  finalResult?: string;
  accepted: boolean | null;
  modified: boolean;
  rejected: boolean;
  estimatedTimeSavedMin: number;
  actualTimeSavedMin?: number;
  errorsIntroduced: number;
  perceivedUtility: number;
  createdAt: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  status: PipelineStepStatus;
  duration?: number;
  log?: string;
}

export interface PipelineRun {
  id: string;
  projectId: string;
  branch: string;
  commit: string;
  author: string;
  message: string;
  steps: PipelineStep[];
  status: 'running' | 'success' | 'failed' | 'pending';
  startedAt: string;
  completedAt?: string;
}

export type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'users'
  | 'projects'
  | 'project-workspace'
  | 'calendar'
  | 'availability'
  | 'meetings'
  | 'profile'
  | 'about'
  | 'my-tasks'
  | 'user-manual';

export interface NavState {
  page: Page;
  projectId?: string;
  projectTab?: string;
  userId?: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  epics: Epic[];
  stories: UserStory[];
  tasks: Task[];
  sprints: Sprint[];
  meetings: Meeting[];
  fixes: Fix[];
  evidences: Evidence[];
  aiAnalyses: AIAnalysis[];
  documents: Document[];
  knowledge: KnowledgeEntry[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  aiInteractions: AIInteraction[];
  pipelineRuns: PipelineRun[];
  nav: NavState;
  sidebarOpen: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}
