const PROJECT_TZ = 'America/Bogota';

/** YYYY-MM-DD in project timezone (matches backend America/Bogota). */
export function projectLocalYmd(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PROJECT_TZ }).format(now);
}

/** HH:mm (24h) in project timezone. */
export function projectLocalHm(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PROJECT_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}`;
}

export function isSlotDatetimeInPast(
  date: string,
  startTime: string,
  now = new Date(),
): boolean {
  const today = projectLocalYmd(now);
  const time = projectLocalHm(now);
  if (date < today) return true;
  if (date === today) return startTime < time;
  return false;
}