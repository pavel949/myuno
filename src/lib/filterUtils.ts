/**
 * Filter utilities for normalizing and comparing filter values with database data
 */

/** Counts the number of active filter selections across all sections. */
export function countActiveFilters(filterValues: Record<string, unknown>): number {
  let count = 0;
  Object.values(filterValues).forEach(v => {
    if (Array.isArray(v)) count += v.length;
    else if (v) count += 1;
  });
  return count;
}

/**
 * Normalizes a string for filter comparison:
 * - Converts to lowercase
 * - Removes spaces, underscores, and hyphens
 */
export const normalizeForFilter = (value: string): string =>
  value.toLowerCase().replace(/[\s_-]/g, '');

/**
 * Checks if any item in dataArray matches any filter ID
 * Uses normalized comparison (case-insensitive, ignores separators)
 */
export const matchesFilter = (
  dataArray: string[] | null | undefined,
  filterIds: string[]
): boolean => {
  if (!filterIds.length) return true;
  if (!dataArray?.length) return false;

  const normalizedData = dataArray.map(normalizeForFilter);
  const normalizedFilters = filterIds.map(normalizeForFilter);
  return normalizedFilters.some(nFilter =>
    normalizedData.some(dataItem =>
      dataItem.includes(nFilter) || nFilter.includes(dataItem)
    )
  );
};

/**
 * Checks if a single value matches any filter ID
 */
export const matchesSingleFilter = (
  value: string | null | undefined,
  filterIds: string[]
): boolean => {
  if (!filterIds.length) return true;
  if (!value) return false;

  const normalizedValue = normalizeForFilter(value);
  const normalizedFilters = filterIds.map(normalizeForFilter);
  return normalizedFilters.some(nFilter =>
    normalizedValue.includes(nFilter) || nFilter.includes(normalizedValue)
  );
};

/** Shape used for marketplace rent/sale tabs (legacy listing_type + listing_modes[]) */
export type PropertyListingShape = {
  listing_type?: string | null;
  listing_modes?: string[] | null;
  price_per_night?: number | null;
  sale_price?: number | null;
};

/**
 * Whether a property should appear on the Rent or Buy tab.
 * DB may use listing_type only, listing_modes[] only, or both (e.g. rent_and_sale).
 * Some rows are mislabeled (e.g. sale + nightly price) — mirror useProperties SQL filter.
 */
export function matchesPropertyListingTab(
  property: PropertyListingShape,
  tab: 'rent' | 'sale'
): boolean {
  const lt = (property.listing_type || '').toLowerCase();
  const modes = property.listing_modes;
  const hasMode = (m: string) =>
    Array.isArray(modes) && modes.some((x) => (x || '').toLowerCase() === m);
  const hasNightly = property.price_per_night != null && property.price_per_night > 0;
  const hasSalePrice = property.sale_price != null && property.sale_price > 0;

  if (tab === 'rent') {
    if (lt === 'rent' || lt === 'rent_and_sale') return true;
    if (hasMode('rent')) return true;
    if (hasNightly) return true;
    return false;
  }
  if (tab === 'sale') {
    if (lt === 'sale' || lt === 'rent_and_sale') return true;
    if (hasMode('sale')) return true;
    if (hasSalePrice) return true;
    return false;
  }
  return true;
}

/**
 * Checks if current time is within working hours
 * @param workingHours - JSON object with day keys and time ranges
 * @returns true if currently open
 */
export const isOpenNow = (workingHours: Record<string, string> | null | undefined): boolean => {
  if (!workingHours) return false;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  
  const todayHours = workingHours[today] || workingHours[today.charAt(0).toUpperCase() + today.slice(1)];
  if (!todayHours || todayHours.toLowerCase() === 'closed') return false;
  
  // Parse time range like "09:00-21:00" or "9:00 AM - 9:00 PM"
  const timeMatch = todayHours.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*[-–]\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (!timeMatch) return true; // If can't parse, assume open
  
  const parseTime = (hour: string, minute: string | undefined, period: string | undefined): number => {
    let h = parseInt(hour);
    const m = minute ? parseInt(minute) : 0;
    if (period?.toLowerCase() === 'pm' && h < 12) h += 12;
    if (period?.toLowerCase() === 'am' && h === 12) h = 0;
    return h * 60 + m;
  };
  
  const openTime = parseTime(timeMatch[1], timeMatch[2], timeMatch[3]);
  const closeTime = parseTime(timeMatch[4], timeMatch[5], timeMatch[6]);
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  return currentTime >= openTime && currentTime <= closeTime;
};

/**
 * Checks price level filter
 */
export const matchesPriceLevel = (
  priceFrom: number | null | undefined,
  priceLevel: string | null | undefined
): boolean => {
  if (!priceLevel) return true;
  const price = priceFrom ?? 0;
  
  const priceLevelMap: Record<string, [number, number]> = {
    'budget': [0, 500],
    'mid': [500, 1500],
    'midrange': [500, 1500],
    'mid-range': [500, 1500],
    'premium': [1500, 5000],
    'luxury': [5000, Infinity],
  };
  
  const range = priceLevelMap[priceLevel.toLowerCase()];
  if (!range) return true;
  
  return price >= range[0] && price < range[1];
};

/**
 * Checks membership type filter for gyms
 */
export const matchesMembership = (
  gym: { price_day_pass?: number | null; price_week_pass?: number | null; price_month_pass?: number | null },
  membershipType: string | null | undefined
): boolean => {
  if (!membershipType) return true;
  
  switch (membershipType.toLowerCase()) {
    case 'day-pass':
    case 'daypass':
      return !!gym.price_day_pass;
    case 'weekly':
    case 'week-pass':
      return !!gym.price_week_pass;
    case 'monthly':
    case 'month-pass':
      return !!gym.price_month_pass;
    default:
      return true;
  }
};

/**
 * Checks group size filter for tours
 */
export const matchesGroupSize = (
  maxParticipants: number | null | undefined,
  groupSize: string | null | undefined
): boolean => {
  if (!groupSize) return true;
  const max = maxParticipants ?? 0;
  
  switch (groupSize.toLowerCase()) {
    case 'private':
      return max <= 4;
    case 'small':
    case 'small-group':
      return max > 4 && max <= 12;
    case 'large':
    case 'large-group':
      return max > 12;
    default:
      return true;
  }
};
