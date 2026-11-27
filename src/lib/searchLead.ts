/** Map the residential catalogue to the existing, DB-admitted consultation workflow. */
import type { UniversalLeadInput } from '@/hooks/useUniversalLead';
import { readPropertySearchQuery } from '@/lib/propertySearchQuery';
import { priceLevelToPriceRange } from '@/lib/propertyCatalogServerFilters';
import { civilDateKey } from '@/lib/hotelDates';

export type SearchLeadKind = 'rent' | 'buy';
// Deliberately exclude arbitrary URL parameters (return URLs, tokens, campaign data).
const CRITERIA = ['q','district','types','bedrooms','amenities','cats','company','project','tenancy','intent','quick','checkIn','checkOut','guests','instant','f.district','f.propertyType','f.bedrooms','f.amenities','f.highlights','f.viewType','f.furnishingLevel','f.poolType','f.parkingType','f.ownershipForm','f.guestsAtLeast','f.instantBooking','f.areaAtLeast','f.priceLevel','maxPrice'] as const;
const STAY_ONLY = new Set<string>(['tenancy','checkIn','checkOut','guests','instant','f.guestsAtLeast','f.instantBooking']);

export function buildSearchLeadInput(kind: SearchLeadKind, params: URLSearchParams, contact: { name: string; phone: string; notes?: string }): UniversalLeadInput {
  const search: Record<string, string> = { mode: kind };
  for (const key of CRITERIA) {
    if (kind === 'buy' && STAY_ONLY.has(key)) continue;
    const value = params.get(key);
    if (value !== null && value.length <= 200) search[key] = value;
  }
  const state = readPropertySearchQuery(new URLSearchParams(search));
  if (kind === 'buy' && state.saleMaxPrice != null) search.maxPrice = String(state.saleMaxPrice);
  else delete search.maxPrice;
  const { locations, propertyTypes, checkIn, checkOut, guests } = state.search;
  const from = checkIn ? civilDateKey(checkIn) : undefined;
  const to = checkOut ? civilDateKey(checkOut) : undefined;
  const dates = kind === 'rent' && from && to && from < to ? { check_in: from, check_out: to } : undefined;
  const explicitTenancy = ['short','medium','long'].includes(search.tenancy) || ['rent-month','rent-long'].includes(search.intent);
  const tenancy = kind === 'rent' && (explicitTenancy || dates) ? state.tenancy : undefined;
  const shortStay = kind === 'rent' && tenancy === 'short';
  const priceLevel = state.filterValues.priceLevel;
  // Nightly bands are not monthly/annual budgets; use the same bands as the actual catalogue.
  const band = (kind === 'buy' || state.tenancy === 'short') && typeof priceLevel === 'string'
    ? priceLevelToPriceRange(priceLevel, kind === 'buy' ? 'sale' : 'rent') : null;
  const bounded = kind === 'buy' && state.saleMaxPrice != null
    ? { ...band, maxPrice: Math.min(band?.maxPrice ?? state.saleMaxPrice, state.saleMaxPrice) }
    : band;
  const range = bounded?.minPrice != null && bounded.maxPrice != null && bounded.minPrice > bounded.maxPrice ? null : bounded;
  if (kind === 'rent' && state.tenancy !== 'short') delete search['f.priceLevel'];
  // The deployed CHECK admits vacation_rental and property_consultation, not
  // property_rental_search/property_purchase_search. Search is not a viewing,
  // confirmed booking, deal or payment. Keep intent in the existing metadata.
  return {
    vertical_id: 'properties',
    request_type: shortStay ? 'vacation_rental' : 'property_consultation',
    lead_source: 'organic',
    entry_point: `catalogue_search:${kind}`,
    name: contact.name.trim(),
    phone: contact.phone.trim(),
    notes: contact.notes?.trim() || undefined,
    currency: 'THB',
    budget_min: range?.minPrice,
    budget_max: range?.maxPrice,
    districts: locations.length ? locations : undefined,
    property_types: propertyTypes.length ? propertyTypes : undefined,
    guests_count: kind === 'rent' && state.hasGuestFilter ? guests : undefined,
    preferred_dates: dates,
    vertical_metadata: { search_kind: kind, search, tenancy, request_only: true, budget_basis: range ? (kind === 'buy' ? 'asking_price' : 'nightly') : undefined },
  };
}
