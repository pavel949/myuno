import { describe, expect, it } from 'vitest';
import { civilDateKey } from '@/lib/hotelDates';
import { readPropertyGuestContext } from './propertyGuestContext';
const read = (query: string, capacity = 4) => readPropertyGuestContext(query, capacity, '2026-10-18');
describe('property detail initial guest preferences', () => {
  it('hydrates civil dates and bounded party size', () => {
    const context = read('checkIn=2026-12-01&checkOut=2026-12-04&guests=3');
    expect(civilDateKey(context.dateRange!.from!)).toBe('2026-12-01');
    expect(civilDateKey(context.dateRange!.to!)).toBe('2026-12-04');
    expect(context.guests).toBe(3);
  });
  it('accepts the search serializer local-midnight ISO contract', () => {
    const start = new Date(2026, 11, 1), end = new Date(2026, 11, 4);
    const context = read(new URLSearchParams({checkIn:start.toISOString(),checkOut:end.toISOString()}).toString());
    expect(civilDateKey(context.dateRange!.from!)).toBe('2026-12-01');
  });
  it.each(['checkIn=bad&checkOut=2026-12-04','checkIn=2026-12-04&checkOut=2026-12-01','checkIn=2026-12-01&checkOut=2026-12-01','checkIn=2026-12-01','checkIn=2026-02-30&checkOut=2026-12-01','checkIn=2020-01-01&checkOut=2026-12-01'])('ignores invalid/incomplete/past stay %s', query => {
    expect(read(query).dateRange).toBeUndefined();
  });
  it.each(['5','0','-1','1.5','NaN','999',''])('ignores invalid/out-of-capacity party %s', guests => {
    expect(read('guests='+guests).guests).toBe(1);
  });
});
