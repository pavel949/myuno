import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { quoteHotelStay, type HotelQuoteInput } from '@/lib/hotelQuote';

const base = (): HotelQuoteInput => ({
  category: { id: 'c1', base_price_per_night: 3000, min_stay_nights: 1, max_guests: 2, is_active: true },
  plan: { id: 'p1', category_id: 'c1', adjustment_type: 'percent', adjustment_value: 0, min_stay_nights: null, max_stay_nights: null, min_advance_days: null, is_active: true },
  seasons: [], restrictions: [],
  check_in: '2026-11-10', check_out: '2026-11-13', guests: 2, today: '2026-10-08',
});

describe('hotel category quote', () => {
  it('base price × nights', () => {
    const q = quoteHotelStay(base());
    expect(q.ok && q.total).toBe(9000);
  });
  it('non-refundable −10% plan', () => {
    const i = base(); i.plan!.adjustment_value = -10;
    const q = quoteHotelStay(i);
    expect(q.ok && q.total).toBe(8100);
  });
  it('breakfast +500 per night', () => {
    const i = base(); i.plan!.adjustment_type = 'fixed_per_night'; i.plan!.adjustment_value = 500;
    expect((quoteHotelStay(i) as { total: number }).total).toBe(10500);
  });
  it('date price beats season beats base', () => {
    const i = base();
    i.seasons = [{ start_date: '2026-11-11', end_date: '2026-11-30', nightly_rate: 4000 }];
    i.restrictions = [{ date: '2026-11-12', price_override: 5000, min_stay_nights: null, closed_to_arrival: false, closed_to_departure: false, stop_sell: false }];
    expect((quoteHotelStay(i) as { total: number }).total).toBe(3000 + 4000 + 5000);
  });
  it('stop sell rejects', () => {
    const i = base();
    i.restrictions = [{ date: '2026-11-11', price_override: null, min_stay_nights: null, closed_to_arrival: false, closed_to_departure: false, stop_sell: true }];
    expect(quoteHotelStay(i)).toMatchObject({ ok: false, code: 'stop_sell' });
  });
  it('closed to arrival rejects', () => {
    const i = base();
    i.restrictions = [{ date: '2026-11-10', price_override: null, min_stay_nights: null, closed_to_arrival: true, closed_to_departure: false, stop_sell: false }];
    expect(quoteHotelStay(i)).toMatchObject({ ok: false, code: 'closed_arrival' });
  });
  it('plan min stay enforced', () => {
    const i = base(); i.plan!.min_stay_nights = 5;
    expect(quoteHotelStay(i)).toMatchObject({ ok: false, code: 'min_stay' });
  });
  it('too many guests rejected', () => {
    const i = base(); i.guests = 3;
    expect(quoteHotelStay(i)).toMatchObject({ ok: false, code: 'guests' });
  });
  it('plan of another category rejected', () => {
    const i = base(); i.plan!.category_id = 'other';
    expect(quoteHotelStay(i)).toMatchObject({ ok: false, code: 'invalid_plan' });
  });
  it('client and server copies are identical', () => {
    expect(readFileSync('src/lib/hotelQuote.ts', 'utf8')).toBe(readFileSync('supabase/functions/_shared/hotel-quote.ts', 'utf8'));
  });
});
