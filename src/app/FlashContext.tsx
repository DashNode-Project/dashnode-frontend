import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

export interface Flash {
  kind: 'success' | 'error' | 'info';
  message: string;
}

interface Entry {
  flash: Flash;
  /** Route where the message must be shown. */
  path: string;
}

function createFlashStore() {
  let current: Entry | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    set(entry: Entry) {
      current = entry;
      emit();
    },
    clear() {
      if (current === null) return;
      current = null;
      emit();
    },
    get: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type FlashStore = ReturnType<typeof createFlashStore>;

const FlashContext = createContext<FlashStore | null>(null);

/**
 * One-time messages across navigations (e.g. "Sesión cerrada correctamente.").
 *
 * The message lives in memory only (no web storage, no history state) so a reload never replays
 * it, and it is dropped as soon as the user leaves the screen it was meant for.
 */
export function FlashProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createFlashStore);
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = store.get();
    if (entry && entry.path !== pathname) store.clear();
  }, [pathname, store]);

  return <FlashContext.Provider value={store}>{children}</FlashContext.Provider>;
}

function useStore(): FlashStore {
  const store = useContext(FlashContext);
  if (!store) throw new Error('Flash hooks must be used inside <FlashProvider>');
  return store;
}

/** Schedules a message for the given route (call it right before navigating there). */
export function useSetFlash(): (flash: Flash, path: string) => void {
  const store = useStore();
  return useCallback((flash, path) => store.set({ flash, path }), [store]);
}

/** Message pending for the current route, plus a function to dismiss it. */
export function useIncomingFlash(): { flash: Flash | null; dismiss: () => void } {
  const store = useStore();
  const { pathname } = useLocation();
  const flash = useSyncExternalStore(store.subscribe, () => {
    const entry = store.get();
    return entry && entry.path === pathname ? entry.flash : null;
  });
  const dismiss = useCallback(() => store.clear(), [store]);
  return { flash, dismiss };
}
