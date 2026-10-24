import { describe, expect, it } from 'vitest';
import { classifyCalendar, worstIcalStatus, type CalendarHealth } from '../icalHealth';

const now = new Date('2026-11-01T12:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

function cal(over: Partial<CalendarHealth> = {}): CalendarHealth {
  return { propertyId: 'p', lastSyncedAt: minutesAgo(10), syncError: null, syncIntervalMinutes: 60, isActive: true, ...over };
}

describe('classifyCalendar', () => {
  it('should be ok for a freshly synced calendar', () => {
    expect(classifyCalendar(cal(), now)).toBe('ok');
  });

  it('should be none when inactive', () => {
    expect(classifyCalendar(cal({ isActive: false, syncError: 'boom' }), now)).toBe('none');
  });

  it('should be error when syncError is set', () => {
    expect(classifyCalendar(cal({ syncError: 'HTTP 500' }), now)).toBe('error');
  });

  it('should let error beat stale', () => {
    expect(classifyCalendar(cal({ syncError: 'x', lastSyncedAt: minutesAgo(99999) }), now)).toBe('error');
  });

  it('should be stale when never synced', () => {
    expect(classifyCalendar(cal({ lastSyncedAt: null }), now)).toBe('stale');
  });

  it('should be ok exactly at 3x the interval', () => {
    expect(classifyCalendar(cal({ syncIntervalMinutes: 180, lastSyncedAt: minutesAgo(540) }), now)).toBe('ok');
  });

  it('should be stale one minute past 3x the interval', () => {
    expect(classifyCalendar(cal({ syncIntervalMinutes: 180, lastSyncedAt: minutesAgo(541) }), now)).toBe('stale');
  });

  it('should apply a 360-minute floor for short intervals (boundary ok)', () => {
    expect(classifyCalendar(cal({ syncIntervalMinutes: 30, lastSyncedAt: minutesAgo(360) }), now)).toBe('ok');
  });

  it('should apply a 360-minute floor for short intervals (+1 min stale)', () => {
    expect(classifyCalendar(cal({ syncIntervalMinutes: 30, lastSyncedAt: minutesAgo(361) }), now)).toBe('stale');
  });
});

describe('worstIcalStatus', () => {
  it('should be none for an empty list', () => {
    expect(worstIcalStatus([], now)).toBe('none');
  });

  it('should rank error above stale and ok', () => {
    const list = [cal(), cal({ lastSyncedAt: null }), cal({ syncError: 'x' })];
    expect(worstIcalStatus(list, now)).toBe('error');
  });

  it('should rank stale above ok', () => {
    expect(worstIcalStatus([cal(), cal({ lastSyncedAt: null })], now)).toBe('stale');
  });

  it('should rank ok above none', () => {
    expect(worstIcalStatus([cal({ isActive: false }), cal()], now)).toBe('ok');
  });

  it('should be none when every calendar is inactive', () => {
    expect(worstIcalStatus([cal({ isActive: false })], now)).toBe('none');
  });
});
