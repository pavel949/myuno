/**
 * Maps UI filter state to Supabase PropertyFilters for server-side queries.
 */

import type { FilterValues } from '@/components/filters/UniversalFilter';
import { normalizeHighlightIds, normalizeListingAmenities } from '@/lib/propertyAttributeRegistry';
import type { SearchParams } from '@/components/property/AirbnbSearchBar';
import type { PropertyFilters } from '@/hooks/useProperties';

/** Nightly / rent price bands (THB) — UniversalFilter price levels */
const RENT_PRICE_LEVEL_RANGES: Record<string, { min?: number; max?: number }> = {
  '1': { min: 0, max: 3000 },
  '2': { min: 3000, max: 8000 },
  '3': { min: 8000, max: 25000 },
  '4': { min: 25000 },
};

/** Sale asking price bands (THB) — same 4-level UI, different scale */
const SALE_PRICE_LEVEL_RANGES: Record<string, { min?: number; max?: number }> = {
  '1': { min: 0, max: 5_000_000 },
  '2': { min: 5_000_000, max: 15_000_000 },
  '3': { min: 15_000_000, max: 40_000_000 },
  '4': { min: 40_000_000 },
};

export function priceLevelToPriceRange(
  priceLevel: string | null | undefined,
  mode: 'rent' | 'sale'
): { minPrice?: number; maxPrice?: number } | null {
  if (!priceLevel) return null;
  const map = mode === 'sale' ? SALE_PRICE_LEVEL_RANGES : RENT_PRICE_LEVEL_RANGES;
  const r = map[priceLevel];
  if (!r) return null;
  return { minPrice: r.min, maxPrice: r.max };
}

function bedroomsFromFilterValues(
  bedrooms: unknown
): Pick<PropertyFilters, 'bedrooms' | 'minBedrooms'> {
  const arr = Array.isArray(bedrooms)
    ? bedrooms
    : typeof bedrooms === 'string' && bedrooms
      ? [bedrooms]
      : [];
  if (!arr.length) return {};

  const nums: number[] = [];
  for (const raw of arr) {
    const b = String(raw);
    if (b === 'studio') {
      nums.push(0);
    } else {
      const n = parseInt(b.replace('+', ''), 10);
      if (!Number.isNaN(n)) nums.push(n);
    }
  }

  if (arr.length === 1 && arr[0] === 'studio') {
    return { bedrooms: 'studio' };
  }
  if (nums.length === 0) return {};

  const minBed = Math.max(...nums);

  if (arr.length === 1) {
    const single = String(arr[0]);
    if (single === '4+') return { minBedrooms: 4 };
    if (single === '5+') return { minBedrooms: 5 };
    if (single === '6+') return { minBedrooms: 6 };
    if (single === '8+') return { minBedrooms: 8 };
    if (single === '10+') return { minBedrooms: 10 };
    if (single === '12+') return { minBedrooms: 12 };
    const n = parseInt(single, 10);
    if (!Number.isNaN(n)) return { minBedrooms: n };
  }

  return { minBedrooms: minBed };
}

const AREA_BUCKET: Record<string, { min?: number; max?: number }> = {
  '': {},
  any: {},
  '50': { min: 50 },
  '80': { min: 80 },
  '120': { min: 120 },
  '200': { min: 200 },
};

export interface CatalogFilterSourceOptions {
  listingType: 'rent' | 'sale';
  /** From AirbnbSearchBar / URL */
  minGuestsFromSearch?: number;
  instantBookingFromSearch?: boolean;
  /** Nightly STR vs monthly/yearly rent */
  rentTenancy?: 'short' | 'long';
}

/**
 * Merge search-bar URL state into UniversalFilter values (district/bedrooms/types only).
 * Search-bar "detail" amenities use category matching client-side — not DB `amenities[]`.
 */
export function mergeSearchBarIntoFilterValues(
  filterValues: FilterValues,
  searchParams: Pick<SearchParams, 'locations' | 'bedrooms' | 'propertyTypes'>
): FilterValues {
  const merged: FilterValues = { ...filterValues };

  const hasDistrict =
    (Array.isArray(merged.district) && merged.district.length > 0) ||
    (typeof merged.district === 'string' && merged.district.length > 0);

  if (searchParams.locations.length > 0 && !hasDistrict) {
    merged.district = searchParams.locations;
  }

  if (searchParams.bedrooms.length > 0) {
    const cur = Array.isArray(merged.bedrooms)
      ? merged.bedrooms
      : merged.bedrooms
        ? [String(merged.bedrooms)]
        : [];
    merged.bedrooms = [...new Set([...cur.map(String), ...searchParams.bedrooms])];
  }

  if (searchParams.propertyTypes.length > 0) {
    const cur = Array.isArray(merged.propertyType)
      ? merged.propertyType
      : merged.propertyType
        ? [String(merged.propertyType)]
        : [];
    merged.propertyType = [...new Set([...cur.map(String), ...searchParams.propertyTypes])];
  }

  return merged;
}

