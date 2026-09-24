import { describe, it, expect } from 'vitest';
import { computeSlots, formatPhuketTime, phuketWeekday } from '../slots';

const date = '2030-01-07'; // Monday
const hours = [{ weekday: 1, start_time: '09:00', end_time: '12:00' }];
const now = new Date('2029-12-01T00:00:00Z');

describe('computeSlots', () => {
  it('uses provider weekday', () => {
    expect(phuketWeekday(date)).toBe(1);
  });
  it('generates slots in Phuket time', () => {
    const s = computeSlots({ date, hours, busy: [], durationMinutes: 60, now });
    expect(s.map(formatPhuketTime)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });
  it('removes overlapping busy ranges', () => {
    const busy = [{ starts_at: '2030-01-07T03:00:00Z', ends_at: '2030-01-07T04:00:00Z' }]; // 10:00-11:00 local
    const s = computeSlots({ date, hours, busy, durationMinutes: 60, now });
    expect(s.map(formatPhuketTime)).toEqual(['09:00', '11:00']);
  });
  it('returns nothing without hours or on closed days', () => {
    expect(computeSlots({ date, hours: [], busy: [], durationMinutes: 60, now })).toEqual([]);
    expect(computeSlots({ date: '2030-01-08', hours, busy: [], durationMinutes: 60, now })).toEqual([]);
  });
  it('skips past slots', () => {
    const s = computeSlots({ date, hours, busy: [], durationMinutes: 60, now: new Date('2030-01-07T03:10:00Z') });
    expect(s.map(formatPhuketTime)).toEqual(['10:30', '11:00']);
  });
});
