import { useCallback, useEffect, useRef } from 'react';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { getUnreadCount } from './api';

const POLL_INTERVAL_MS = 30_000;

export interface UseNotificationPollingOptions {
  enabled: boolean;
  onCount: (count: number) => void;
  onError?: (message: string | null) => void;
}

/**
 * Polls unread notification count every 30s, refreshes on window focus, pauses when the tab is hidden.
 */
export function useNotificationPolling({
  enabled,
  onCount,
  onError,
}: UseNotificationPollingOptions): { refresh: () => Promise<void> } {
  const inFlight = useRef(false);

  const fetchCount = useCallback(async () => {
    if (!enabled || inFlight.current || document.hidden) return;
    inFlight.current = true;
    try {
      const { count } = await getUnreadCount();
      onCount(count);
      onError?.(null);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
        onError?.(error.message);
      } else if (!isTechnicalFailure(error)) {
        onError?.(null);
      }
    } finally {
      inFlight.current = false;
    }
  }, [enabled, onCount, onError]);

  useEffect(() => {
    if (!enabled) return;

    void fetchCount();

    const interval = window.setInterval(() => {
      void fetchCount();
    }, POLL_INTERVAL_MS);

    const onFocus = () => {
      void fetchCount();
    };
    const onVisibility = () => {
      if (!document.hidden) void fetchCount();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, fetchCount]);

  return { refresh: fetchCount };
}
