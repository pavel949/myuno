/**
 * Pure slot computation for service bookings.
 * Hours are provider weekly windows (local Phuket time, UTC+7); busy ranges
 * come from `get_provider_busy_slots`. No hours configured → no slots.
 */
export interface WeeklyHours {
  weekday: number; // 0 = Sunday
  start_time: string; // "HH:MM[:SS]"
  end_time: string;
}
export interface BusyRange {
  starts_at: string;
  ends_at: string;
}

const PHUKET_OFFSET_MIN = 7 * 60;

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Build a UTC Date for a Phuket-local date (YYYY-MM-DD) + minutes from midnight. */
export function phuketDateTime(isoDate: string, minutes: number): Date {
  const [y, mo, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 0, minutes - PHUKET_OFFSET_MIN));
}

export function phuketWeekday(isoDate: string): number {
  const [y, mo, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

export function computeSlots(opts: {
  date: string;
  hours: WeeklyHours[];
  busy: BusyRange[];
  durationMinutes: number;
  stepMinutes?: number;
  now?: Date;
  leadTimeHours?: number;
}): Date[] {
  const { date, hours, busy, durationMinutes } = opts;
  const step = opts.stepMinutes ?? 30;
  const now = opts.now ?? new Date();
  const earliest = now.getTime() + (opts.leadTimeHours ?? 0) * 3600_000;
  const wd = phuketWeekday(date);
  const dur = Math.max(15, durationMinutes || 60);
  const busyMs = busy.map((b) => [new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()]);
  const out: Date[] = [];
  for (const h of hours.filter((x) => x.weekday === wd)) {
    const end = toMinutes(h.end_time);
    for (let m = toMinutes(h.start_time); m + dur <= end; m += step) {
      const s = phuketDateTime(date, m).getTime();
      const e = s + dur * 60_000;
      if (s < earliest) continue;
      if (busyMs.some(([bs, be]) => s < be && e > bs)) continue;
      out.push(new Date(s));
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

export function formatPhuketTime(d: Date): string {
  const local = new Date(d.getTime() + PHUKET_OFFSET_MIN * 60_000);
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
}

export function phuketToday(now = new Date()): string {
  return new Date(now.getTime() + PHUKET_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, n: number): string {
  const [y, mo, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10);
}
