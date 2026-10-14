import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import {
  getMyAvailability,
  saveMyAvailability,
  getTeamAvailability,
  searchMeetingSlots,
  createMeeting,
  listMeetings,
  getMeetingDetail,
  cancelMeeting,
  respondMeeting,
  updateMeetingSummary,
  getManagedProjects,
} from './api';

describe('availability api client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('gets my availability', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/availability/mine?week=2026-10-12');
      return ok({
        id: 'a1',
        user_id: 'u1',
        week_start_date: '2026-10-12',
        is_inherited: false,
        slots: { monday: [] },
      });
    });
    const res = await getMyAvailability('2026-10-12');
    expect(res.user_id).toBe('u1');
  });

  it('saves my availability', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/availability/mine');
      return ok({ message: 'Disponibilidad guardada correctamente.' });
    });
    const res = await saveMyAvailability({
      week_start_date: '2026-10-12',
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
    expect(res.message).toBe('Disponibilidad guardada correctamente.');
  });

  it('gets team availability', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/availability/team?week=2026-10-12');
      return ok({
        week_start_date: '2026-10-12',
        users: [
          { user_id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'developer', slots: {} },
        ],
      });
    });
    const res = await getTeamAvailability('2026-10-12');
    expect(res.users).toHaveLength(1);
  });

  it('searches meeting slots', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/availability/search-slots');
      return ok({
        results: [{ day: 'monday', date: '2026-10-12', slots: [{ start: '10:00', end: '11:00' }] }],
      });
    });
    const res = await searchMeetingSlots({
      interval_start: '08:00',
      interval_end: '18:00',
      days: ['monday'],
      participant_ids: ['u1'],
      duration_hours: 1,
    });
    expect(res.results).toHaveLength(1);
  });

  it('creates and lists meetings', async () => {
    mockFetch((call) => {
      if (call.method === 'POST') {
        expect(call.url).toContain('/availability/meetings');
        return ok({ id: 'm-1', title: 'Sync', status: 'scheduled' }, 201);
      }
      if (call.method === 'GET') {
        expect(call.url).toContain(
          '/availability/meetings?date_from=2026-10-01&date_to=2026-10-31',
        );
        return ok([{ id: 'm-1', title: 'Sync', status: 'scheduled' }]);
      }
      return ok({});
    });

    const created = await createMeeting({
      title: 'Sync',
      type: 'General',
      project_id: 'p-1',
      date: '2026-10-12',
      start_time: '10:00',
      end_time: '11:00',
      duration: 60,
      participant_ids: ['u1'],
    });
    expect(created.id).toBe('m-1');

    const list = await listMeetings('2026-10-01', '2026-10-31', 'proximas');
    expect(list).toHaveLength(1);
  });

  it('gets meeting detail', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/availability/meetings/m-123');
      return ok({ id: 'm-123', title: 'Planning' });
    });
    const res = await getMeetingDetail('m-123');
    expect(res.id).toBe('m-123');
  });

  it('cancels meeting', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/availability/meetings/m-123/cancel');
      return ok({ id: 'm-123', status: 'cancelled' });
    });
    const res = await cancelMeeting('m-123');
    expect(res.status).toBe('cancelled');
  });

  it('responds to meeting invitation', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/availability/meetings/m-123/respond');
      expect(call.body).toEqual({ response: 'aceptada' });
      return ok({ id: 'm-123', status: 'scheduled' });
    });
    const res = await respondMeeting('m-123', 'aceptada');
    expect(res.id).toBe('m-123');
  });

  it('updates meeting summary and minutes', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/availability/meetings/m-123/summary');
      expect(call.body).toEqual({
        summary: 'Acuerdos clave',
        minutes_url: 'https://docs.google.com/doc',
      });
      return ok({ id: 'm-123', summary: 'Acuerdos clave' });
    });
    const res = await updateMeetingSummary('m-123', {
      summary: 'Acuerdos clave',
      minutes_url: 'https://docs.google.com/doc',
    });
    expect(res.summary).toBe('Acuerdos clave');
  });

  it('gets managed projects', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/availability/projects');
      return ok([{ id: 'p-1', name: 'Project 1', meeting_link: 'https://meet.google.com/abc' }]);
    });
    const res = await getManagedProjects();
    expect(res).toHaveLength(1);
    expect(res[0]?.meeting_link).toBe('https://meet.google.com/abc');
  });
});
