import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { loginRequest } from './api';
import type { AuthUser, LoginPayload } from './types';

interface AuthState {
  user: AuthUser | null;
  expiresAt: string | null;
}

interface AuthApi extends AuthState {
  isAuthenticated: boolean;
  /** Opens a session. Rejects with the API error so the screen can show its message. */
  login: (payload: LoginPayload) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthApi | null>(null);

/**
 * Holds the authenticated user in memory only. The session itself is an HttpOnly cookie that
 * JavaScript cannot read; nothing about the session is written to web storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, expiresAt: null });

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginRequest(payload);
    setState({ user: session.user, expiresAt: session.expires_at });
    return session.user;
  }, []);

  const value = useMemo<AuthApi>(
    () => ({ ...state, isAuthenticated: state.user !== null, login }),
    [state, login],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
