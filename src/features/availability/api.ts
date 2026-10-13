import { apiRequest } from '@/lib/api/client';
import type {
  CreateMeetingPayload,
  MeetingDTO,
  ProjectManagedDTO,
  RespondMeetingPayload,
  SaveAvailabilityPayload,
  SearchMeetingSlotsPayload,
  SearchMeetingSlotsResponse,
  TeamAvailabilityResponse,
  UpdateMeetingSummaryPayload,
  UserAvailabilityResponse,
} from './types';

export async function getMyAvailability(weekStartDate: string): Promise<UserAvailabilityResponse> {
  return apiRequest<UserAvailabilityResponse>(
    `/availability/mine?week=${encodeURIComponent(weekStartDate)}`,
  );
}

export async function saveMyAvailability(
  payload: SaveAvailabilityPayload,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/availability/mine', {
    method: 'POST',
    body: payload,
  });
}

export async function getTeamAvailability(
  weekStartDate: string,
): Promise<TeamAvailabilityResponse> {
  return apiRequest<TeamAvailabilityResponse>(
    `/availability/team?week=${encodeURIComponent(weekStartDate)}`,
  );
}

export async function searchMeetingSlots(
  payload: SearchMeetingSlotsPayload,
): Promise<SearchMeetingSlotsResponse> {
  return apiRequest<SearchMeetingSlotsResponse>('/availability/search-slots', {
    method: 'POST',
    body: payload,
  });
}

export async function createMeeting(payload: CreateMeetingPayload): Promise<MeetingDTO> {
  return apiRequest<MeetingDTO>('/availability/meetings', {
    method: 'POST',
    body: payload,
  });
}

export async function listMeetings(
  dateFrom?: string,
  dateTo?: string,
  filterType?: string,
): Promise<MeetingDTO[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  if (filterType) params.set('filter_type', filterType);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<MeetingDTO[]>(`/availability/meetings${query}`);
}

export async function getMeetingDetail(meetingId: string): Promise<MeetingDTO> {
  return apiRequest<MeetingDTO>(`/availability/meetings/${encodeURIComponent(meetingId)}`);
}

export async function cancelMeeting(meetingId: string): Promise<MeetingDTO> {
  return apiRequest<MeetingDTO>(`/availability/meetings/${encodeURIComponent(meetingId)}/cancel`, {
    method: 'POST',
  });
}

export async function respondMeeting(
  meetingId: string,
  response: 'aceptada' | 'rechazada',
): Promise<MeetingDTO> {
  const payload: RespondMeetingPayload = { response };
  return apiRequest<MeetingDTO>(`/availability/meetings/${encodeURIComponent(meetingId)}/respond`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateMeetingSummary(
  meetingId: string,
  payload: UpdateMeetingSummaryPayload,
): Promise<MeetingDTO> {
  return apiRequest<MeetingDTO>(`/availability/meetings/${encodeURIComponent(meetingId)}/summary`, {
    method: 'POST',
    body: payload,
  });
}

export async function getManagedProjects(): Promise<ProjectManagedDTO[]> {
  return apiRequest<ProjectManagedDTO[]>('/availability/projects');
}
