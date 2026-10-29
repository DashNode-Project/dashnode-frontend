export type DayKey =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  start: string;
  end: string;
}

export type WeeklySlots = Record<DayKey, TimeSlot[]>;

export interface UserAvailabilityResponse {
  id: string | null;
  user_id: string;
  week_start_date: string;
  is_inherited: boolean;
  slots: WeeklySlots;
}

export interface SaveAvailabilityPayload {
  week_start_date: string;
  slots: WeeklySlots;
}

export interface TeamUserAvailability {
  user_id: string;
  name: string;
  email: string;
  role: string;
  slots: WeeklySlots;
}

export interface TeamAvailabilityResponse {
  week_start_date: string;
  users: TeamUserAvailability[];
}

export interface SearchMeetingSlotsPayload {
  interval_start: string;
  interval_end: string;
  days: DayKey[];
  participant_ids: string[];
  duration_hours: number;
  week_start_date?: string;
}

export interface DayAvailableSlots {
  day: DayKey;
  date: string;
  slots: TimeSlot[];
}

export interface SearchMeetingSlotsResponse {
  results: DayAvailableSlots[];
}

export interface ParticipantDTO {
  user_id: string;
  name: string | null;
  email: string | null;
  response: 'pendiente' | 'aceptada' | 'rechazada' | string;
}

export interface CreateMeetingPayload {
  project_id?: string | null;
  title: string;
  type: string;
  description?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  link?: string | null;
  participant_ids: string[];
}

export interface MeetingDTO {
  id: string;
  project_id: string | null;
  project_name?: string | null;
  title: string;
  type: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  link: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | string;
  creator_id: string;
  creator_name?: string | null;
  participant_ids: string[];
  participants?: ParticipantDTO[];
  summary?: string | null;
  minutes_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectManagedDTO {
  id: string;
  name: string;
  manager_id?: string | null;
  meeting_link: string | null;
  member_ids: string[];
}

export interface RespondMeetingPayload {
  response: 'aceptada' | 'rechazada';
}

export interface UpdateMeetingSummaryPayload {
  summary: string | null;
  minutes_url: string | null;
}
