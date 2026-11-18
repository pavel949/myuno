import { describe, expect, it } from 'vitest';
import { isMapOpenNow } from './openNow';
const at = (time: string) => new Date(time);
const mondayNoon = at('2026-11-16T05:00:00Z'); // Monday 12:00 Asia/Bangkok

describe('strict Phuket map open-now', () => {
  it.each([undefined, null, {}, { monday: '' }, { monday: 'unknown' }, { monday: 'by appointment' }, { monday: 'open' }, { monday: 'closed' }, { monday: '9:99-17:00' }, { monday: '25:00-26:00' }, { monday: '0 PM-8 PM' }, { monday: '09:00-09:00' }, { monday: '00:00-00:00' }, { monday: '09:00-17:00 maybe' }, { monday: ['09:00-17:00'] }, { monday: '09:00-17:00', Monday: 'closed' }])('fails closed for missing or malformed schedule %j', schedule => {
    expect(isMapOpenNow(schedule, mondayNoon)).toBe(false);
  });
  it('supports 24-hour and AM/PM ranges with exclusive closing boundary', () => {
    expect(isMapOpenNow({ Monday: '09:00–17:00' }, mondayNoon)).toBe(true);
    expect(isMapOpenNow({ monday: '9 AM - 5 PM' }, mondayNoon)).toBe(true);
    expect(isMapOpenNow({ monday: '12:00 PM - 5:00 PM' }, mondayNoon)).toBe(true);
    expect(isMapOpenNow({ monday: '9 AM - 12 PM' }, mondayNoon)).toBe(false);
    expect(isMapOpenNow({ monday: '12 AM - 8 AM' }, mondayNoon)).toBe(false);
    expect(isMapOpenNow({ monday: '13:00-17:00' }, mondayNoon)).toBe(false);
  });
  it.each(['24h', '24 hours', 'Open 24 hours', '24/7', 'круглосуточно', '00:00-24:00'])('recognizes explicit full-day hours %s', hours => {
    expect(isMapOpenNow({ monday: hours }, mondayNoon)).toBe(true);
  });
  it('handles previous-day overnight spill, including Sunday to Monday', () => {
    const hours = { sunday: '10 PM - 2 AM', monday: 'closed' };
    expect(isMapOpenNow(hours, at('2026-11-15T18:00:00Z'))).toBe(true); // Monday 01:00
    expect(isMapOpenNow(hours, at('2026-11-15T19:00:00Z'))).toBe(false); // Monday 02:00
    expect(isMapOpenNow({ monday: '22:00-02:00' }, at('2026-11-16T16:00:00Z'))).toBe(true);
    expect(isMapOpenNow({ monday: '22:00-02:00' }, at('2026-11-16T18:00:00Z'))).toBe(true); // Tuesday 01:00
    expect(isMapOpenNow({ monday: '22:00-02:00' }, mondayNoon)).toBe(false);
  });
  it('supports split shifts without accepting a partially malformed schedule', () => {
    expect(isMapOpenNow({ monday: '09:00-11:00; 12:00-17:00' }, mondayNoon)).toBe(true);
    expect(isMapOpenNow({ monday: '09:00-11:00, 13:00-17:00' }, mondayNoon)).toBe(false);
    expect(isMapOpenNow({ monday: '09:00-17:00, unknown' }, mondayNoon)).toBe(false);
  });
  it('rejects invalid dates', () => {
    expect(isMapOpenNow({ monday: '24h' }, new Date(NaN))).toBe(false);
  });
});
