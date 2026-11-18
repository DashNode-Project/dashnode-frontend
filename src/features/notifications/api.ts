import { apiRequest } from '@/lib/api/client';
import type {
  DeleteAllResponse,
  ListNotificationsParams,
  MarkReadResponse,
  NotificationListResponse,
  OpenNotificationResponse,
  UnreadCountResponse,
} from './types';

function buildListQuery(params: ListNotificationsParams): string {
  const qs = new URLSearchParams();
  const limit = params.limit ?? 25;
  qs.set('limit', String(limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.unread_only) qs.set('unread_only', 'true');
  const query = qs.toString();
  return query ? `?${query}` : '';
}

export function listNotifications(
  params: ListNotificationsParams = {},
): Promise<NotificationListResponse> {
  return apiRequest<NotificationListResponse>(`/notifications${buildListQuery(params)}`);
}

export function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>('/notifications/unread-count');
}

export function markNotificationsRead(ids: string[]): Promise<MarkReadResponse> {
  return apiRequest<MarkReadResponse>('/notifications/read', {
    method: 'POST',
    body: { ids },
  });
}

export function markAllNotificationsRead(): Promise<MarkReadResponse> {
  return apiRequest<MarkReadResponse>('/notifications/read-all', { method: 'POST' });
}

export function deleteAllNotifications(): Promise<DeleteAllResponse> {
  return apiRequest<DeleteAllResponse>('/notifications/delete-all', {
    method: 'POST',
    body: { confirm: true },
  });
}

export function openNotification(notificationId: string): Promise<OpenNotificationResponse> {
  return apiRequest<OpenNotificationResponse>(`/notifications/${notificationId}/open`, {
    method: 'POST',
  });
}