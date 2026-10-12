import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useSetFlash } from '@/app/FlashContext';
import { PATHS } from '@/app/paths';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { loginRequest, logoutRequest, sessionRequest } from './api';
import type { AuthUser, LoginPayload } from './types';

/**
 * - unknown: nobody asked the server yet (public screens never do);
 * - checking: the session is being validated;
 * - authenticated / anonymous: result of the validation;
 * - error: the validation could not be completed (service down, timeout).
 */
export type AuthStatus = 'unknown' | 'checking' | 'authenticated' | 'anonymous' | 'error';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  expiresAt: string | null;
}

interface RestoreOptions {
  /** Treat a technical failure as "no session" instead of an error (used by public screens). */
  silent?: boolean;
}

interface AuthApi extends AuthState {
  isAuthenticated: boolean;
  /** Opens a session. Rejects with the API error so the screen can show its message. */
  login: (payload: LoginPayload) => Promise<AuthUser>;
  /**
   * Invalidates the session in the server and clears the client state. Rejects (keeping the
   * session untouched) when the server could not be reached, so the screen can report it.
   */
  logout: () => Promise<void>;
  /** Validates the session cookie with the server (HU_DN_01_05). Never rejects. */
  restore: (options?: RestoreOptions) => Promise<void>;
  /** Updates in-memory user after profile changes (HU_DN_01_21). */
  applySessionUser: (user: AuthUser) => void;
}

const SIGNED_OUT: AuthState = { status: 'anonymous', user: null, expiresAt: null };

/** Largest delay accepted by setTimeout. */
const MAX_TIMER_MS = 2 ** 31 - 1;

const AuthContext = createContext<AuthApi | null>(null);

/**
 * Holds the authenticated user in memory only. The session itself is an HttpOnly cookie that
 * JavaScript cannot read; nothing about the session is written to web storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'unknown', user: null, expiresAt: null });
  const setFlash = useSetFlash();
  const inFlight = useRef<Promise<void> | null>(null);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginRequest(payload);
    setState({ status: 'authenticated', user: session.user, expiresAt: session.expires_at });
    return session.user;
  }, []);

  const applySessionUser = useCallback((user: AuthUser) => {
    setState((current) => (current.status === 'authenticated' ? { ...current, user } : current));
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    // The message is scheduled first: clearing the user redirects to the login right away.
    setFlash({ kind: 'success', message: MESSAGES.loggedOut }, PATHS.login);
    setState(SIGNED_OUT);
  }, [setFlash]);

  const restore = useCallback(
    (options: RestoreOptions = {}) => {
      if (inFlight.current) return inFlight.current;

      // A result must never overwrite a session opened (login) while the request was running.
      const apply = (next: AuthState) =>
        setState((current) => (current.status === 'authenticated' ? current : next));

      setState((current) =>
        current.status === 'authenticated' ? current : { ...current, status: 'checking' },
      );

      const run = async () => {
        try {
          const session = await sessionRequest();
          apply({ status: 'authenticated', user: session.user, expiresAt: session.expires_at });
        } catch (error) {
          if (error instanceof ApiError && !isTechnicalFailure(error)) {
            if (error.code === 'SESSION_EXPIRED') {
              setFlash({ kind: 'info', message: MESSAGES.sessionExpired }, PATHS.login);
            } else if (error.code === 'ACCOUNT_DISABLED') {
              setFlash({ kind: 'error', message: error.message }, PATHS.login);
            }
            apply(SIGNED_OUT);
            return;
          }
          apply(options.silent ? SIGNED_OUT : { status: 'error', user: null, expiresAt: null });
        } finally {
          inFlight.current = null;
        }
      };
      inFlight.current = run();
      return inFlight.current;
    },
    [setFlash],
  );

  // The session lasts 8 hours from login and is never renewed: when it ends the user is sent to
  // the login with the expiry message, even if no request is made at that moment.
  const { status, expiresAt } = state;
  useEffect(() => {
    if (status !== 'authenticated' || !expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const timer = setTimeout(
      () => {
        setFlash({ kind: 'info', message: MESSAGES.sessionExpired }, PATHS.login);
        setState(SIGNED_OUT);
      },
      Math.min(Math.max(remaining, 0), MAX_TIMER_MS),
    );
    return () => clearTimeout(timer);
  }, [status, expiresAt, setFlash]);

  const value = useMemo<AuthApi>(
    () => ({
      ...state,
      isAuthenticated: state.status === 'authenticated',
      login,
      logout,
      restore,
      applySessionUser,
    }),
    [state, login, logout, restore, applySessionUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
