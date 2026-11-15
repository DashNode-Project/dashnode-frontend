import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import { changeTaskStatus, getKanbanBoard, updateColumnWipLimit, updateTaskBlock } from './api';

describe('kanban api', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('gets kanban board', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/projects/p-1/kanban');
      return ok({ sprint_id: 'sp-1', sprint_name: 'Sprint 1', columns: [] });
    });

    const res = await getKanbanBoard('p-1');
    expect(res.sprint_id).toBe('sp-1');
  });

  it('updates column wip limit', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('PUT');
      expect(call.url).toContain('/projects/p-1/kanban/columns/IN_PROGRESS/wip');
      return ok({
        column_id: 'IN_PROGRESS',
        wip_limit: 3,
        message: 'Límite WIP actualizado correctamente.',
      });
    });

    const res = await updateColumnWipLimit('p-1', 'IN_PROGRESS', 3);
    expect(res.wip_limit).toBe(3);
    expect(res.message).toBe('Límite WIP actualizado correctamente.');
  });

  it('changes task status', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('PATCH');
      expect(call.url).toContain('/projects/p-1/tasks/t-1/status');
      return ok({
        id: 't-1',
        status: 'DONE',
        message: 'Estado de la tarea actualizado.',
      });
    });

    const res = await changeTaskStatus('p-1', 't-1', 'DONE');
    expect(res.status).toBe('DONE');
    expect(res.message).toBe('Estado de la tarea actualizado.');
  });

  it('updates task block and impediment', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('PATCH');
      expect(call.url).toContain('/projects/p-1/tasks/t-1/block');
      return ok({
        id: 't-1',
        is_blocked: true,
        blocked_reason: 'Esperando diseño',
        blocked_by_task_id: null,
        message: 'Estado de bloqueo actualizado.',
      });
    });

    const res = await updateTaskBlock('p-1', 't-1', {
      is_blocked: true,
      blocked_reason: 'Esperando diseño',
      blocked_by_task_id: null,
    });
    expect(res.is_blocked).toBe(true);
    expect(res.blocked_reason).toBe('Esperando diseño');
  });

  it('normalizes board response with active_sprint and cards structure', async () => {
    mockFetch(() =>
      ok({
        active_sprint: { id: 'sp-2', name: 'Sprint 2' },
        columns: [
          {
            id: 'TODO',
            name: 'Por hacer',
            wip_limit: 2,
            cards: [
              {
                id: 'c-1',
                title: 'Card 1',
                task_type: 'frontend',
                status: 'TODO',
                assignee_id: 'u-1',
                assignee_name: 'Dev',
                user_story_id: 'us-1',
                user_story_title: 'Story 1',
                estimated_hours: 4,
                logged_hours: 0,
                is_blocked: true,
                blocked_reason: 'Blocker',
                blocked_by_task_id: 'c-0',
                blocked_by_task_title: 'Predecessor',
              },
            ],
          },
        ],
      }),
    );

    const res = await getKanbanBoard('p-1');
    expect(res.sprint_id).toBe('sp-2');
    expect(res.sprint_name).toBe('Sprint 2');
    expect(res.columns[0]?.tasks[0]?.name).toBe('Card 1');
    expect(res.columns[0]?.tasks[0]?.blocked_by_task_name).toBe('Predecessor');
  });
});
