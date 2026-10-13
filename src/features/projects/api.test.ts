import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import {
  addProjectMember,
  assignProjectManager,
  createProject,
  deleteProject,
  getProject,
  getProjectHealth,
  listActiveManagers,
  listActiveUsers,
  listProjectMembers,
  listProjects,
  removeProjectMember,
  updateProject,
  updateProjectStatus,
} from './api';

describe('projects api', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists projects', async () => {
    mockFetch((call) => {
      expect(call.url).toContain('/projects');
      return ok([]);
    });
    await expect(listProjects()).resolves.toEqual([]);
  });

  it('creates a project', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      return ok({ id: 'p1', name: 'X' }, 201);
    });
    const result = await createProject({
      name: 'X',
      priority: 'media',
      manager_id: 'm1',
    });
    expect(result.id).toBe('p1');
  });

  it('covers remaining project endpoints', async () => {
    mockFetch((call) => {
      if (call.method === 'GET' && call.url.endsWith('/projects/p1')) {
        return ok({ id: 'p1' });
      }
      if (call.method === 'PATCH' && call.url.includes('/status')) {
        return ok({ message: 'Estado del proyecto actualizado.' });
      }
      if (call.method === 'PATCH' && call.url.includes('/manager')) {
        return ok({ message: 'Gerente responsable actualizado correctamente.' });
      }
      if (call.method === 'PATCH') {
        return ok({ id: 'p1', name: 'Y' });
      }
      if (call.method === 'DELETE') {
        return ok({ message: 'Proyecto eliminado correctamente.' });
      }
      if (call.url.includes('/auth/managers')) {
        return ok([]);
      }
      if (call.url.includes('/auth/active-users')) {
        return ok([
          { id: 'u1', name: 'User', email: 'u@t.com', role: 'developer', is_active: true },
        ]);
      }
      if (call.url.includes('/members/dev-1') && call.method === 'DELETE') {
        return ok({ message: 'Miembro retirado correctamente.' });
      }
      if (call.url.includes('/members') && call.method === 'POST') {
        return ok({ message: 'Miembro agregado correctamente.' }, 201);
      }
      if (call.url.includes('/members')) {
        return ok([]);
      }
      if (call.url.includes('/health')) {
        return ok({ progress_percent: 0, velocity: 0, open_issues: 0 });
      }
      return ok({});
    });
    await expect(getProject('p1')).resolves.toMatchObject({ id: 'p1' });
    await expect(updateProject('p1', { name: 'Y', priority: 'media' })).resolves.toBeTruthy();
    await expect(updateProjectStatus('p1', 'activo')).resolves.toHaveProperty('message');
    await expect(assignProjectManager('p1', 'm1')).resolves.toHaveProperty('message');
    await expect(deleteProject('p1')).resolves.toHaveProperty('message');
    await expect(listActiveManagers()).resolves.toEqual([]);
    await expect(listActiveUsers('ana')).resolves.toHaveLength(1);
    await expect(listProjectMembers('p1')).resolves.toEqual([]);
    await expect(getProjectHealth('p1')).resolves.toMatchObject({ open_issues: 0 });
    await expect(addProjectMember('p1', 'dev-1')).resolves.toHaveProperty('message');
    await expect(removeProjectMember('p1', 'dev-1')).resolves.toHaveProperty('message');
  });
});
