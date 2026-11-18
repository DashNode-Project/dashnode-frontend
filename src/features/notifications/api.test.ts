import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import {
  deleteAllNotifications,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  openNotification,
} from './api';

describe('notifications api client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists notifications with limit 25 and unread filter', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/notifications?');
      expect(call.url).toContain('limit=25');
      expect(call.url).toContain('unread_only=true');
      return ok({ items: [], next_cursor: null });
    });
    await listNotifications({ unread_only: true });
  });

  it('fetches unread count', async () => {
    mockFetch((call) => {
      expect(call.url.endsWith('/notifications/unread-count')).toBe(true);
      return ok({ count: 3 });
    });
    const res = await getUnreadCount();
    expect(res.count).toBe(3);
  });

  it('marks ids as read', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/notifications/read');
      expect(call.body).toEqual({ ids: ['n-1'] });
      return ok({ updated: 1, unread_count: 0 });
    });
    await markNotificationsRead(['n-1']);
  });

  it('marks all read and deletes all with confirm', async () => {
    const calls: string[] = [];
    mockFetch((call) => {
      calls.push(call.url);
      if (call.url.endsWith('/notifications/read-all')) {
        return ok({ updated: 2, unread_count: 0 });
      }
      if (call.url.endsWith('/notifications/delete-all')) {
        expect(call.body).toEqual({ confirm: true });
        return ok({ deleted: 2, unread_count: 0 });
      }
      return ok({});
    });
    await markAllNotificationsRead();
    await deleteAllNotifications();
    expect(calls.some((u) => u.includes('read-all'))).toBe(true);
    expect(calls.some((u) => u.includes('delete-all'))).toBe(true);
  });

  it('opens a notification', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/notifications/n-9/open');
      return ok({ route: '/mis-tareas', read_at: '2026-11-17T12:00:00Z' });
    });
    await openNotification('n-9');
  });
});