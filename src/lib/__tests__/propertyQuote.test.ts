import { describe, it, expect } from 'vitest';
import { quotePropertyStay, bangkokToday, splitDepositMinorUnits, type PropertyPricingRow } from '../../../supabase/functions/_shared/property-quote';

const prop = (o: Partial<PropertyPricingRow> = {}): PropertyPricingRow => ({
  price_per_night: 3000, price: null, price_period: 'night', cleaning_fee: 500, extra_cleaning_price: null,
  currency: 'THB', is_active: true, status: 'verified', max_guests: 4, min_stay_nights: 2,
  weekly_discount: 10, monthly_discount: 20, early_booking_discount: null, last_minute_discount: null,
  custom_length_discounts: null, ...o,
});
const base = { check_in: '2026-11-10', check_out: '2026-11-13', guests: 2, nights: 3, total_amount: 9500, cleaning_fee: 500, today: '2026-10-06' };

describe('quotePropertyStay', () => {
  it('accepts the exact price and computes the 10% deposit on the server', () => {
    const q = quotePropertyStay(prop(), base);
    expect(q).toEqual({ ok: true, nights: 3, total: 9500, deposit: 950, remaining: 8550, cleaningFee: 500, currency: 'THB' });
  });
  it('rejects client nights that do not match the dates', () => {
    expect(quotePropertyStay(prop(), { ...base, nights: 1 })).toMatchObject({ ok: false, code: 'nights_mismatch' });
  });
  it('rejects an undervalued total (no configured discount for 3 nights)', () => {
    expect(quotePropertyStay(prop(), { ...base, total_amount: 4000 })).toMatchObject({ ok: false, code: 'total' });
  });
  it('rejects an inflated total', () => {
    expect(quotePropertyStay(prop(), { ...base, total_amount: 20000 })).toMatchObject({ ok: false, code: 'total' });
  });
  it('allows the weekly discount only for 7+ nights', () => {
    const week = { ...base, check_out: '2026-11-17', nights: 7, total_amount: 3000 * 7 * 0.9 + 500 };
    expect(quotePropertyStay(prop(), week)).toMatchObject({ ok: true, total: 19400 });
  });
  it('rejects inactive properties, foreign currency, past dates, min stay, too many guests', () => {
    expect(quotePropertyStay(prop({ is_active: false }), base)).toMatchObject({ code: 'inactive' });
    expect(quotePropertyStay(prop({ currency: 'USD' }), base)).toMatchObject({ code: 'currency' });
    expect(quotePropertyStay(prop(), { ...base, today: '2026-11-11' })).toMatchObject({ code: 'past' });
    expect(quotePropertyStay(prop({ min_stay_nights: 5 }), base)).toMatchObject({ code: 'min_stay' });
    expect(quotePropertyStay(prop(), { ...base, guests: 9 })).toMatchObject({ code: 'guests' });
  });
  it('requires the stored cleaning fee', () => {
    expect(quotePropertyStay(prop(), { ...base, cleaning_fee: 0, total_amount: 9000 })).toMatchObject({ code: 'cleaning_fee' });
  });
  it('rejects invalid calendar dates', () => {
    expect(quotePropertyStay(prop(), { ...base, check_in: '2026-02-31' })).toMatchObject({ code: 'dates' });
  });
  it('does not treat a monthly price as nightly', () => {
    expect(quotePropertyStay(prop({ price_per_night: null, price: 60000, price_period: 'month' }), base)).toMatchObject({ code: 'no_rate' });
  });
  it('uses the Bangkok calendar for today', () => {
    expect(bangkokToday(new Date('2026-10-06T18:30:00Z'))).toBe('2026-10-07');
  });
});

describe('rate seasons', () => {
  const season = { start_date: '2026-11-11', end_date: '2026-11-30', nightly_rate: 5000, is_active: true };
  it('charges season rate per night inside the season', () => {
    // 10th base 3000 + 11th,12th season 5000 + cleaning 500
    const q = quotePropertyStay(prop(), { ...base, seasons: [season], total_amount: 13500 });
    expect(q).toMatchObject({ ok: true, total: 13500 });
    expect(quotePropertyStay(prop(), { ...base, seasons: [season] })).toMatchObject({ code: 'total' });
  });
  it('ignores inactive seasons and enforces season min stay', () => {
    expect(quotePropertyStay(prop(), { ...base, seasons: [{ ...season, is_active: false }] })).toMatchObject({ ok: true });
    expect(quotePropertyStay(prop(), { ...base, seasons: [{ ...season, start_date: '2026-11-01', min_stay_nights: 5 }], total_amount: 15500 })).toMatchObject({ code: 'min_stay' });
  });
});

describe('booking page contract', () => {
  it('accepts stay total sent without cleaning and charges stay + cleaning', () => {
    expect(quotePropertyStay(prop(), { ...base, total_amount: 9000 })).toMatchObject({ ok: true, total: 9500 });
  });
  it('accepts stacked length + timing discount', () => {
    const p = prop({ weekly_discount: 10, early_booking_discount: 10 });
    const week = { ...base, check_out: '2026-11-17', nights: 7, total_amount: 3000 * 7 * 0.8 };
    expect(quotePropertyStay(p, week)).toMatchObject({ ok: true });
  });
  it('accepts legacy JSONB seasonal price', () => {
    const p = prop({ seasonal_pricing: [{ startMonth: 11, startDay: 1, endMonth: 11, endDay: 30, pricePerNight: 4000, priceModifier: 100 }] });
    expect(quotePropertyStay(p, { ...base, total_amount: 12000 })).toMatchObject({ ok: true, total: 12500 });
  });
});

describe('Stripe deposit allocation', () => {
  it('preserves the exact deposit with fractional cleaning amounts', () => {
    for (const cleaningFee of [0, 500, 505, 505.55]) {
      const split = splitDepositMinorUnits(950, cleaningFee);
      expect(split.rental + split.cleaning).toBe(95000);
      expect(split.cleaning).toBe(Math.round(cleaningFee * 10));
    }
    expect(splitDepositMinorUnits(950, 505)).toEqual({ rental: 89950, cleaning: 5050 });
  });
  it('rejects invalid allocations instead of emitting negative Stripe amounts', () => {
    expect(() => splitDepositMinorUnits(0, 500)).toThrow();
    expect(() => splitDepositMinorUnits(10, 500)).toThrow();
    expect(() => splitDepositMinorUnits(Number.NaN, 0)).toThrow();
  });
});
