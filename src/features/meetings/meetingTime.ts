import type { MeetingDTO } from '@/features/availability/types';

export function nowDateAndTime(): { today: string; time: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  return { today, time };
}

/** True when the meeting slot has ended (or was marked completed/cancelled). */
export function isMeetingPast(
  m: Pick<MeetingDTO, 'date' | 'end_time' | 'status'>,
  now = nowDateAndTime(),
) {
  if (m.status === 'completed' || m.status === 'cancelled') return m.status === 'completed';
  if (m.date < now.today) return true;
  if (m.date === now.today) return m.end_time <= now.time;
  return false;
}

export function isMeetingUpcoming(
  m: Pick<MeetingDTO, 'date' | 'start_time' | 'status'>,
  now = nowDateAndTime(),
) {
  if (m.status === 'cancelled' || m.status === 'completed') return false;
  if (m.date > now.today) return true;
  if (m.date === now.today) return m.start_time > now.time;
  return false;
}

export function meetingStatusLabel(m: Pick<MeetingDTO, 'date' | 'end_time' | 'status'>) {
  if (m.status === 'cancelled') return 'cancelled';
  if (m.status === 'completed' || isMeetingPast(m)) return 'completed';
  return 'scheduled';
}
