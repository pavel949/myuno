import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** Today's date (YYYY-MM-DD) in the Asia/Bangkok calendar. */
export function bangkokTodayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
}

/** Date picker carrier, not an instant: preserve the civil date in local fields. */
export function parseCivilDate(value: string): Date {
  return parseISO(value);
}

export function civilDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function bangkokTodayDate(now: Date = new Date()): Date {
  return parseCivilDate(bangkokTodayISO(now));
}

export interface CivilStay { check_in: string; check_out: string }

export function stayOccupiesDate(stay: CivilStay, day: string): boolean {
  return stay.check_in <= day && day < stay.check_out;
}

export function stayHasDayEvent(stay: CivilStay, day: string): boolean {
  return stayOccupiesDate(stay, day) || stay.check_out === day;
}

export function civilStaysOverlap(a: CivilStay, b: CivilStay): boolean {
  return a.check_in < b.check_out && a.check_out > b.check_in;
}

/** Clip a half-open stay to a date-cell window; no milliseconds or DST rounding. */
export function civilStaySpan(stay: CivilStay, start: Date, count: number) {
  const checkIn = parseCivilDate(stay.check_in);
  const checkOut = parseCivilDate(stay.check_out);
  const from = differenceInCalendarDays(checkIn, start);
  const to = differenceInCalendarDays(checkOut, start);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  const startOffset = Math.max(0, from);
  const endOffset = Math.min(count, to);
  if (endOffset <= startOffset) return null;
  return { startOffset, endOffset, isStart: from >= 0, isEnd: to <= count };
}

export function occupiedCivilDates(stay: CivilStay): string[] {
  const dates: string[] = [];
  let day = parseCivilDate(stay.check_in);
  const end = parseCivilDate(stay.check_out);
  while (day < end) {
    dates.push(civilDateKey(day));
    day = addDays(day, 1);
  }
  return dates;
}
