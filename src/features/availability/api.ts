import { apiRequest } from '@/lib/api/client';
import type {
  CreateMeetingPayload,
  MeetingDTO,
  SaveAvailabilityPayload,
  SearchMeetingSlotsPayload,
  SearchMeetingSlotsResponse,
  TeamAvailabilityResponse,
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

export async function listMeetings(dateFrom?: string, dateTo?: string): Promise<MeetingDTO[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<MeetingDTO[]>(`/availability/meetings${query}`);
}
