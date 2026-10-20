type WorkspaceRole = 'admin' | 'manager' | 'developer';

export type ProjectTabSegment =
  | 'resumen'
  | 'equipo'
  | 'backlog'
  | 'sprints'
  | 'kanban'
  | 'reuniones'
  | 'issues'
  | 'conocimiento'
  | 'devops'
  | 'metricas-ia';

export interface ProjectWorkspaceTab {
  segment: ProjectTabSegment;
  label: string;
  roles: WorkspaceRole[];
  implemented: boolean;
}

export const PROJECT_WORKSPACE_TABS: ProjectWorkspaceTab[] = [
  {
    segment: 'resumen',
    label: 'Resumen',
    roles: ['admin', 'manager', 'developer'],
    implemented: true,
  },
  {
    segment: 'equipo',
    label: 'Equipo',
    roles: ['admin', 'manager', 'developer'],
    implemented: true,
  },
  {
    segment: 'backlog',
    label: 'Backlog',
    roles: ['admin', 'manager', 'developer'],
    implemented: true,
  },
  {
    segment: 'sprints',
    label: 'Sprints',
    roles: ['admin', 'manager', 'developer'],
    implemented: false,
  },
  {
    segment: 'kanban',
    label: 'Kanban',
    roles: ['admin', 'manager', 'developer'],
    implemented: false,
  },
  {
    segment: 'reuniones',
    label: 'Reuniones',
    roles: ['admin', 'manager', 'developer'],
    implemented: true,
  },
  {
    segment: 'issues',
    label: 'Issues',
    roles: ['admin', 'manager', 'developer'],
    implemented: false,
  },
  {
    segment: 'conocimiento',
    label: 'Conocimiento',
    roles: ['admin', 'manager', 'developer'],
    implemented: false,
  },
  {
    segment: 'devops',
    label: 'DevOps',
    roles: ['admin', 'manager', 'developer'],
    implemented: false,
  },
  {
    segment: 'metricas-ia',
    label: 'Métricas de IA',
    roles: ['admin', 'manager'],
    implemented: false,
  },
];

export function visibleProjectTabs(role: WorkspaceRole): ProjectWorkspaceTab[] {
  return PROJECT_WORKSPACE_TABS.filter((tab) => tab.roles.includes(role));
}
