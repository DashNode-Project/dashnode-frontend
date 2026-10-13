import { createContext, useContext, type ReactNode } from 'react';
import type { ProjectSummary } from './api';

export interface ProjectWorkspaceContextValue {
  project: ProjectSummary;
  reload: () => Promise<void>;
  canManage: boolean;
  isAdmin: boolean;
}

const ProjectWorkspaceContext = createContext<ProjectWorkspaceContextValue | null>(null);

export function ProjectWorkspaceProvider({
  value,
  children,
}: {
  value: ProjectWorkspaceContextValue;
  children: ReactNode;
}) {
  return (
    <ProjectWorkspaceContext.Provider value={value}>{children}</ProjectWorkspaceContext.Provider>
  );
}

export function useProjectWorkspace(): ProjectWorkspaceContextValue {
  const ctx = useContext(ProjectWorkspaceContext);
  if (!ctx) {
    throw new Error('useProjectWorkspace must be used within ProjectWorkspaceProvider');
  }
  return ctx;
}
