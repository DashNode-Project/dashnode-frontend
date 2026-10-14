import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { PATHS } from '@/app/paths';
import { LoadFailureScreen } from '@/components/LoadFailureScreen';
import { useAuth } from './AuthContext';
import { homePathFor } from './roles';
import type { Role } from './types';

/**
 * Protected area. On the first visit (also after a reload) the session is validated with the
 * server: valid -> the same view is restored; absent or expired -> login; technical failure ->
 * the load-failure message with a retry action.
 */
export function RequireAuth() {
  const location = useLocation();
  const { status, restore } = useAuth();

  useEffect(() => {
    if (status === 'unknown') void restore();
  }, [status, restore]);

  if (status === 'authenticated') return <Outlet />;
  if (status === 'anonymous') {
    return (
      <Navigate
        to={PATHS.login}
        replace
        state={{ returnTo: location.pathname + location.search }}
      />
    );
  }
  if (status === 'error') return <LoadFailureScreen onRetry={() => void restore()} />;
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <span className="text-sm text-[#9CA3AF]">Verificando sesión…</span>
    </div>
  );
}

/**
 * Login and registration are for visitors: an authenticated user goes to their home. The
 * session check runs in the background so the form is never delayed.
 */
export function GuestOnly() {
  const { status, user, restore } = useAuth();

  useEffect(() => {
    if (status === 'unknown') void restore({ silent: true });
  }, [status, restore]);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}

/** Only the given role(s) see nested routes; anyone else is sent to their own home. */
export function RequireRole({ allow }: { allow: Role | Role[] }) {
  const { user } = useAuth();
  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!user) return <Navigate to={PATHS.login} replace />;
  if (!allowed.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}
