import { apiFormRequest, apiRequest } from '@/lib/api/client';
import type {
  LoginPayload,
  LogoutResult,
  RegisterPayload,
  RegisterResult,
  SessionInfo,
} from './types';

export function registerManager(payload: RegisterPayload): Promise<RegisterResult> {
  return apiRequest<RegisterResult>('/auth/register', { method: 'POST', body: payload });
}

/** Opens a server session; the token travels only in an HttpOnly cookie. */
export function loginRequest(payload: LoginPayload): Promise<SessionInfo> {
  return apiRequest<SessionInfo>('/auth/login', { method: 'POST', body: payload });
}

/** Invalidates the server session (the server also removes the cookie). */
export function logoutRequest(): Promise<LogoutResult> {
  return apiRequest<LogoutResult>('/auth/logout', { method: 'POST' });
}

/** Asks the server whether the browser's session cookie is still valid (HU_DN_01_05). */
export function sessionRequest(): Promise<SessionInfo> {
  return apiRequest<SessionInfo>('/auth/session');
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/password-reset/request', {
    method: 'POST',
    body: { email },
  });
}

export interface CompletePasswordResetPayload {
  token: string;
  password: string;
  confirm_password: string;
}

export function confirmPasswordReset(
  payload: CompletePasswordResetPayload,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: payload,
  });
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export function adminRequestPasswordReset(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/auth/admin/users/${userId}/password-reset`, {
    method: 'POST',
  });
}

export interface ListAdminUsersParams {
  name?: string;
  role?: string;
}

export function listAdminUsers(params: ListAdminUsersParams = {}): Promise<AdminUserSummary[]> {
  const query = new URLSearchParams();
  if (params.name?.trim()) query.set('name', params.name.trim());
  if (params.role?.trim()) query.set('role', params.role.trim());
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<AdminUserSummary[]>(`/auth/admin/users${suffix}`);
}

export interface AdminDashboardSummary {
  project_count: number;
}

export function fetchAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  return apiRequest<AdminDashboardSummary>('/auth/admin/dashboard-summary');
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: string;
}

export function createUserByAdmin(payload: CreateUserPayload): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/admin/users', {
    method: 'POST',
    body: payload,
  });
}

export interface InviteDeveloperPayload {
  name: string;
  email: string;
  role?: string;
}

export interface InviteDeveloperResult {
  message: string;
  user_id: string;
  initial_password: string;
}

export function inviteDeveloper(payload: InviteDeveloperPayload): Promise<InviteDeveloperResult> {
  return apiRequest<InviteDeveloperResult>('/auth/manager/users/invite', {
    method: 'POST',
    body: payload,
  });
}

export interface ManagerDeveloperSummary {
  id: string;
  name: string;
  email: string;
  status: string;
  is_active: boolean;
}

export function listManagerDevelopers(): Promise<ManagerDeveloperSummary[]> {
  return apiRequest<ManagerDeveloperSummary[]>('/auth/manager/developers');
}

export function deactivateDeveloperByManager(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/auth/manager/developers/${encodeURIComponent(userId)}/deactivate`,
    { method: 'POST' },
  );
}

export function reactivateDeveloperByManager(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/auth/manager/developers/${encodeURIComponent(userId)}/reactivate`,
    { method: 'POST' },
  );
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: string;
}

export interface UpdateUserResult {
  message: string;
  user: AdminUserSummary;
}

export function updateUserByAdmin(
  userId: string,
  payload: UpdateUserPayload,
): Promise<UpdateUserResult> {
  return apiRequest<UpdateUserResult>(`/auth/admin/users/${userId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deactivateUserByAdmin(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/auth/admin/users/${userId}/deactivate`, {
    method: 'POST',
  });
}

export function reactivateUserByAdmin(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/auth/admin/users/${userId}/reactivate`, {
    method: 'POST',
  });
}

export function fetchPendingAssignments(userId: string): Promise<{ pending_count: number }> {
  return apiRequest<{ pending_count: number }>(`/auth/admin/users/${userId}/pending-assignments`);
}

export interface ProfileDetailsData {
  last_name?: string | null;
  nickname?: string | null;
  description?: string | null;
  experience?: string | null;
  skills?: string[];
  github?: string | null;
  linkedin?: string | null;
  availability_text?: string | null;
}

export interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
  avatar_url: string | null;
  details?: ProfileDetailsData;
}

export interface ProfileResponse {
  message?: string | null;
  profile: ProfileData;
}

export function fetchProfile(): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/auth/profile');
}

export function updateProfile(payload: {
  name: string;
  avatar?: File | null;
  details?: ProfileDetailsData;
}): Promise<ProfileResponse> {
  const formData = new FormData();
  formData.set('name', payload.name);
  if (payload.details) {
    formData.set('details', JSON.stringify(payload.details));
  }
  if (payload.avatar) formData.set('avatar', payload.avatar);
  return apiFormRequest<ProfileResponse>('/auth/profile', { method: 'PATCH', formData });
}

export function changePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/auth/profile/change-password', {
    method: 'POST',
    body: payload,
  });
}
