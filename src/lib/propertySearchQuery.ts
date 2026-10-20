/** Compatibility boundary for the one residential catalogue URL. */
import type { SearchParams } from '@/components/property/AirbnbSearchBar';
import { parseFiltersFromParams } from '@/lib/propertyBrowseFilters';
import { parseCivilDate } from '@/lib/hotelDates';

const list = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : typeof value === 'string' ? value.split(',').filter(Boolean) : [];
const arrayFilters = ['district', 'propertyType', 'bedrooms', 'amenities', 'highlights', 'viewType', 'furnishingLevel', 'poolType', 'parkingType', 'ownershipForm'];
export function readPropertySearchQuery(params: URLSearchParams) {
  const legacy = parseFiltersFromParams(params);
  for (const key of arrayFilters) if (legacy.filterValues[key]) legacy.filterValues[key] = list(legacy.filterValues[key]);
  const pick = (key: string, legacyKey: string) => params.has(key) ? list(params.get(key)) : list(legacy.filterValues[legacyKey]);
  const date = (key: string) => {
    const raw = params.get(key);
    if (!raw) return undefined;
    const value = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? parseCivilDate(raw) : new Date(raw);
    return Number.isNaN(value.getTime()) ? undefined : value;
  };
  const rawGuests = params.get('guests') ?? legacy.filterValues.guestsAtLeast;
  const guests = Number(rawGuests ?? 2);
  const hasGuestFilter = rawGuests != null && Number.isSafeInteger(guests) && guests >= 1 && guests <= 50;
  const search: SearchParams = {
    locations: pick('district', 'district'), propertyTypes: pick('types', 'propertyType'),
    bedrooms: pick('bedrooms', 'bedrooms'), amenities: list(params.get('amenities')),
    checkIn: date('checkIn'), checkOut: date('checkOut'),
    guests: Number.isSafeInteger(guests) && guests >= 1 && guests <= 50 ? guests : 2,
    instantBooking: params.has('instant') ? params.get('instant') === '1' : legacy.filterValues.instantBooking === 'yes',
  };
  // Core criteria have one owner/editor; legacy keys remain in URL until edited.
  for (const key of ['district', 'propertyType', 'guestsAtLeast', 'listingType']) delete legacy.filterValues[key];
  delete legacy.filterValues.bedrooms;
  delete legacy.filterValues.instantBooking;
  if (search.bedrooms.length) legacy.filterValues.bedrooms = search.bedrooms;
  if (search.instantBooking) legacy.filterValues.instantBooking = 'yes';
  const mode: 'rent' | 'buy' = params.get('mode') === 'buy' || (!params.has('mode') && params.get('f.listingType') === 'sale') ? 'buy' : 'rent';
  const intent = params.get('intent');
  const tenancyValue = params.get('tenancy') ?? (intent === 'rent-month' ? 'medium' : intent === 'rent-long' ? 'long' : 'short');
  const tenancy: 'short' | 'medium' | 'long' = tenancyValue === 'medium' ? 'medium' : tenancyValue === 'long' ? 'long' : 'short';
  const saleIntent: 'standard' | 'assignment' | 'quick_sale' | undefined = intent === 'standard' || intent === 'assignment' || intent === 'quick_sale' ? intent : undefined;
  return { search, hasGuestFilter, mode, tenancy, saleIntent, isQuickSale: params.get('quick') === '1' || saleIntent === 'quick_sale', filterValues: legacy.filterValues, categories: [...new Set([...legacy.categories, ...search.amenities])] };
}

/** Preserve bookmark parameters; a route alias only supplies its owned defaults. */
export function propertySearchHref(search: string, defaults: Record<string, string> = {}) {
  const params = new URLSearchParams(search);
  Object.entries(defaults).forEach(([key, value]) => params.set(key, value));
  const query = params.toString();
  return `/property/search${query ? `?${query}` : ''}`;
}
