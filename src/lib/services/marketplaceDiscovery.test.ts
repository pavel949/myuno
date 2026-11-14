import { describe, it, expect } from 'vitest';
import type { MarketplaceService } from '@/hooks/useServiceMarketplace';
import { clearServiceDiscoveryQuery } from './serviceDiscoveryQuery';
import { filterProviderOffers, popularProviderOffers, readMarketplaceFilters } from './marketplaceDiscovery';
const service = (id: string, price: number | null, currency: string | null, rating = 4.8, count: number | null = 10): MarketplaceService => ({
  id, price, currency, name_en: id, name_ru: null, description_en: null, description_ru: null,
  duration_minutes: 60, lead_time_hours: 2, images: [], provider_id: id, is_active: true, approval_status: 'approved',
  location: { district: 'Bang Tao' }, provider: { id, name: id, is_verified: true, rating, logo_url: null, review_count: count, coverage_areas: ['Rawai'] },
});
const read = (query: string) => readMarketplaceFilters(new URLSearchParams(query), '2026-11-14');
describe('marketplace offer filters', () => {
  it('compares only recorded prices in the selected currency including zero', () => {
    const rows = [service('baht', 900, 'THB'), service('usd', 20, 'USD'), service('unknown', null, 'THB'), service('zero', 0, 'THB')];
    expect(filterProviderOffers(rows, read('minPrice=0&maxPrice=1000&currency=THB')).map(s => s.id)).toEqual(['baht', 'zero']);
  });
  it('does not hide missing prices if no price bounds are active', () => {
    expect(filterProviderOffers([service('unknown', null, null)], read(''))).toHaveLength(1);
  });
  it('matches only the recorded location district, not provider coverage', () => {
    const rows = [service('a', 1, 'THB')];
    expect(filterProviderOffers(rows, read('district=bang-tao'))).toHaveLength(1);
    expect(filterProviderOffers(rows, read('district=Rawai'))).toHaveLength(0);
    expect(filterProviderOffers(rows, read('district=Kata'))).toHaveLength(0);
  });
  it('applies explicitly selected currency even without price bounds', () => {
    expect(filterProviderOffers([service('thb', 10, 'THB'), service('usd', 10, 'USD')], read('currency=USD')).map(row => row.id)).toEqual(['usd']);
  });
  it.each(['date=2026-02-30', 'date=2026-11-13', 'minPrice=-1', 'minPrice=abc', 'minPrice=500&maxPrice=100', 'currency=bad-code'])('fails closed on malformed query %s', query => {
    expect(read(query).invalid).toBe(true);
    expect(filterProviderOffers([service('a', 1, 'THB')], read(query))).toEqual([]);
  });
  it('today overrides a stored date in Phuket time', () => {
    expect(read('date=2026-12-15&today=1').date).toBe('2026-11-14');
  });
  it('reset removes known filters but preserves external context', () => {
    expect(clearServiceDiscoveryQuery(new URLSearchParams('date=2026-11-14&today=1&district=Rawai&currency=THB&minPrice=0&maxPrice=5&ref=trip')).toString()).toBe('ref=trip');
  });
});
describe('evidence-based popular selection', () => {
  it('ranks stored provider review counts then rating, not invented bookings', () => {
    expect(popularProviderOffers([service('little', 1, 'THB', 5, 1), service('many', 1, 'THB', 4.5, 50)]).map(s => s.id)).toEqual(['many', 'little']);
  });
  it('omits unknown or invalid review evidence', () => {
    expect(popularProviderOffers([service('missing', 1, 'THB', 4.5, null), service('empty', 1, 'THB', 5, 0), service('bad', 1, 'THB', 7, 50)])).toEqual([]);
  });
});
