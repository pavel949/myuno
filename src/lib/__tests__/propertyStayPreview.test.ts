import { describe, expect, it } from 'vitest';
import { parseCivilDate } from '../hotelDates';
import { calculatePropertyStayPreview } from '../propertyStayPreview';
import type { RateSeasonRecord } from '../pricingEngine';

const season = (id: string, start_date: string, end_date: string, nightly_rate: number): RateSeasonRecord =>
  ({ id, start_date, end_date, nightly_rate, property_id: 'unit', name_en: id, is_active: true });

const quote = (from: string, to: string, overrides: Record<string, number> = {}, seasons: RateSeasonRecord[] = []) =>
  calculatePropertyStayPreview({ pricePerNight: 1000 }, parseCivilDate(from), parseCivilDate(to), overrides, seasons);

describe('public unit stay preview', () => {
  it('quotes a single night, prioritizing an override and excluding checkout', () => {
    expect(quote('2027-01-01', '2027-01-02', { '2027-01-01': 1800, '2027-01-02': 9999 },
      [season('a', '2027-01-01', '2027-01-10', 1300)])).toMatchObject({ nights: 1, subtotal: 1800, total: 1800 });
  });
  it('combines date, season, and default rates across a year boundary', () => {
    expect(quote('2026-12-30', '2027-01-03', { '2026-12-30': 2000 },
      [season('a', '2026-12-31', '2027-01-01', 1500)])).toMatchObject({ nights: 4, subtotal: 6000 });
  });
  it('does not repeat a dated season in another year', () => {
    expect(quote('2028-01-01', '2028-01-02', {}, [season('a', '2027-01-01', '2027-01-10', 1500)]).total).toBe(1000);
  });
  it('chooses latest active start deterministically and excludes category prices', () => {
    const seasons = [
      season('older', '2027-01-01', '2027-01-10', 1500),
      season('newer', '2027-01-02', '2027-01-03', 2000),
      { ...season('category', '2027-01-03', '2027-01-03', 4000), category_id: 'room' },
      { ...season('inactive', '2027-01-03', '2027-01-03', 5000), is_active: false },
    ];
    expect(quote('2027-01-03', '2027-01-04', {}, seasons).total).toBe(2000);
    expect(quote('2027-01-03', '2027-01-04', {}, [...seasons].reverse()).total).toBe(2000);
  });
});
