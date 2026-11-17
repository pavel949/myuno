import { toBangkokDateKey } from '@/lib/hotelDates';

/** Existing 24-hour ICT admission rule, evaluated again at submission time. */
export function flightCutoffViolated(date: string, time: string, now = Date.now()): boolean {
  if (!date || !time) return false; // Required-field validation owns empty inputs.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toBangkokDateKey(date) !== date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return true;
  const instant = new Date(`${date}T${time}:00+07:00`).getTime();
  return !Number.isFinite(instant) || !Number.isFinite(now) || instant < now + 24 * 60 * 60 * 1000;
}
