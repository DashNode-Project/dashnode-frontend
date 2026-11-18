export interface NotificationActor {
  id: string;
  name: string;
}

export interface NotificationProject {
  id: string;
  name: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  project: NotificationProject | null;
  actor: NotificationActor | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  next_cursor: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkReadResponse {
  updated: number;
  unread_count: number;
}

export interface DeleteAllResponse {
  deleted: number;
  unread_count: number;
}

export interface OpenNotificationResponse {
  route: string;
  read_at: string;
}

export interface ListNotificationsParams {
  limit?: number;
  cursor?: string | null;
  unread_only?: boolean;
}
