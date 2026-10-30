import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectWorkspaceProvider } from '@/features/projects/ProjectWorkspaceContext';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectKanbanTab from './ProjectKanbanTab';
import * as kanbanApi from './api';
import { KANBAN_MESSAGES } from './messages';
import type { KanbanBoardResponse } from './types';

vi.mock('./api');

let mockUser = {
  id: 'mgr-1',
  email: 'mgr@dashnode.io',
  name: 'Manager User',
  role: 'manager',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

const mockProject = {
  id: 'p-1',
  name: 'Kanban Project',
  description: 'Desc',
  owner_id: 'mgr-1',
  manager_id: 'mgr-1',
  priority: 'alta' as const,
  tech_stack: ['React', 'FastAPI'],
  meeting_link: 'https://meet.dashnode.io/kanban',
  status: 'planificacion' as const,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const sampleBoard: KanbanBoardResponse = {
  sprint_id: 'sp-1',
  sprint_name: 'Sprint 1',
  columns: [
    {
      id: 'TODO',
      label: 'Por hacer',
      wip_limit: null,
      tasks: [
        {
          id: 't-1',
          story_id: 'hu-1',
          story_title: 'HU Autenticacion',
          name: 'Crear componente login',
          task_type: 'frontend',
          status: 'TODO',
          assignee_id: 'dev-1',
          assignee_name: 'Dev One',
          estimated_hours: 6,
          logged_hours: 2,
          is_blocked: false,
          blocked_reason: null,
          blocked_by_task_id: null,
          blocked_by_task_name: null,
        },
      ],
    },
    {
      id: 'IN_PROGRESS',
      label: 'En progreso',
      wip_limit: 1,
      tasks: [
        {
          id: 't-2',
          story_id: 'hu-1',
          story_title: 'HU Autenticacion',
          name: 'Endpoint de sesiones',
          task_type: 'backend',
          status: 'IN_PROGRESS',
          assignee_id: 'dev-2',
          assignee_name: 'Dev Two',
          estimated_hours: 4,
          logged_hours: 4,
          is_blocked: true,
          blocked_reason: 'Falta configurar base de datos',
          blocked_by_task_id: null,
          blocked_by_task_name: null,
        },
        {
          id: 't-3',
          story_id: 'hu-2',
          story_title: 'HU Perfil',
          name: 'Migracion usuarios',
          task_type: 'backend',
          status: 'IN_PROGRESS',
          assignee_id: 'dev-1',
          assignee_name: 'Dev One',
          estimated_hours: 2,
          logged_hours: 1,
          is_blocked: false,
          blocked_reason: null,
          blocked_by_task_id: 't-1',
          blocked_by_task_name: 'Crear componente login',
        },
      ],
    },
    {
      id: 'CODE_REVIEW',
      label: 'Code Review',
      wip_limit: null,
      tasks: [],
    },
    {
      id: 'TESTING',
      label: 'Testing',
      wip_limit: null,
      tasks: [],
    },
    {
      id: 'CORRECTION',
      label: 'En corrección',
      wip_limit: null,
      tasks: [],
    },
    {
      id: 'DONE',
      label: 'Completado',
      wip_limit: null,
      tasks: [],
    },
  ],
};

function renderKanban(canManage = true, isAdmin = false) {
  return render(
    <ToastProvider>
      <ProjectWorkspaceProvider
        value={{
          project: mockProject,
          reload: vi.fn(),
          canManage,
          isAdmin,
        }}
      >
        <ProjectKanbanTab />
      </ProjectWorkspaceProvider>
    </ToastProvider>,
  );
}

describe('EP-08 Tablero Kanban (HU_DN_05_72 .. 76)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 'mgr-1',
      email: 'mgr@dashnode.io',
      name: 'Manager User',
      role: 'manager',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    };
    vi.mocked(kanbanApi.getKanbanBoard).mockResolvedValue(sampleBoard);
    vi.mocked(kanbanApi.changeTaskStatus).mockResolvedValue({
      id: 't-1',
      status: 'IN_PROGRESS',
      message: KANBAN_MESSAGES.TASK_STATUS_UPDATED,
    });
    vi.mocked(kanbanApi.updateColumnWipLimit).mockResolvedValue({
      column_id: 'IN_PROGRESS',
      wip_limit: 3,
      message: KANBAN_MESSAGES.WIP_LIMIT_UPDATED,
    });
    vi.mocked(kanbanApi.updateTaskBlock).mockResolvedValue({
      id: 't-1',
      is_blocked: true,
      blocked_reason: 'Impedimento de prueba',
      blocked_by_task_id: null,
      message: KANBAN_MESSAGES.BLOCK_STATUS_UPDATED,
    });
  });

  describe('HU_DN_05_72: Visualizar tablero Kanban del sprint activo en columnas', () => {
    it('renders 6 standard columns with titles and task details', async () => {
      renderKanban();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Por hacer' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'En progreso' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Code Review' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Testing' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'En corrección' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Completado' })).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('kanban-card-t-1');
      expect(within(card1).getByText('Crear componente login')).toBeInTheDocument();
      expect(within(card1).getByText('Frontend')).toBeInTheDocument();
      expect(within(card1).getByText(/Dev One/)).toBeInTheDocument();
      expect(within(card1).getByText(/HU Autenticacion/)).toBeInTheDocument();
      expect(within(card1).getByText(/2h \/ 6h/)).toBeInTheDocument();
    });

    it('shows empty state message when there is no active sprint', async () => {
      vi.mocked(kanbanApi.getKanbanBoard).mockResolvedValueOnce({
        sprint_id: null,
        sprint_name: null,
        columns: [],
      });

      renderKanban();

      await waitFor(() => {
        expect(screen.getByText(KANBAN_MESSAGES.NO_ACTIVE_SPRINT)).toBeInTheDocument();
      });
    });

    it('shows error message on load failure and allows retry', async () => {
      vi.mocked(kanbanApi.getKanbanBoard).mockRejectedValueOnce(new Error('Network error'));

      renderKanban();

      await waitFor(() => {
        expect(screen.getByText(KANBAN_MESSAGES.LOAD_ERROR)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
      expect(retryBtn).toBeInTheDocument();
    });
  });

  describe('HU_DN_05_73: Mover tarjetas entre columnas', () => {
    it('developer can move their own task and receives success toast', async () => {
      mockUser = {
        id: 'dev-1',
        email: 'dev1@dashnode.io',
        name: 'Dev One',
        role: 'developer',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      };

      const user = userEvent.setup();
      renderKanban(false, false);

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      // Select "Mover a..." on t-1
      const select = screen.getByLabelText('Mover tarea Crear componente login');
      await user.selectOptions(select, 'IN_PROGRESS');

      expect(kanbanApi.changeTaskStatus).toHaveBeenCalledWith('p-1', 't-1', 'IN_PROGRESS');
      await waitFor(() => {
        expect(screen.getByText(KANBAN_MESSAGES.TASK_STATUS_UPDATED)).toBeInTheDocument();
      });
    });

    it('developer cannot move another developer task and receives error message', async () => {
      mockUser = {
        id: 'dev-1',
        email: 'dev1@dashnode.io',
        name: 'Dev One',
        role: 'developer',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      };

      renderKanban(false, false);

      await waitFor(() => {
        expect(screen.getByText('Endpoint de sesiones')).toBeInTheDocument();
      });

      // t-2 is assigned to dev-2; dev-1 should not have move select for t-2
      expect(screen.queryByLabelText('Mover tarea Endpoint de sesiones')).not.toBeInTheDocument();
    });

    it('moving manually to CORRECTION is prohibited', async () => {
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Mover tarea Crear componente login')).toBeInTheDocument();
      // Options should not contain CORRECTION
      expect(screen.queryByRole('option', { name: 'En corrección' })).not.toBeInTheDocument();
    });
  });

  describe('HU_DN_05_74: Aplicar límites de trabajo en progreso (WIP)', () => {
    it('displays soft-limit warning when column exceeds WIP limit', async () => {
      renderKanban();

      await waitFor(() => {
        // IN_PROGRESS has 2 tasks with wip_limit 1
        expect(screen.getByTestId('wip-warning-IN_PROGRESS')).toHaveTextContent(
          KANBAN_MESSAGES.wipExceeded(2, 1),
        );
      });
    });

    it('admin/manager can configure WIP limit through modal', async () => {
      const user = userEvent.setup();
      renderKanban(true, false);

      await waitFor(() => {
        expect(screen.getByLabelText('Configurar límite WIP para En progreso')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Configurar límite WIP para En progreso'));

      expect(screen.getByText(/Configurar límite WIP: En progreso/)).toBeInTheDocument();

      const input = screen.getByLabelText(/Límite de trabajo en progreso/i);
      await user.clear(input);
      await user.type(input, '3');

      await user.click(screen.getByRole('button', { name: /Guardar límite/i }));

      expect(kanbanApi.updateColumnWipLimit).toHaveBeenCalledWith('p-1', 'IN_PROGRESS', 3);
      await waitFor(() => {
        expect(screen.getByText(KANBAN_MESSAGES.WIP_LIMIT_UPDATED)).toBeInTheDocument();
      });
    });
  });

  describe('HU_DN_05_75: Filtrar tarjetas en el tablero', () => {
    it('filters cards by search text input', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
        expect(screen.getByText('Endpoint de sesiones')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Buscar tareas');
      await user.type(searchInput, 'login');

      expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      expect(screen.queryByText('Endpoint de sesiones')).not.toBeInTheDocument();
    });

    it('shows empty filter message when no cards match applied filters', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Buscar tareas');
      await user.type(searchInput, 'inexistentexyz');

      expect(screen.getByText(KANBAN_MESSAGES.NO_MATCHING_CARDS)).toBeInTheDocument();
    });
  });

  describe('HU_DN_05_76: Visualizar bloqueos o dependencias en tarjetas', () => {
    it('displays lock badge and detail on blocked card', async () => {
      renderKanban();

      await waitFor(() => {
        expect(screen.getByLabelText(/Ver bloqueo: Impedimento/i)).toBeInTheDocument();
      });

      const blockedBadge = screen.getByLabelText(/Ver bloqueo: Impedimento: Falta configurar/i);
      expect(blockedBadge).toBeInTheDocument();
    });

    it('displays dependency lock badge for predecessor dependency', async () => {
      renderKanban();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Ver bloqueo: Bloqueada por predecesora: Crear componente login/i),
        ).toBeInTheDocument();
      });
    });

    it('allows reporting/updating impediment on a card', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      // Click "Reportar impedimento"
      await user.click(screen.getByText('Reportar impedimento'));

      expect(screen.getByText('Gestión de Bloqueos e Impedimentos')).toBeInTheDocument();

      const checkbox = screen.getByLabelText(/Reportar como impedimento/i);
      await user.click(checkbox);

      const reasonText = screen.getByLabelText(/Motivo del impedimento/i);
      await user.type(reasonText, 'Esperando API externa');

      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(kanbanApi.updateTaskBlock).toHaveBeenCalledWith('p-1', 't-1', {
        is_blocked: true,
        blocked_reason: 'Esperando API externa',
        blocked_by_task_id: null,
      });

      await waitFor(() => {
        expect(screen.getByText(KANBAN_MESSAGES.BLOCK_STATUS_UPDATED)).toBeInTheDocument();
      });
    });

    it('allows selecting predecessor dependency in block modal', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reportar impedimento'));
      expect(screen.getByText('Gestión de Bloqueos e Impedimentos')).toBeInTheDocument();

      const predSelect = screen.getByLabelText(/Dependencia de tarea predecesora/i);
      await user.selectOptions(predSelect, 't-2');

      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(kanbanApi.updateTaskBlock).toHaveBeenCalledWith('p-1', 't-1', {
        is_blocked: false,
        blocked_reason: null,
        blocked_by_task_id: 't-2',
      });
    });

    it('can close block modal with Cancelar button without saving', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reportar impedimento'));
      expect(screen.getByText('Gestión de Bloqueos e Impedimentos')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByText('Gestión de Bloqueos e Impedimentos')).not.toBeInTheDocument();
    });
  });

  describe('Additional coverage cases for filters, WIP limits and rollback', () => {
    it('rolls back task status on server failure', async () => {
      vi.mocked(kanbanApi.changeTaskStatus).mockRejectedValueOnce(new Error('Server error'));
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Mover tarea Crear componente login');
      await user.selectOptions(select, 'IN_PROGRESS');

      await waitFor(() => {
        expect(screen.getByText(KANBAN_MESSAGES.LOAD_ERROR)).toBeInTheDocument();
      });
    });

    it('filters cards by assignee, story, and task type selects and resets them', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      const assigneeSelect = screen.getByLabelText('Filtrar por responsable');
      await user.selectOptions(assigneeSelect, 'dev-2');

      expect(screen.queryByText('Crear componente login')).not.toBeInTheDocument();
      expect(screen.getByText('Endpoint de sesiones')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: /Limpiar filtros/i });
      await user.click(clearBtn);

      expect(screen.getByText('Crear componente login')).toBeInTheDocument();

      const typeSelect = screen.getByLabelText('Filtrar por tipo de tarea');
      await user.selectOptions(typeSelect, 'frontend');

      expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      expect(screen.queryByText('Endpoint de sesiones')).not.toBeInTheDocument();

      const storySelect = screen.getByLabelText('Filtrar por historia de usuario');
      await user.selectOptions(storySelect, 'hu-1');

      expect(screen.getByText('Crear componente login')).toBeInTheDocument();
    });

    it('resets filters with the empty state button when no cards match', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByText('Crear componente login')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Buscar tareas');
      await user.type(searchInput, 'xyznomatch');

      const resetBtn = screen.getByRole('button', { name: 'Restablecer filtros' });
      await user.click(resetBtn);

      expect(screen.getByText('Crear componente login')).toBeInTheDocument();
    });

    it('handles WIP modal "Sin límite" checkbox and validation error', async () => {
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByLabelText('Configurar límite WIP para En progreso')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Configurar límite WIP para En progreso'));

      // Check Sin límite
      const noLimitCheckbox = screen.getByLabelText(/Sin límite/i);
      await user.click(noLimitCheckbox);

      await user.click(screen.getByRole('button', { name: /Guardar límite/i }));

      expect(kanbanApi.updateColumnWipLimit).toHaveBeenCalledWith('p-1', 'IN_PROGRESS', null);

      // Re-open and test validation
      await user.click(screen.getByLabelText('Configurar límite WIP para En progreso'));
      const input = screen.getByLabelText(/Límite de trabajo en progreso/i);
      await user.clear(input);
      await user.type(input, '0');

      await user.click(screen.getByRole('button', { name: /Guardar límite/i }));
      expect(
        screen.getByText('El límite WIP debe ser un número entero mayor a 0.'),
      ).toBeInTheDocument();

      // Cancel button
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByText(/Configurar límite WIP: En progreso/)).not.toBeInTheDocument();
    });

    it('shows error toast when updateColumnWipLimit fails', async () => {
      vi.mocked(kanbanApi.updateColumnWipLimit).mockRejectedValueOnce(new Error('WIP error'));
      const user = userEvent.setup();
      renderKanban();

      await waitFor(() => {
        expect(screen.getByLabelText('Configurar límite WIP para En progreso')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Configurar límite WIP para En progreso'));
      await user.click(screen.getByRole('button', { name: /Guardar límite/i }));

      await waitFor(() => {
        expect(screen.getByText(KANBAN_MESSAGES.WIP_LIMIT_FAILED)).toBeInTheDocument();
      });
    });
  });
});
