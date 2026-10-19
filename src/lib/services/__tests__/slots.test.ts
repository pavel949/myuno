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
  it('deduplicates overlapping configured windows', () => {
    const s = computeSlots({ date, hours: [...hours, ...hours], busy: [], durationMinutes: 60, now });
    expect(s.map(formatPhuketTime)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });
  it.each([0, -1, Number.NaN, Infinity])('rejects invalid slot step %s without looping', stepMinutes => {
    expect(computeSlots({ date, hours, busy: [], durationMinutes: 60, now, stepMinutes })).toEqual([]);
  });
  it.each([0, -1, Number.NaN, Infinity, 1500])('rejects invalid duration %s', durationMinutes => {
    expect(computeSlots({ date, hours, busy: [], durationMinutes, now })).toEqual([]);
  });
  it.each(['2030-02-31', 'bad-date', '2030-13-01'])('rejects invalid civil date %s', date => {
    expect(computeSlots({ date, hours, busy: [], durationMinutes: 60, now })).toEqual([]);
  });
  it('does not turn malformed busy data into free time', () => {
    expect(computeSlots({ date, hours, busy: [{ starts_at: 'unknown', ends_at: '2030-01-07T03:00:00Z' }], durationMinutes: 60, now })).toEqual([]);
  });
  it('ignores malformed working windows without offering phantom slots', () => {
    expect(computeSlots({ date, hours: [{ weekday: 1, start_time: '09:bad', end_time: '18:00' }], busy: [], durationMinutes: 60, now })).toEqual([]);
  });
});
