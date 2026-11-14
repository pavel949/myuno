import type { MarketplaceService } from '@/hooks/useServiceMarketplace';
import { phuketToday } from './slots';

export const MARKETPLACE_FILTER_KEYS = ['district', 'date', 'minPrice', 'maxPrice', 'currency', 'today'] as const;
export type MarketplaceFilterKey = typeof MARKETPLACE_FILTER_KEYS[number];
export function validServiceDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function readMarketplaceFilters(params: URLSearchParams, today = phuketToday()) {
  const price = (key: string) => {
    const value = params.get(key);
    return value === null || value.trim() === '' ? null : /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : NaN;
  };
  const minPrice = price('minPrice');
  const maxPrice = price('maxPrice');
  const todayOnly = params.get('today') === '1';
  const date = todayOnly ? today : params.get('date') ?? '';
  const currency = (params.get('currency') || 'THB').toUpperCase();
  return { district: params.get('district')?.trim() ?? '', date, todayOnly, minPrice, maxPrice, currency, currencyExplicit: params.has('currency'),
    invalid: Boolean((date && (!validServiceDate(date) || date < today)) || Number.isNaN(minPrice) || Number.isNaN(maxPrice)
      || (minPrice !== null && maxPrice !== null && minPrice > maxPrice) || !/^[A-Z]{3}$/.test(currency)),
    active: MARKETPLACE_FILTER_KEYS.some(key => params.has(key)),
  };
}
export type MarketplaceFilters = ReturnType<typeof readMarketplaceFilters>;
const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s_-]+/g, ' ');
export function serviceDistricts(service: MarketplaceService): string[] {
  return service.location?.district?.trim() ? [service.location.district.trim()] : [];
}
export function filterProviderOffers(services: MarketplaceService[], filters: MarketplaceFilters): MarketplaceService[] {
  if (filters.invalid) return [];
  return services.filter(service => {
    if (filters.district && !serviceDistricts(service).some(value => normalize(value) === normalize(filters.district))) return false;
    const hasPriceFilter = filters.minPrice !== null || filters.maxPrice !== null;
    if ((hasPriceFilter || filters.currencyExplicit) && service.currency?.trim().toUpperCase() !== filters.currency) return false;
    if (hasPriceFilter) {
      if (service.price == null || !Number.isFinite(service.price) || service.price < 0 || service.currency?.trim().toUpperCase() !== filters.currency) return false;
      if (filters.minPrice !== null && service.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && service.price > filters.maxPrice) return false;
    }
    return true;
  });
}
/** Evidence-based discovery, not a fabricated live bookings/trending counter. */
export function popularProviderOffers(services: MarketplaceService[], limit = 4): MarketplaceService[] {
  return services.filter(service => {
    const provider = service.provider;
    return provider && Number.isFinite(provider.rating) && provider.rating! > 0 && provider.rating! <= 5
      && Number.isInteger(provider.review_count) && provider.review_count! > 0;
  }).sort((a, b) => b.provider!.review_count! - a.provider!.review_count! || b.provider!.rating! - a.provider!.rating! || a.id.localeCompare(b.id)).slice(0, limit);
}
