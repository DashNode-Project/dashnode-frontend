import { describe, expect, it } from 'vitest';
import { isSlotDatetimeInPast, projectLocalYmd } from './projectLocalTime';

describe('projectLocalTime', () => {
  it('treats tomorrow morning as future when local date is still today in Bogota', () => {
    // UTC 2026-11-18 02:00 = 2026-11-17 21:00 America/Bogota
    const now = new Date('2026-11-18T02:00:00.000Z');
    expect(projectLocalYmd(now)).toBe('2026-11-17');
    expect(isSlotDatetimeInPast('2026-11-18', '08:00', now)).toBe(false);
  });
});