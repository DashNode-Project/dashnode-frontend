import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import MeetingsPage from './MeetingsPage';
import * as availabilityApi from '@/features/availability/api';
import { AVAILABILITY_MESSAGES } from '@/features/availability/messages';
import type { MeetingDTO } from '@/features/availability/types';
import { ApiError } from '@/lib/api/errors';

vi.mock('@/features/availability/api');

let currentUserRole = 'manager';
let currentUserId = 'user-mgr';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: currentUserId,
      email: 'user@test.com',
      name: 'Manager User',
      role: currentUserRole,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  }),
}));

const mockMeetings: MeetingDTO[] = [
  {
    id: 'm-1',
    project_id: 'p-1',
    project_name: 'Proyecto Alpha',
    title: 'Daily Standup Alpha',
    type: 'Daily',
    description: 'Sync diario',
    date: '2026-10-20',
    start_time: '09:00',
    end_time: '09:30',
    duration: 30,
    link: 'https://meet.google.com/alpha-room',
    status: 'scheduled',
    creator_id: 'user-mgr',
    creator_name: 'Manager User',
    participant_ids: ['user-mgr', 'user-dev'],
    participants: [
      {
        user_id: 'user-mgr',
        name: 'Manager User',
        email: 'user@test.com',
        response: 'aceptada',
      },
      {
        user_id: 'user-dev',
        name: 'Developer One',
        email: 'dev@test.com',
        response: 'pendiente',
      },
    ],
    summary: null,
    minutes_url: null,
    created_at: '2026-10-13T10:00:00Z',
    updated_at: '2026-10-13T10:00:00Z',
  },
  {
    id: 'm-2',
    project_id: 'p-1',
    project_name: 'Proyecto Alpha',
    title: 'Sprint Planning Pasado',
    type: 'Planning',
    description: 'Planificación de sprint',
    date: '2026-01-10',
    start_time: '14:00',
    end_time: '15:00',
    duration: 60,
    link: 'https://meet.google.com/planning-room',
    status: 'completed',
    creator_id: 'user-mgr',
    creator_name: 'Manager User',
    participant_ids: ['user-mgr', 'user-dev'],
    participants: [
      {
        user_id: 'user-mgr',
        name: 'Manager User',
        email: 'user@test.com',
        response: 'aceptada',
      },
    ],
    summary: 'Acuerdos clave del sprint 1.',
    minutes_url: 'https://docs.google.com/document/d/doc-1',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-10T15:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <MeetingsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('MeetingsPage - Acceptance Criteria Tests (EP-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUserRole = 'manager';
    currentUserId = 'user-mgr';
    vi.mocked(availabilityApi.listMeetings).mockResolvedValue(mockMeetings);
  });

  // HU_DN_03_39
  it('HU_DN_03_39: renders upcoming and past meetings with badges, metadata, and empty states', async () => {
    const user = userEvent.setup();
    renderPage();

    // Check header
    expect(await screen.findByRole('heading', { name: 'Reuniones' })).toBeInTheDocument();

    // By default 'Próximas' tab is active
    expect(await screen.findByText('Daily Standup Alpha')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Programada')).toBeInTheDocument();
    expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Sprint Planning Pasado')).not.toBeInTheDocument();

    // Switch to 'Pasadas' tab
    const pastTab = screen.getByRole('button', { name: /Pasadas/i });
    await user.click(pastTab);

    expect(await screen.findByText('Sprint Planning Pasado')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Completada')).toBeInTheDocument();
    expect(screen.getByText(/"Acuerdos clave del sprint 1."/i)).toBeInTheDocument();
    expect(screen.queryByText('Daily Standup Alpha')).not.toBeInTheDocument();
  });

  it('HU_DN_03_39: shows empty state when no meetings exist', async () => {
    vi.mocked(availabilityApi.listMeetings).mockResolvedValueOnce([]);
    renderPage();

    expect(await screen.findByText(AVAILABILITY_MESSAGES.noMeetingsToShow)).toBeInTheDocument();
  });

  // HU_DN_03_40
  it('HU_DN_03_40: switches between list and calendar views with month navigation', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Daily Standup Alpha')).toBeInTheDocument();

    // Switch to Calendar View
    const calToggle = screen.getByRole('button', { name: /Vista Calendario/i });
    await user.click(calToggle);

    // In calendar view: month header exists
    expect(screen.getByRole('button', { name: /Mes anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mes siguiente/i })).toBeInTheDocument();

    // Switch back to List View
    const listToggle = screen.getByRole('button', { name: /Vista Lista/i });
    await user.click(listToggle);
    expect(await screen.findByText('Daily Standup Alpha')).toBeInTheDocument();
  });

  // HU_DN_03_41
  it('HU_DN_03_41: opens meeting detail modal, displays participants responses, and handles participant response', async () => {
    currentUserRole = 'developer';
    currentUserId = 'user-dev';

    vi.mocked(availabilityApi.getMeetingDetail).mockResolvedValueOnce(mockMeetings[0]!);
    vi.mocked(availabilityApi.respondMeeting).mockResolvedValueOnce({
      ...mockMeetings[0]!,
      participants: [
        {
          user_id: 'user-mgr',
          name: 'Manager User',
          email: 'user@test.com',
          response: 'aceptada',
        },
        {
          user_id: 'user-dev',
          name: 'Developer One',
          email: 'dev@test.com',
          response: 'aceptada',
        },
      ],
    });

    const user = userEvent.setup();
    renderPage();

    // Click meeting to open detail
    const meetingTitleBtn = await screen.findByRole('button', {
      name: 'Daily Standup Alpha',
    });
    await user.click(meetingTitleBtn);

    await waitFor(() => {
      expect(availabilityApi.getMeetingDetail).toHaveBeenCalledWith('m-1');
    });

    // Detail modal displays participants and their response badges
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Developer One')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

    // Developer sees response action buttons (Aceptar / Rechazar)
    const acceptBtn = screen.getByRole('button', { name: 'Aceptar' });
    await user.click(acceptBtn);

    await waitFor(() => {
      expect(availabilityApi.respondMeeting).toHaveBeenCalledWith('m-1', 'aceptada');
    });

    expect(
      await screen.findByText(AVAILABILITY_MESSAGES.meetingResponseRegistered),
    ).toBeInTheDocument();
  });

  it('HU_DN_03_45: creator can cancel meeting with confirmation modal and literal message', async () => {
    vi.mocked(availabilityApi.cancelMeeting).mockResolvedValueOnce({
      ...mockMeetings[0]!,
      status: 'cancelled',
    });

    const user = userEvent.setup();
    renderPage();

    const cancelIconBtn = await screen.findByTitle('Cancelar reunión');
    await user.click(cancelIconBtn);

    // Cancel modal opens with literal confirmation message
    expect(screen.getByText(AVAILABILITY_MESSAGES.cancelConfirmMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();

    const confirmCancelBtn = screen.getByRole('button', {
      name: 'Confirmar',
    });
    await user.click(confirmCancelBtn);

    await waitFor(() => {
      expect(availabilityApi.cancelMeeting).toHaveBeenCalledWith('m-1');
    });

    expect(await screen.findByText(AVAILABILITY_MESSAGES.meetingCancelled)).toBeInTheDocument();
  });

  it('HU_DN_03_41: creator can register summary and minutes URL for completed/past meeting', async () => {
    const user = userEvent.setup();
    renderPage();

    // Switch to 'Pasadas'
    await user.click(screen.getByRole('button', { name: /Pasadas/i }));
    expect(await screen.findByText('Sprint Planning Pasado')).toBeInTheDocument();

    // Click 'Editar resumen'
    const summaryBtn = screen.getByRole('button', { name: /Editar resumen/i });
    await user.click(summaryBtn);

    // Modal opens with textarea
    const textarea = screen.getByPlaceholderText(/Acuerdos principales/i);
    expect(textarea).toBeInTheDocument();
    await user.clear(textarea);
    await user.type(textarea, 'Nuevos acuerdos actualizados.');

    vi.mocked(availabilityApi.updateMeetingSummary).mockResolvedValueOnce({
      ...mockMeetings[1]!,
      summary: 'Nuevos acuerdos actualizados.',
    });

    const saveBtn = screen.getByRole('button', { name: 'Guardar' });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(availabilityApi.updateMeetingSummary).toHaveBeenCalledWith('m-2', {
        summary: 'Nuevos acuerdos actualizados.',
        minutes_url: 'https://docs.google.com/document/d/doc-1',
      });
    });

    expect(
      await screen.findByText(AVAILABILITY_MESSAGES.meetingSummaryRegistered),
    ).toBeInTheDocument();
  });

  it('HU_DN_03_41: participant can reject meeting invitation', async () => {
    currentUserRole = 'developer';
    currentUserId = 'user-dev';

    vi.mocked(availabilityApi.getMeetingDetail).mockResolvedValueOnce(mockMeetings[0]!);
    vi.mocked(availabilityApi.respondMeeting).mockResolvedValueOnce({
      ...mockMeetings[0]!,
      participants: [
        {
          user_id: 'user-mgr',
          name: 'Manager User',
          email: 'user@test.com',
          response: 'aceptada',
        },
        {
          user_id: 'user-dev',
          name: 'Developer One',
          email: 'dev@test.com',
          response: 'rechazada',
        },
      ],
    });

    const user = userEvent.setup();
    renderPage();

    const titleBtn = await screen.findByRole('button', { name: 'Daily Standup Alpha' });
    await user.click(titleBtn);

    const rejectBtn = await screen.findByRole('button', { name: 'Rechazar' });
    await user.click(rejectBtn);

    await waitFor(() => {
      expect(availabilityApi.respondMeeting).toHaveBeenCalledWith('m-1', 'rechazada');
    });
  });

  it('filters meetings by status chip', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Daily Standup Alpha')).toBeInTheDocument();

    const cancelledChip = screen.getByRole('button', { name: 'Canceladas' });
    await user.click(cancelledChip);
    expect(screen.getByText(AVAILABILITY_MESSAGES.noMeetingsToShow)).toBeInTheDocument();

    const scheduledChip = screen.getByRole('button', { name: 'Programadas' });
    await user.click(scheduledChip);
    expect(screen.getByText('Daily Standup Alpha')).toBeInTheDocument();

    const allChip = screen.getByRole('button', { name: 'Todas' });
    await user.click(allChip);
    expect(screen.getByText('Daily Standup Alpha')).toBeInTheDocument();
  });

  it('validates minutes url in summary modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Pasadas/i }));
    await user.click(screen.getByRole('button', { name: /Editar resumen/i }));

    const urlInp = screen.getByLabelText(/Enlace del acta/i);
    await user.clear(urlInp);
    await user.type(urlInp, 'ftp://invalid-url');

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText(AVAILABILITY_MESSAGES.invalidMinutesUrl)).toBeInTheDocument();
    expect(availabilityApi.updateMeetingSummary).not.toHaveBeenCalled();

    // Close modal
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByPlaceholderText(/Acuerdos principales/i)).not.toBeInTheDocument();
  });

  it('navigates calendar months and copies link', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Daily Standup Alpha')).toBeInTheDocument();

    // Copy link
    const copyBtn = screen.getByTitle('Copiar enlace');
    fireEvent.click(copyBtn);
    expect(await screen.findByText('Enlace copiado.')).toBeInTheDocument();

    // Calendar navigation
    await user.click(screen.getByRole('button', { name: /Vista Calendario/i }));
    const nextBtn = screen.getByRole('button', { name: /Mes siguiente/i });
    await user.click(nextBtn);
    const prevBtn = screen.getByRole('button', { name: /Mes anterior/i });
    await user.click(prevBtn);
  });

  it('closes detail modal when clicking close button', async () => {
    vi.mocked(availabilityApi.getMeetingDetail).mockResolvedValueOnce(mockMeetings[0]!);
    const user = userEvent.setup();
    renderPage();

    const titleBtn = await screen.findByRole('button', { name: 'Daily Standup Alpha' });
    await user.click(titleBtn);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Cerrar detalle' });
    await user.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows error banner when user is forbidden from viewing meeting detail', async () => {
    vi.mocked(availabilityApi.getMeetingDetail).mockRejectedValueOnce(
      new ApiError(403, { code: 'FORBIDDEN', message: 'Forbidden', fields: {} }),
    );
    const user = userEvent.setup();
    renderPage();

    const titleBtn = await screen.findByRole('button', { name: 'Daily Standup Alpha' });
    await user.click(titleBtn);
    expect(
      await screen.findByText(AVAILABILITY_MESSAGES.meetingDetailForbidden),
    ).toBeInTheDocument();
  });

  it('handles cancellation errors gracefully', async () => {
    vi.mocked(availabilityApi.cancelMeeting).mockRejectedValueOnce(new Error('Fail'));
    const user = userEvent.setup();
    renderPage();

    const cancelIconBtn = await screen.findByTitle('Cancelar reunión');
    await user.click(cancelIconBtn);

    const confirmCancelBtn = screen.getByRole('button', { name: 'Confirmar' });
    await user.click(confirmCancelBtn);

    expect(await screen.findByText(AVAILABILITY_MESSAGES.technicalFailure)).toBeInTheDocument();
  });

  // HU_DN_03_42 Tests
  it('HU_DN_03_42: opens Google Calendar with participant emails prefilled and handles popup blocker', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(availabilityApi.getMeetingDetail).mockResolvedValueOnce(mockMeetings[0]!);
    const user = userEvent.setup();
    renderPage();

    const meetingBtn = await screen.findByRole('button', { name: 'Daily Standup Alpha' });
    await user.click(meetingBtn);

    const dialog = await screen.findByRole('dialog');
    const gcBtn = within(dialog).getByRole('button', { name: /Enviar a Google Calendar/i });
    await user.click(gcBtn);

    expect(openSpy).toHaveBeenCalled();
    const calledUrl = openSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('calendar.google.com');
    expect(decodeURIComponent(calledUrl)).toContain('Daily Standup Alpha');
    expect(decodeURIComponent(calledUrl)).toContain('add=user@test.com,dev@test.com');

    expect(
      await within(dialog).findByText(AVAILABILITY_MESSAGES.googleCalendarOpenFailed),
    ).toBeInTheDocument();
    const copyDataBtn = within(dialog).getByRole('button', { name: 'Copiar datos de la reunión' });
    expect(copyDataBtn).toBeInTheDocument();

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });

    await user.click(copyDataBtn);
    expect(writeTextSpy).toHaveBeenCalled();
    expect(await screen.findByText(AVAILABILITY_MESSAGES.meetingDataCopied)).toBeInTheDocument();

    openSpy.mockRestore();
  });

  it('HU_DN_03_42: shows clipboard copy error if clipboard fails', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(availabilityApi.getMeetingDetail).mockResolvedValueOnce(mockMeetings[0]!);
    const user = userEvent.setup();
    renderPage();

    const meetingBtn = await screen.findByRole('button', { name: 'Daily Standup Alpha' });
    await user.click(meetingBtn);

    const dialog = await screen.findByRole('dialog');
    const gcBtn = within(dialog).getByRole('button', { name: /Enviar a Google Calendar/i });
    await user.click(gcBtn);

    const copyDataBtn = await within(dialog).findByRole('button', {
      name: 'Copiar datos de la reunión',
    });
    const writeTextSpy = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });

    await user.click(copyDataBtn);
    expect(
      (await screen.findAllByText(AVAILABILITY_MESSAGES.clipboardCopyFailed)).length,
    ).toBeGreaterThan(0);
  });

  // HU_DN_03_44 Tests
  it('HU_DN_03_44: displays error when trying to respond to a cancelled or past meeting', async () => {
    currentUserRole = 'developer';
    currentUserId = 'user-dev';
    vi.mocked(availabilityApi.getMeetingDetail).mockResolvedValueOnce(mockMeetings[0]!);
    vi.mocked(availabilityApi.respondMeeting).mockRejectedValueOnce(
      new ApiError(400, {
        code: 'MEETING_CANCELLED',
        message: AVAILABILITY_MESSAGES.meetingCancelledCannotRespond,
        fields: {},
      }),
    );

    const user = userEvent.setup();
    renderPage();

    const meetingBtn = await screen.findByRole('button', { name: 'Daily Standup Alpha' });
    await user.click(meetingBtn);

    const acceptBtn = screen.getByRole('button', { name: 'Aceptar' });
    await user.click(acceptBtn);

    expect(
      await screen.findByText(AVAILABILITY_MESSAGES.meetingCancelledCannotRespond),
    ).toBeInTheDocument();
  });

  // HU_DN_03_45 Tests
  it('HU_DN_03_45: non-creator developer cannot see cancel button on card or modal', async () => {
    currentUserRole = 'developer';
    currentUserId = 'user-other';
    renderPage();

    await screen.findByText('Daily Standup Alpha');
    expect(screen.queryByTitle('Cancelar reunión')).not.toBeInTheDocument();
  });

  it('HU_DN_03_45: displays ONLY_CREATOR_CAN_CANCEL error message if cancellation rejected', async () => {
    vi.mocked(availabilityApi.cancelMeeting).mockRejectedValueOnce(
      new ApiError(403, {
        code: 'ONLY_CREATOR_CAN_CANCEL',
        message: AVAILABILITY_MESSAGES.onlyCreatorCanCancel,
        fields: {},
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const cancelIconBtn = await screen.findByTitle('Cancelar reunión');
    await user.click(cancelIconBtn);

    const confirmCancelBtn = screen.getByRole('button', { name: 'Confirmar' });
    await user.click(confirmCancelBtn);

    expect(await screen.findByText(AVAILABILITY_MESSAGES.onlyCreatorCanCancel)).toBeInTheDocument();
  });

  // HU_DN_03_46 Tests
  it('HU_DN_03_46: validates empty summary before submitting', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Pasadas/i }));
    await user.click(screen.getByRole('button', { name: /Editar resumen/i }));

    const textarea = screen.getByPlaceholderText(/Acuerdos principales/i);
    await user.clear(textarea);

    const saveBtn = screen.getByRole('button', { name: 'Guardar' });
    await user.click(saveBtn);

    expect(screen.getByText(AVAILABILITY_MESSAGES.summaryRequired)).toBeInTheDocument();
    expect(availabilityApi.updateMeetingSummary).not.toHaveBeenCalled();
  });

  it('HU_DN_03_46: displays MEETING_NOT_COMPLETED error if meeting is not completed', async () => {
    vi.mocked(availabilityApi.updateMeetingSummary).mockRejectedValueOnce(
      new ApiError(400, {
        code: 'MEETING_NOT_COMPLETED',
        message: AVAILABILITY_MESSAGES.meetingNotCompleted,
        fields: {},
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Pasadas/i }));
    await user.click(screen.getByRole('button', { name: /Editar resumen/i }));

    const saveBtn = screen.getByRole('button', { name: 'Guardar' });
    await user.click(saveBtn);

    expect(await screen.findByText(AVAILABILITY_MESSAGES.meetingNotCompleted)).toBeInTheDocument();
  });
});
