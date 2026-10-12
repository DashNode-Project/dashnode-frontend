import { apiRequest } from '@/lib/api/client';
import type { LoginPayload, RegisterPayload, RegisterResult, SessionInfo } from './types';

export function registerManager(payload: RegisterPayload): Promise<RegisterResult> {
  return apiRequest<RegisterResult>('/auth/register', { method: 'POST', body: payload });
}

/** Opens a server session; the token travels only in an HttpOnly cookie. */
export function loginRequest(payload: LoginPayload): Promise<SessionInfo> {
  return apiRequest<SessionInfo>('/auth/login', { method: 'POST', body: payload });
}
