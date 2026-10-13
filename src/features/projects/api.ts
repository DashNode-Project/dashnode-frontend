import { apiRequest } from '@/lib/api/client';
import type { AdminUserSummary } from '@/features/auth/api';

export type ProjectPriority = 'baja' | 'media' | 'alta' | 'critica';
export type ProjectStatus = 'planificacion' | 'activo' | 'en_pausa' | 'completado' | 'cancelado';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  manager_id: string;
  priority: ProjectPriority;
  tech_stack: string[];
  meeting_link: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  priority: ProjectPriority;
  tech_stack?: string[];
  meeting_link?: string | null;
  manager_id: string;
}

export interface UpdateProjectPayload {
  name: string;
  description?: string;
  priority: ProjectPriority;
  tech_stack?: string[];
  meeting_link?: string | null;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  return apiRequest<ProjectSummary[]>('/projects');
}

export async function getProject(projectId: string): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(`/projects/${projectId}`);
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>('/projects', { method: 'POST', body: payload });
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(`/projects/${projectId}`, { method: 'PATCH', body: payload });
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/projects/${projectId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function assignProjectManager(
  projectId: string,
  managerId: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/projects/${projectId}/manager`, {
    method: 'PATCH',
    body: { manager_id: managerId },
  });
}

export async function deleteProject(projectId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/projects/${projectId}`, { method: 'DELETE' });
}

export async function listActiveManagers(): Promise<AdminUserSummary[]> {
  return apiRequest<AdminUserSummary[]>('/auth/managers');
}
