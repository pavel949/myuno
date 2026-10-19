import { describe, expect, it } from 'vitest';
import { addDays } from 'date-fns';
import { bangkokTodayDate, bangkokTodayISO, toBangkokDateKey, civilDateKey, civilStaysOverlap, civilStaySpan, occupiedCivilDates, parseCivilDate, stayHasDayEvent, stayOccupiesDate } from '@/lib/hotelDates';

const cases = [
  ['2026-10-10', '2026-10-13', ['2026-10-10', '2026-10-11', '2026-10-12']],
  ['2026-10-10', '2026-10-11', ['2026-10-10']],
  ['2026-01-31', '2026-02-01', ['2026-01-31']],
  ['2026-12-31', '2027-01-01', ['2026-12-31']],
  ['2028-02-28', '2028-03-01', ['2028-02-28', '2028-02-29']],
  ['2026-03-07', '2026-03-10', ['2026-03-07', '2026-03-08', '2026-03-09']],
] as const;

describe('half-open civil stay dates (run under each TZ)', () => {
  it.each(cases)('%s → %s occupies only the expected nights', (check_in, check_out, expected) => {
    const stay = { check_in, check_out };
    expect(occupiedCivilDates(stay)).toEqual(expected);
    expect(stayOccupiesDate(stay, check_in)).toBe(true);
    expect(stayOccupiesDate(stay, check_out)).toBe(false);
  });
  it.each(cases)('weekly and portfolio spans agree for %s → %s', (check_in, check_out, expected) => {
    const stay = { check_in, check_out };
    const start = addDays(parseCivilDate(check_in), -2);
    const nights = (count: number) => {
      const span = civilStaySpan(stay, start, count);
      if (!span) throw new Error('Expected occupied span');
      return Array.from({ length: span.endOffset - span.startOffset }, (_, i) => civilDateKey(addDays(start, span.startOffset + i)));
    };
    expect(nights(7)).toEqual(expected);
    expect(nights(30)).toEqual(expected);
  });
  it('back-to-back 10→13 and 13→15 never overlap or occupy the same night', () => {
    const a = { check_in: '2026-10-10', check_out: '2026-10-13' };
    const b = { check_in: '2026-10-13', check_out: '2026-10-15' };
    expect(civilStaysOverlap(a, b)).toBe(false);
    expect(civilStaysOverlap(b, a)).toBe(false);
    expect(stayOccupiesDate(a, '2026-10-13')).toBe(false);
    expect(stayOccupiesDate(b, '2026-10-13')).toBe(true);
    expect(civilStaysOverlap(a, { ...b, check_in: '2026-10-12' })).toBe(true);
  });
  it('departure is a day event, never an occupied night', () => {
    const stay = { check_in: '2026-10-10', check_out: '2026-10-13' };
    expect(stayHasDayEvent(stay, '2026-10-13')).toBe(true);
    expect(stayOccupiesDate(stay, '2026-10-13')).toBe(false);
    expect(stayHasDayEvent(stay, '2026-10-14')).toBe(false);
  });
  it('local date carrier preserves leap-day task/availability keys', () => {
    expect(civilDateKey(parseCivilDate('2028-02-29'))).toBe('2028-02-29');
    expect(civilDateKey(addDays(parseCivilDate('2028-02-29'), 1))).toBe('2028-03-01');
  });
  it('business today changes at Bangkok midnight, not UTC or browser midnight', () => {
    const before = new Date('2026-10-16T16:59:59Z');
    const after = new Date('2026-10-16T17:00:00Z');
    expect(bangkokTodayISO(before)).toBe('2026-10-16');
    expect(bangkokTodayISO(after)).toBe('2026-10-17');
    expect(civilDateKey(bangkokTodayDate(after))).toBe('2026-10-17');
  });
});

describe('toBangkokDateKey', () => {
  it('preserves stored civil task dates and converts timestamp instants', () => {
    expect(toBangkokDateKey('2026-10-17')).toBe('2026-10-17');
    expect(toBangkokDateKey('2026-10-16T17:00:00Z')).toBe('2026-10-17');
    expect(toBangkokDateKey('2026-10-17T16:59:59Z')).toBe('2026-10-17');
    expect(toBangkokDateKey('2026-10-17T17:00:00Z')).toBe('2026-10-18');
  });
  it('keeps missing or invalid dates unknown', () => {
    expect(toBangkokDateKey(null)).toBeNull();
    expect(toBangkokDateKey('not-a-date')).toBeNull();
    expect(toBangkokDateKey('2026-02-30')).toBeNull();
  });
});
