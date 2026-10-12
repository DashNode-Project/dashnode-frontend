export type Role = 'admin' | 'manager' | 'developer';

/** User as exposed by the API: never contains a password or hash. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResult {
  message: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LogoutResult {
  message: string;
}

/** What the client may know about its session (never the token). */
export interface SessionInfo {
  user: AuthUser;
  /** ISO-8601 UTC instant at which the session ends (8 hours after login). */
  expires_at: string;
}
