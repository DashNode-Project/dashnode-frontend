import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSetFlash } from '@/app/FlashContext';
import { PATHS } from '@/app/paths';
import { MESSAGES } from '@/lib/messages';
import { loginRequest, logoutRequest } from './api';
import type { AuthUser, LoginPayload } from './types';

interface AuthState {
  user: AuthUser | null;
  expiresAt: string | null;
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
}

const SIGNED_OUT: AuthState = { user: null, expiresAt: null };

const AuthContext = createContext<AuthApi | null>(null);

/**
 * Holds the authenticated user in memory only. The session itself is an HttpOnly cookie that
 * JavaScript cannot read; nothing about the session is written to web storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(SIGNED_OUT);
  const setFlash = useSetFlash();

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginRequest(payload);
    setState({ user: session.user, expiresAt: session.expires_at });
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    // The message is scheduled first: clearing the user redirects to the login right away.
    setFlash({ kind: 'success', message: MESSAGES.loggedOut }, PATHS.login);
    setState(SIGNED_OUT);
  }, [setFlash]);

  const value = useMemo<AuthApi>(
    () => ({ ...state, isAuthenticated: state.user !== null, login, logout }),
    [state, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