/**
 * Merge UniversalFilter + search bar extras into PropertyFilters for usePropertiesInfinite.
 */
export function filterValuesToPropertyFilters(
  filterValues: FilterValues,
  options: CatalogFilterSourceOptions
): PropertyFilters {
  const listingFromUi = filterValues.listingType as string | null | undefined;
  const effectiveListing: 'rent' | 'sale' =
    listingFromUi && listingFromUi !== 'all'
      ? (listingFromUi === 'sale' ? 'sale' : 'rent')
      : options.listingType === 'sale'
        ? 'sale'
        : 'rent';

  const priceMode: 'rent' | 'sale' = effectiveListing === 'sale' ? 'sale' : 'rent';

  const districts = (filterValues.district as string[] | undefined)?.filter(Boolean) ?? [];
  const amenities = normalizeListingAmenities(
    (filterValues.amenities as string[] | undefined)?.filter(Boolean) ?? []
  );
  const highlights = normalizeHighlightIds(
    (filterValues.highlights as string[] | undefined)?.filter(Boolean) ?? []
  );
  const propertyType = filterValues.propertyType as string[] | undefined;
  const priceLevel = filterValues.priceLevel as string | null | undefined;

  const viewTypes = (filterValues.viewType as string[] | undefined)?.filter(Boolean) ?? [];
  const furnishingLevels = (filterValues.furnishingLevel as string[] | undefined)?.filter(Boolean) ?? [];
  const poolTypes = (filterValues.poolType as string[] | undefined)?.filter(Boolean) ?? [];
  const parkingTypes = (filterValues.parkingType as string[] | undefined)?.filter(Boolean) ?? [];
  const ownershipForms = (filterValues.ownershipForm as string[] | undefined)?.filter(Boolean) ?? [];

  const guestsAtLeast = filterValues.guestsAtLeast as string | null | undefined;
  const areaBucket = (filterValues.areaAtLeast as string | undefined) || '';

  const priceRange = priceLevelToPriceRange(priceLevel ?? null, priceMode);

  const bedPick = bedroomsFromFilterValues(filterValues.bedrooms);

  const instantBooking =
    options.instantBookingFromSearch === true ||
    filterValues.instantBooking === 'yes';

  let minGuests: number | undefined;
  if (guestsAtLeast && guestsAtLeast !== 'any') {
    const g = parseInt(guestsAtLeast, 10);
    if (!Number.isNaN(g)) minGuests = g;
  }
  if (options.minGuestsFromSearch != null && options.minGuestsFromSearch > 0) {
    minGuests = Math.max(minGuests ?? 0, options.minGuestsFromSearch);
  }

  let minAreaSqm: number | undefined;
  let maxAreaSqm: number | undefined;
  const area = AREA_BUCKET[areaBucket];
  if (area?.min != null) minAreaSqm = area.min;
  if (area?.max != null) maxAreaSqm = area.max;

  const result: PropertyFilters = {
    listingType: effectiveListing,
    ...(effectiveListing === 'rent' && options.rentTenancy
      ? { rentTenancy: options.rentTenancy }
      : {}),
    ...(districts.length === 1 ? { district: districts[0] } : {}),
    ...(districts.length > 1 ? { districts } : {}),
    ...(amenities.length ? { amenities } : {}),
    ...(highlights.length ? { highlights } : {}),
    ...bedPick,
    ...(propertyType?.length === 1 ? { propertyType: propertyType[0] } : {}),
    ...(propertyType && propertyType.length > 1 ? { propertyTypes: propertyType } : {}),
    ...(priceRange?.minPrice != null ? { minPrice: priceRange.minPrice } : {}),
    ...(priceRange?.maxPrice != null ? { maxPrice: priceRange.maxPrice } : {}),
    ...(minAreaSqm != null ? { minAreaSqm } : {}),
    ...(maxAreaSqm != null ? { maxAreaSqm } : {}),
    ...(minGuests != null && minGuests > 0 ? { minGuests } : {}),
    ...(instantBooking ? { instantBooking: true } : {}),
    ...(viewTypes.length ? { viewTypes } : {}),
    ...(furnishingLevels.length === 1 ? { furnishingLevel: furnishingLevels[0] } : {}),
    ...(furnishingLevels.length > 1 ? { furnishingLevels } : {}),
    ...(poolTypes.length === 1 ? { poolType: poolTypes[0] } : {}),
    ...(poolTypes.length > 1 ? { poolTypes } : {}),
    ...(parkingTypes.length === 1 ? { parkingType: parkingTypes[0] } : {}),
    ...(parkingTypes.length > 1 ? { parkingTypes } : {}),
    ...(ownershipForms.length === 1 ? { ownershipForm: ownershipForms[0] } : {}),
    ...(ownershipForms.length > 1 ? { ownershipForms } : {}),
  };

  return result;
}
