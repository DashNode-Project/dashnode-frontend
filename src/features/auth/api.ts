import { apiRequest } from '@/lib/api/client';
import type { RegisterPayload, RegisterResult } from './types';

export function registerManager(payload: RegisterPayload): Promise<RegisterResult> {
  return apiRequest<RegisterResult>('/auth/register', { method: 'POST', body: payload });
}
