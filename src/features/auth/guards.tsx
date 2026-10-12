import { Navigate, Outlet } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from './AuthContext';
import { homePathFor } from './roles';
import type { Role } from './types';

/** Protected area: without an authenticated user the visitor goes to the login. */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to={PATHS.login} replace />;
  return <Outlet />;
}

/** Login and registration are for visitors: an authenticated user goes to their home. */
export function GuestOnly() {
  const { user } = useAuth();
  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}

/** Only the given role sees the screen; anyone else is sent to their own home. */
export function RequireRole({ allow }: { allow: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={PATHS.login} replace />;
  if (user.role !== allow) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}
