/** Map-only schedule interpretation: Phuket local time, unknown never means open. */
const bangkokClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Bangkok', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
type Interval = { start: number; end: number };

function clockMinutes(value: string, closing: boolean): number | null {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (minute > 59) return null;
  if (match[3]) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0);
  } else if (hour > 23) {
    return closing && hour === 24 && minute === 0 ? 1440 : null;
  }
  return hour * 60 + minute;
}

function dayIntervals(schedule: Record<string, unknown>, day: string): Interval[] {
  const entries = Object.entries(schedule).filter(([key]) => key.trim().toLowerCase() === day);
  // Conflicting duplicate day keys are not a reliable schedule.
  if (!entries.length || entries.some(([, value]) => value !== entries[0][1]) || typeof entries[0][1] !== 'string') return [];
  const value = entries[0][1].trim().toLowerCase();
  if (['24h', '24 hours', 'open 24 hours', '24/7', 'круглосуточно'].includes(value)) return [{ start: 0, end: 1440 }];
  if (!value || ['closed', 'закрыто', 'выходной'].includes(value)) return [];
  const intervals: Interval[] = [];
  for (const segment of value.split(/[,;]/)) {
    const range = segment.trim().match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (!range) return [];
    const start = clockMinutes(range[1], false), end = clockMinutes(range[2], true);
    if (start === null || end === null || start === end) return [];
    intervals.push({ start, end });
  }
  return intervals;
}

export function isMapOpenNow(schedule: Record<string, unknown> | null | undefined, now = new Date()): boolean {
  if (!schedule || Array.isArray(schedule) || !Number.isFinite(now.getTime())) return false;
  const parts = bangkokClock.formatToParts(now);
  const day = parts.find(part => part.type === 'weekday')?.value.toLowerCase();
  const dayIndex = day ? days.indexOf(day) : -1;
  if (dayIndex < 0) return false;
  const minute = Number(parts.find(part => part.type === 'hour')?.value) * 60 + Number(parts.find(part => part.type === 'minute')?.value);
  const today = dayIntervals(schedule, days[dayIndex]);
  if (today.some(({ start, end }) => end > start ? minute >= start && minute < end : minute >= start)) return true;
  // After midnight belongs to yesterday's explicitly recorded overnight shift.
  return dayIntervals(schedule, days[(dayIndex + 6) % 7])
    .some(({ start, end }) => end < start && minute < end);
}
