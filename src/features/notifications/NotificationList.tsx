import { Bell, Check, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { useToast } from '@/lib/toast/ToastProvider';
import {
  deleteAllNotifications,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  openNotification,
} from './api';
import { DeleteAllNotificationsModal } from './DeleteAllNotificationsModal';
import { NOTIFICATION_MESSAGES, isAllowedNotificationRoute, formatUnreadBadge } from './messages';
import type { NotificationItem } from './types';

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveOpenError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'ENTITY_NOT_AVAILABLE') return NOTIFICATION_MESSAGES.entityNotAvailable;
    if (error.code === 'ENTITY_ACCESS_DENIED') return NOTIFICATION_MESSAGES.entityAccessDenied;
    if (error.code === 'NOTIFICATION_NOT_FOUND') return NOTIFICATION_MESSAGES.notificationNotFound;
    if (error.message) return error.message;
  }
  return NOTIFICATION_MESSAGES.openFailure;
}

export interface NotificationListProps {
  unreadOnly: boolean;
  onUnreadOnlyChange: (value: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
  compact?: boolean;
  showDeleteAll?: boolean;
}

export function NotificationList({
  unreadOnly,
  onUnreadOnlyChange,
  onUnreadCountChange,
  compact = false,
  showDeleteAll = true,
}: NotificationListProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await listNotifications({ limit: 25, unread_only: unreadOnly });
      setItems(res.items);
    } catch (error) {
      setListError(
        isTechnicalFailure(error)
          ? NOTIFICATION_MESSAGES.loadListFailure
          : error instanceof ApiError
            ? error.message
            : NOTIFICATION_MESSAGES.loadListFailure,
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const syncUnread = useCallback(
    (count: number) => {
      onUnreadCountChange?.(count);
    },
    [onUnreadCountChange],
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      syncUnread(res.count);
    } catch {
      /* polling will recover */
    }
  }, [syncUnread]);

  const handleMarkOne = async (id: string, event: MouseEvent) => {
    event.stopPropagation();
    setActionId(id);
    try {
      const res = await markNotificationsRead([id]);
      syncUnread(res.unread_count);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item,
        ),
      );
    } catch (error) {
      showToast(
        isTechnicalFailure(error)
          ? NOTIFICATION_MESSAGES.markReadFailure
          : (error as Error).message,
        'error',
      );
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAll = async () => {
    setActionId('all');
    try {
      const res = await markAllNotificationsRead();
      syncUnread(res.unread_count);
      await load();
    } catch (error) {
      showToast(
        isTechnicalFailure(error)
          ? NOTIFICATION_MESSAGES.markReadFailure
          : (error as Error).message,
        'error',
      );
    } finally {
      setActionId(null);
    }
  };

  const handleOpen = async (item: NotificationItem) => {
    setActionId(item.id);
    try {
      const res = await openNotification(item.id);
      await refreshUnreadCount();
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, read_at: res.read_at } : row)),
      );
      if (isAllowedNotificationRoute(res.route)) {
        navigate(res.route);
      } else {
        showToast(NOTIFICATION_MESSAGES.entityNotAvailable, 'error');
      }
    } catch (error) {
      showToast(resolveOpenError(error), 'error');
      if (error instanceof ApiError && error.code === 'ENTITY_NOT_AVAILABLE') {
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, read_at: row.read_at ?? new Date().toISOString() } : row,
          ),
        );
        await load();
      }
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await deleteAllNotifications();
      syncUnread(res.unread_count);
      setDeleteOpen(false);
      await load();
    } catch (error) {
      showToast(
        isTechnicalFailure(error) ? NOTIFICATION_MESSAGES.deleteFailure : (error as Error).message,
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const unreadInList = items.filter((n) => !n.read_at).length;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              !unreadOnly
                ? 'bg-white/10 text-[#F9FAFB]'
                : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
            }`}
            onClick={() => onUnreadOnlyChange(false)}
          >
            {NOTIFICATION_MESSAGES.showAll}
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              unreadOnly
                ? 'bg-white/10 text-[#F9FAFB]'
                : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
            }`}
            onClick={() => onUnreadOnlyChange(true)}
          >
            {NOTIFICATION_MESSAGES.unreadOnly}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadInList > 0 ? (
            <button
              type="button"
              className="text-xs text-blue-400 transition-colors hover:text-blue-300"
              disabled={actionId !== null}
              onClick={() => void handleMarkAll()}
            >
              {NOTIFICATION_MESSAGES.markAllRead}
            </button>
          ) : null}
          {showDeleteAll ? (
            <button
              type="button"
              className="text-xs text-red-400 transition-colors hover:text-red-300"
              disabled={items.length === 0 || deleting}
              onClick={() => setDeleteOpen(true)}
            >
              {NOTIFICATION_MESSAGES.deleteAll}
            </button>
          ) : null}
        </div>
      </div>

      {listError ? (
        <div className="px-4 py-3 text-xs text-red-400" role="alert">
          {listError}
        </div>
      ) : null}

      <div
        className={compact ? 'max-h-80 overflow-y-auto' : 'min-h-[12rem] flex-1 overflow-y-auto'}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-[#9CA3AF]">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[#6B7280]">
            {NOTIFICATION_MESSAGES.empty}
          </div>
        ) : (
          <ul className="divide-y divide-white/4">
            {items.map((item) => {
              const unread = !item.read_at;
              const busy = actionId === item.id;
              return (
                <li key={item.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/3 ${
                      unread ? 'bg-blue-500/4' : ''
                    }`}
                    onClick={() => void handleOpen(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void handleOpen(item);
                      }
                    }}
                  >
                    <Bell size={12} className="mt-1 shrink-0 text-blue-400" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium ${unread ? 'text-[#F9FAFB]' : 'text-[#9CA3AF]'}`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">
                        {item.message}
                      </p>
                      {item.project ? (
                        <p className="mt-1 text-[10px] text-[#4B5563]">{item.project.name}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-[#4B5563]">
                        {formatWhen(item.created_at)}
                      </p>
                    </div>
                    {unread ? (
                      <button
                        type="button"
                        title={NOTIFICATION_MESSAGES.markOneRead}
                        aria-label={NOTIFICATION_MESSAGES.markOneRead}
                        className="shrink-0 rounded p-1 text-[#9CA3AF] transition-colors hover:bg-white/10 hover:text-[#F9FAFB]"
                        disabled={busy}
                        onClick={(e) => void handleMarkOne(item.id, e)}
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Check size={14} aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span className="w-6 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DeleteAllNotificationsModal
        open={deleteOpen}
        loading={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteAll()}
      />
    </div>
  );
}

export function NotificationListHeaderBadge({ count }: { count: number }) {
  const label = formatUnreadBadge(count);
  if (!label) return null;
  return (
    <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {label}
    </span>
  );
}
