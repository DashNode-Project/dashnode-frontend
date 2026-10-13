import type { DayKey, TimeSlot, WeeklySlots } from './types';
import { AVAILABILITY_MESSAGES, DAY_KEYS_LIST } from './messages';

export function getMondayOfWeek(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export function addWeeks(weekStartDate: string, weeksToAdd: number): string {
  const parts = weekStartDate.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + weeksToAdd * 7);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export function formatWeekRange(weekStartDate: string): string {
  const parts = weekStartDate.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(Date.UTC(y, m - 1, d + 6));
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const startStr = start.toLocaleDateString('es-ES', options);
  const endStr = end.toLocaleDateString('es-ES', { ...options, year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

export function getDateForWeekday(weekStartDate: string, dayKey: DayKey): string {
  const dayIndexMap: Record<DayKey, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  const parts = weekStartDate.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const date = new Date(Date.UTC(y, m - 1, d + dayIndexMap[dayKey]));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export function timeToMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  const hours = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (m % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converts a list of time intervals into an array of 24 booleans (one per hour).
 */
export function slotsToHourlyGrid(slots: TimeSlot[] = []): boolean[] {
  const grid = Array<boolean>(24).fill(false);
  for (const slot of slots) {
    const startHour = Math.floor(timeToMinutes(slot.start) / 60);
    const endHour = Math.ceil(timeToMinutes(slot.end) / 60);
    for (let h = Math.max(0, startHour); h < Math.min(24, endHour); h++) {
      grid[h] = true;
    }
  }
  return grid;
}

/**
 * Converts a 24-hour boolean array into merged contiguous TimeSlot blocks.
 */
export function hourlyGridToSlots(grid: boolean[]): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let inBlock = false;
  let blockStart = 0;

  for (let h = 0; h < 24; h++) {
    if (grid[h] && !inBlock) {
      inBlock = true;
      blockStart = h;
    } else if (!grid[h] && inBlock) {
      inBlock = false;
      slots.push({
        start: `${String(blockStart).padStart(2, '0')}:00`,
        end: `${String(h).padStart(2, '0')}:00`,
      });
    }
  }

  if (inBlock) {
    slots.push({
      start: `${String(blockStart).padStart(2, '0')}:00`,
      end: '24:00',
    });
  }

  return slots;
}

export function areWeeklySlotsEqual(a: WeeklySlots, b: WeeklySlots): boolean {
  for (const day of DAY_KEYS_LIST) {
    const aGrid = slotsToHourlyGrid(a[day] ?? []);
    const bGrid = slotsToHourlyGrid(b[day] ?? []);
    for (let h = 0; h < 24; h++) {
      if (aGrid[h] !== bGrid[h]) return false;
    }
  }
  return true;
}

export interface MeetingCriteriaValidation {
  isValid: boolean;
  intervalError?: string;
  daysError?: string;
  participantsError?: string;
  durationError?: string;
}

export function validateMeetingCriteria(
  intervalStart: string,
  intervalEnd: string,
  days: DayKey[],
  participantIds: string[],
  durationHoursStr: string,
): MeetingCriteriaValidation {
  const result: MeetingCriteriaValidation = { isValid: true };

  // 1. Interval
  if (!intervalStart || !intervalEnd || intervalStart >= intervalEnd) {
    result.intervalError = AVAILABILITY_MESSAGES.invalidTimeInterval;
    result.isValid = false;
  }

  // 2. Days
  if (!days || days.length === 0) {
    result.daysError = AVAILABILITY_MESSAGES.selectAtLeastOneDay;
    result.isValid = false;
  }

  // 3. Participants
  if (!participantIds || participantIds.length === 0) {
    result.participantsError = AVAILABILITY_MESSAGES.selectAtLeastOneParticipant;
    result.isValid = false;
  }

  // 4. Duration
  const durNum = Number(durationHoursStr);
  if (!durationHoursStr || isNaN(durNum) || !Number.isInteger(durNum) || durNum < 1) {
    result.durationError = AVAILABILITY_MESSAGES.durationMustBeWholeHours;
    result.isValid = false;
  } else if (intervalStart && intervalEnd && intervalStart < intervalEnd) {
    const intervalHours = (timeToMinutes(intervalEnd) - timeToMinutes(intervalStart)) / 60;
    if (durNum > intervalHours) {
      result.durationError = AVAILABILITY_MESSAGES.durationDoesNotFit;
      result.isValid = false;
    }
  }

  return result;
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildGoogleCalendarUrl(
  title: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  projectName?: string | null,
  link?: string | null,
  description?: string | null,
  participantEmails?: string[],
): string {
  const start = date.replace(/-/g, '') + 'T' + startTime.replace(':', '') + '00';
  const startH = parseInt(startTime.split(':')[0] || '0', 10);
  const startM = parseInt(startTime.split(':')[1] || '0', 10);
  const totalMin = startH * 60 + startM + durationMinutes;
  const endH = Math.floor(totalMin / 60) % 24;
  const endMin = totalMin % 60;
  const end =
    date.replace(/-/g, '') +
    'T' +
    endH.toString().padStart(2, '0') +
    endMin.toString().padStart(2, '0') +
    '00';
  const emailList = participantEmails?.filter(Boolean) ?? [];
  const attendeesText = emailList.length > 0 ? `\nParticipantes: ${emailList.join(', ')}` : '';
  const details = encodeURIComponent(
    `Proyecto: ${projectName ?? ''}\nEnlace: ${link ?? ''}\n${description ?? ''}${attendeesText}`,
  );
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title,
  )}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent(link ?? '')}`;
  if (emailList.length > 0) {
    url += `&add=${encodeURIComponent(emailList.join(','))}`;
  }
  return url;
}

export function formatMeetingCopyData(meeting: {
  title: string;
  date: string;
  start_time: string;
  end_time?: string;
  duration: number;
  link?: string | null;
  project_name?: string | null;
  participants?: { email?: string | null; name?: string | null }[];
}): string {
  const emails =
    meeting.participants
      ?.map((p) => p.email || p.name)
      .filter(Boolean)
      .join(', ') || '';
  return [
    `Título: ${meeting.title}`,
    `Proyecto: ${meeting.project_name || 'No especificado'}`,
    `Fecha: ${meeting.date}`,
    `Horario: ${meeting.start_time}${meeting.end_time ? ` – ${meeting.end_time}` : ''}`,
    `Duración: ${meeting.duration} minutos`,
    meeting.link ? `Enlace: ${meeting.link}` : '',
    emails ? `Participantes: ${emails}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
