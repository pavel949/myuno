import { describe, expect, it } from 'vitest';
import { buildSearchLeadInput } from './searchLead';
const c = { name: ' Anna ', phone: '+66 80 000 0000' };
describe('buildSearchLeadInput', () => {
  it('carries rental dates, guests and areas into the lead', () => {
    const lead = buildSearchLeadInput('rent', new URLSearchParams('mode=rent&tenancy=short&district=rawai,kata&checkIn=2026-12-01&checkOut=2026-12-08&guests=3'), c);
    expect(lead).toMatchObject({ vertical_id: 'properties', request_type: 'property_rental_search', districts: ['rawai', 'kata'], guests_count: 3, preferred_dates: { check_in: '2026-12-01', check_out: '2026-12-08' }, name: 'Anna' });
  });
  it('drops reversed dates instead of inventing them', () => {
    expect(buildSearchLeadInput('rent', new URLSearchParams('checkIn=2026-12-08&checkOut=2026-12-01'), c).preferred_dates).toBeUndefined();
  });
  it('purchase leads never carry guests or dates', () => {
    const lead = buildSearchLeadInput('buy', new URLSearchParams('mode=buy&guests=4&checkIn=2026-12-01&checkOut=2026-12-08&types=villa'), c);
    expect(lead.request_type).toBe('property_purchase_search');
    expect(lead.guests_count).toBeUndefined();
    expect(lead.preferred_dates).toBeUndefined();
    expect(lead.property_types).toEqual(['villa']);
  });
  it('experience leads keep the price limit and route to tours', () => {
    const lead = buildSearchLeadInput('experiences', new URLSearchParams('q=diving&maxPrice=3000&minPrice=-5'), c);
    expect(lead).toMatchObject({ vertical_id: 'tours', budget_max: 3000, budget_min: undefined });
  });
});
