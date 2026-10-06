import { describe, it, expect } from 'vitest';
import { quotePropertyStay, bangkokToday, type PropertyPricingRow } from '../../../supabase/functions/_shared/property-quote';

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
