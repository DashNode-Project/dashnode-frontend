import { Bell, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { NOTIFICATION_MESSAGES, formatUnreadBadge } from './messages';
import { NotificationList, NotificationListHeaderBadge } from './NotificationList';
import { useNotificationPolling } from './useNotificationPolling';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  const { refresh } = useNotificationPolling({ enabled: true, onCount: handleCount });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const badge = formatUnreadBadge(unreadCount);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void refresh();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#F9FAFB] active:bg-white/10"
      >
        <Bell size={16} aria-hidden="true" />
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-blue-500 px-1 text-center text-[10px] font-semibold leading-4 text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-white/10 bg-[#12131C] shadow-2xl"
          role="dialog"
          aria-label={NOTIFICATION_MESSAGES.panelTitle}
        >
          <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#9CA3AF]" aria-hidden="true" />
              <span className="text-sm font-medium text-[#F9FAFB]">
                {NOTIFICATION_MESSAGES.panelTitle}
              </span>
              <NotificationListHeaderBadge count={unreadCount} />
            </div>
            <button
              type="button"
              aria-label="Cerrar panel de notificaciones"
              className="text-[#6B7280] transition-colors hover:text-[#F9FAFB]"
              onClick={() => setOpen(false)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <NotificationList
            compact
            unreadOnly={unreadOnly}
            onUnreadOnlyChange={setUnreadOnly}
            onUnreadCountChange={setUnreadCount}
          />

          <div className="border-t border-white/6 px-4 py-2 text-center">
            <Link
              to={PATHS.notifications}
              className="text-xs text-blue-400 transition-colors hover:text-blue-300"
              onClick={() => setOpen(false)}
            >
              {NOTIFICATION_MESSAGES.viewAll}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
