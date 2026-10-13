import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import AvailabilityPage from './AvailabilityPage';
import * as availabilityApi from './api';
import { AVAILABILITY_MESSAGES } from './messages';

vi.mock('./api');

let currentUserRole = 'manager';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      role: currentUserRole,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  }),
}));

function renderPage() {
  return render(
    <ToastProvider>
      <AvailabilityPage />
    </ToastProvider>,
  );
}

describe('Availability & Meetings - Acceptance Criteria Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUserRole = 'manager';

    vi.mocked(availabilityApi.getMyAvailability).mockResolvedValue({
      id: 'a1',
      user_id: 'user-1',
      week_start_date: '2026-10-12',
      is_inherited: false,
      slots: {
        monday: [{ start: '09:00', end: '11:00' }],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    });

    vi.mocked(availabilityApi.saveMyAvailability).mockResolvedValue({
      message: AVAILABILITY_MESSAGES.availabilitySaved,
    });

    vi.mocked(availabilityApi.getTeamAvailability).mockResolvedValue({
      week_start_date: '2026-10-12',
      users: [
        {
          user_id: 'user-1',
          name: 'Test User',
          email: 'user@test.com',
          role: 'manager',
          slots: {
            monday: [{ start: '09:00', end: '11:00' }],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
        },
        {
          user_id: 'user-2',
          name: 'Developer One',
          email: 'dev@test.com',
          role: 'developer',
          slots: {
            monday: [{ start: '10:00', end: '12:00' }],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
        },
      ],
    });

    vi.mocked(availabilityApi.searchMeetingSlots).mockResolvedValue({
      results: [
        {
          day: 'monday',
          date: '2026-10-12',
          slots: [{ start: '10:00', end: '11:00' }],
        },
      ],
    });

    vi.mocked(availabilityApi.createMeeting).mockResolvedValue({
      id: 'm-1',
      project_id: null,
      title: 'Planning',
      description: null,
      date: '2026-10-12',
      start_time: '10:00',
      end_time: '11:00',
      duration: 60,
      link: null,
      status: 'scheduled',
      creator_id: 'user-1',
      participant_ids: ['user-1', 'user-2'],
      created_at: '2026-10-12T00:00:00Z',
      updated_at: '2026-10-12T00:00:00Z',
    });
  });

  // HU_DN_02_32
  it('HU_DN_02_32: displays 7-day 24h grid, toggles cells, handles save and no-changes', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(availabilityApi.getMyAvailability).toHaveBeenCalled();
    });

    // Check header and columns
    expect(screen.getByRole('heading', { name: 'Disponibilidad' })).toBeInTheDocument();
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Domingo')).toBeInTheDocument();

    // Click "Guardar disponibilidad" without changes -> shows "No hay cambios por guardar."
    const saveBtn = screen.getByRole('button', { name: /Guardar disponibilidad/i });
    await user.click(saveBtn);
    expect(await screen.findByText(AVAILABILITY_MESSAGES.noChangesToSave)).toBeInTheDocument();
    expect(availabilityApi.saveMyAvailability).not.toHaveBeenCalled();

    // Toggle a cell (e.g. Martes 08:00)
    const tuesday8Cell = screen.getByRole('button', {
      name: /Martes 08:00 - No disponible/i,
    });
    await user.click(tuesday8Cell);

    // Save with changes
    await user.click(saveBtn);
    await waitFor(() => {
      expect(availabilityApi.saveMyAvailability).toHaveBeenCalled();
    });
    expect(await screen.findByText(AVAILABILITY_MESSAGES.availabilitySaved)).toBeInTheDocument();
  });

  // HU_DN_02_33
  it('HU_DN_02_33: displays inheritance indicator when week has no own record', async () => {
    vi.mocked(availabilityApi.getMyAvailability).mockResolvedValueOnce({
      id: null,
      user_id: 'user-1',
      week_start_date: '2026-10-19',
      is_inherited: true,
      slots: {
        monday: [{ start: '09:00', end: '11:00' }],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    });

    renderPage();
    expect(await screen.findByText(/Heredada/i)).toBeInTheDocument();
  });

  // HU_DN_02_34
  it('HU_DN_02_34: manager sees team grid with D and ND indicators', async () => {
    const user = userEvent.setup();
    renderPage();

    // Manager sees Equipo tab
    const teamTab = screen.getByRole('button', { name: /Equipo/i });
    expect(teamTab).toBeInTheDocument();
    await user.click(teamTab);

    await waitFor(() => {
      expect(availabilityApi.getTeamAvailability).toHaveBeenCalled();
    });

    // Check user names in team grid
    expect(screen.getByText('Developer One')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // Check textual indicators D and ND exist
    const dBadges = screen.getAllByText('D');
    expect(dBadges.length).toBeGreaterThan(0);
    const ndBadges = screen.getAllByText('ND');
    expect(ndBadges.length).toBeGreaterThan(0);
  });

  it('HU_DN_02_34: developer cannot see team tab', () => {
    currentUserRole = 'developer';
    renderPage();
    expect(screen.queryByRole('button', { name: /Equipo/i })).not.toBeInTheDocument();
  });

  // HU_DN_03_35 & HU_DN_03_36
  it('HU_DN_03_35 & HU_DN_03_36: validates criteria, searches slots and books meeting', async () => {
    const user = userEvent.setup();
    renderPage();

    // Click Agendar reunión tab
    const schedTab = screen.getByRole('button', { name: /Agendar reunión/i });
    await user.click(schedTab);

    // Form is loaded
    const searchBtn = screen.getByRole('button', { name: /Buscar horarios/i });
    expect(searchBtn).toBeEnabled();

    // Test invalid interval (start >= end)
    const startInp = screen.getByLabelText(/Hora de inicio/i);
    const endInp = screen.getByLabelText(/Hora de fin/i);
    await user.clear(startInp);
    await user.type(startInp, '18:00');
    await user.clear(endInp);
    await user.type(endInp, '09:00');

    expect(screen.getByText(AVAILABILITY_MESSAGES.invalidTimeInterval)).toBeInTheDocument();
    expect(searchBtn).toBeDisabled();

    // Restore valid interval
    await user.clear(startInp);
    await user.type(startInp, '08:00');
    await user.clear(endInp);
    await user.type(endInp, '18:00');
    expect(searchBtn).toBeEnabled();

    // Click Buscar horarios -> HU_DN_03_36
    await user.click(searchBtn);

    await waitFor(() => {
      expect(availabilityApi.searchMeetingSlots).toHaveBeenCalled();
    });

    // Result card with slot 10:00 - 11:00 is displayed
    const slotBtn = await screen.findByRole('button', { name: /10:00 – 11:00/i });
    expect(slotBtn).toBeInTheDocument();

    // Click slot to open booking modal
    await user.click(slotBtn);

    // In modal, fill title and submit
    const titleInp = screen.getByLabelText(/Título de la reunión \*/i);
    await user.type(titleInp, 'Sprint Sync');

    const confirmBtn = screen.getByRole('button', { name: /Confirmar reunión/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(availabilityApi.createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sprint Sync',
          start_time: '10:00',
          end_time: '11:00',
        }),
      );
    });

    expect(await screen.findByText(AVAILABILITY_MESSAGES.meetingCreated)).toBeInTheDocument();
  });

  it('HU_DN_03_36: displays feedback when no slots match criteria', async () => {
    vi.mocked(availabilityApi.searchMeetingSlots).mockResolvedValueOnce({
      results: [],
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Agendar reunión/i }));
    await user.click(screen.getByRole('button', { name: /Buscar horarios/i }));

    expect(await screen.findByText(AVAILABILITY_MESSAGES.noAvailableSlots)).toBeInTheDocument();
  });
});
