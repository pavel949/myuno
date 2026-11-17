import { describe, expect, it } from 'vitest';
import { flightCutoffViolated } from './flightCutoff';
const now = Date.parse('2026-11-17T05:00:00Z'); // 12:00 ICT
it('pins the existing 24h boundary to Phuket time', () => {
  expect(flightCutoffViolated('2026-11-18', '12:00', now)).toBe(false);
  expect(flightCutoffViolated('2026-11-18', '11:59', now)).toBe(true);
});
describe('invalid flight date/time', () => {
  it.each([['2099-02-30', '12:00'], ['2099-01-01', '24:00'], ['bad', '12:00'], ['2099-01-01', 'NaN']])('rejects %s %s', (date,time) => {
    expect(flightCutoffViolated(date,time,now)).toBe(true);
  });
  it('uses a fresh clock for a form left open', () => {
    expect(flightCutoffViolated('2026-11-18','12:00',now+60000)).toBe(true);
  });
});
