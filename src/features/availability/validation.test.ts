import { describe, expect, it } from 'vitest';
import {
  getMondayOfWeek,
  addWeeks,
  formatWeekRange,
  getDateForWeekday,
  slotsToHourlyGrid,
  hourlyGridToSlots,
  areWeeklySlotsEqual,
  validateMeetingCriteria,
  minutesToTime,
  isValidUrl,
  buildGoogleCalendarUrl,
} from './utils';
import { AVAILABILITY_MESSAGES } from './messages';
import type { TimeSlot, WeeklySlots } from './types';

describe('Availability date & slot utilities', () => {
  it('calculates the Monday of the week correctly', () => {
    // 2026-10-14 is Wednesday -> Monday is 2026-10-12
    const wednesday = new Date(Date.UTC(2026, 9, 14, 12, 0, 0));
    expect(getMondayOfWeek(wednesday)).toBe('2026-10-12');

    // 2026-10-18 is Sunday -> Monday is 2026-10-12
    const sunday = new Date(Date.UTC(2026, 9, 18, 12, 0, 0));
    expect(getMondayOfWeek(sunday)).toBe('2026-10-12');
  });

  it('adds and subtracts weeks correctly', () => {
    expect(addWeeks('2026-10-12', 1)).toBe('2026-10-19');
    expect(addWeeks('2026-10-12', -1)).toBe('2026-10-05');
  });

  it('formats week date range', () => {
    const range = formatWeekRange('2026-10-12');
    expect(range).toContain('12');
    expect(range).toContain('18');
  });

  it('returns exact dates for weekdays starting on Monday', () => {
    expect(getDateForWeekday('2026-10-12', 'monday')).toBe('2026-10-12');
    expect(getDateForWeekday('2026-10-12', 'friday')).toBe('2026-10-16');
    expect(getDateForWeekday('2026-10-12', 'sunday')).toBe('2026-10-18');
  });

  it('converts slots to 24h grid and back with contiguous block merging', () => {
    const slots: TimeSlot[] = [
      { start: '09:00', end: '11:00' },
      { start: '11:00', end: '13:00' },
      { start: '15:00', end: '16:00' },
    ];
    const grid = slotsToHourlyGrid(slots);
    expect(grid[9]).toBe(true);
    expect(grid[10]).toBe(true);
    expect(grid[11]).toBe(true);
    expect(grid[12]).toBe(true);
    expect(grid[13]).toBe(false);
    expect(grid[15]).toBe(true);
    expect(grid[16]).toBe(false);

    // Merges 9..13 into a single 09:00 - 13:00 block
    const merged = hourlyGridToSlots(grid);
    expect(merged).toEqual([
      { start: '09:00', end: '13:00' },
      { start: '15:00', end: '16:00' },
    ]);
  });

  it('correctly compares weekly slots equality', () => {
    const a: WeeklySlots = {
      monday: [{ start: '09:00', end: '12:00' }],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };
    // Equivalent adjacent blocks that represent the exact same hours
    const b: WeeklySlots = {
      monday: [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '12:00' },
      ],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };
    expect(areWeeklySlotsEqual(a, b)).toBe(true);

    const c: WeeklySlots = {
      ...a,
      monday: [{ start: '09:00', end: '13:00' }],
    };
    expect(areWeeklySlotsEqual(a, c)).toBe(false);
  });
});

describe('HU_DN_03_35 - Meeting Criteria Validation', () => {
  it('rejects invalid time intervals where start >= end', () => {
    const res = validateMeetingCriteria('18:00', '09:00', ['monday'], ['u1'], '1');
    expect(res.isValid).toBe(false);
    expect(res.intervalError).toBe(AVAILABILITY_MESSAGES.invalidTimeInterval);

    const resSame = validateMeetingCriteria('10:00', '10:00', ['monday'], ['u1'], '1');
    expect(resSame.isValid).toBe(false);
    expect(resSame.intervalError).toBe(AVAILABILITY_MESSAGES.invalidTimeInterval);
  });

  it('rejects empty days selection', () => {
    const res = validateMeetingCriteria('08:00', '18:00', [], ['u1'], '1');
    expect(res.isValid).toBe(false);
    expect(res.daysError).toBe(AVAILABILITY_MESSAGES.selectAtLeastOneDay);
  });

  it('rejects empty participants selection', () => {
    const res = validateMeetingCriteria('08:00', '18:00', ['monday'], [], '1');
    expect(res.isValid).toBe(false);
    expect(res.participantsError).toBe(AVAILABILITY_MESSAGES.selectAtLeastOneParticipant);
  });

  it('rejects non-integer duration', () => {
    const res = validateMeetingCriteria('08:00', '18:00', ['monday'], ['u1'], '1.5');
    expect(res.isValid).toBe(false);
    expect(res.durationError).toBe(AVAILABILITY_MESSAGES.durationMustBeWholeHours);

    const resZero = validateMeetingCriteria('08:00', '18:00', ['monday'], ['u1'], '0');
    expect(resZero.isValid).toBe(false);
    expect(resZero.durationError).toBe(AVAILABILITY_MESSAGES.durationMustBeWholeHours);
  });

  it('rejects duration that exceeds selected interval', () => {
    // Interval is 2 hours (10:00 to 12:00) but duration requested is 3 hours
    const res = validateMeetingCriteria('10:00', '12:00', ['monday'], ['u1'], '3');
    expect(res.isValid).toBe(false);
    expect(res.durationError).toBe(AVAILABILITY_MESSAGES.durationDoesNotFit);
  });

  it('accepts valid criteria matching all rules', () => {
    const res = validateMeetingCriteria('09:00', '17:00', ['monday', 'friday'], ['u1', 'u2'], '2');
    expect(res.isValid).toBe(true);
    expect(res.intervalError).toBeUndefined();
    expect(res.daysError).toBeUndefined();
    expect(res.participantsError).toBeUndefined();
    expect(res.durationError).toBeUndefined();
  });

  it('converts minutes to formatted time string', () => {
    expect(minutesToTime(540)).toBe('09:00');
    expect(minutesToTime(870)).toBe('14:30');
  });

  it('merges slots up to midnight 24:00', () => {
    const grid = Array<boolean>(24).fill(false);
    grid[22] = true;
    grid[23] = true;
    const slots = hourlyGridToSlots(grid);
    expect(slots).toEqual([{ start: '22:00', end: '24:00' }]);
  });

  it('validates URLs correctly', () => {
    expect(isValidUrl('https://meet.google.com/abc')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('builds Google Calendar URL correctly with all parameters', () => {
    const url = buildGoogleCalendarUrl(
      'Planning',
      '2026-10-20',
      '10:00',
      60,
      'Proyecto Alpha',
      'https://meet.google.com/abc',
      'Notas',
    );
    expect(url).toContain('calendar.google.com');
    expect(url).toContain('Planning');
    expect(url).toContain('20261020T100000/20261020T110000');
  });
});
