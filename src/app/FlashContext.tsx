import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';

export interface Flash {
  kind: 'success' | 'error' | 'info';
  message: string;
}

interface FlashApi {
  /** Stores a one-time message to be shown by the next screen. */
  setFlash: (flash: Flash) => void;
  /** Returns the pending message (if any) and clears it. */
  takeFlash: () => Flash | null;
}

const FlashContext = createContext<FlashApi | null>(null);

/**
 * In-memory, one-time messages across navigations (e.g. "Sesión cerrada correctamente.").
 * Deliberately not persisted anywhere (no web storage, no history state), so a reload never
 * replays an old message.
 */
export function FlashProvider({ children }: { children: ReactNode }) {
  const pending = useRef<Flash | null>(null);
  const setFlash = useCallback((flash: Flash) => {
    pending.current = flash;
  }, []);
  const takeFlash = useCallback(() => {
    const flash = pending.current;
    pending.current = null;
    return flash;
  }, []);
  const value = useMemo(() => ({ setFlash, takeFlash }), [setFlash, takeFlash]);
  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
}

export function useFlash(): FlashApi {
  const context = useContext(FlashContext);
  if (!context) throw new Error('useFlash must be used inside <FlashProvider>');
  return context;
}
