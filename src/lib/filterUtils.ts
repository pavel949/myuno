/**
 * Filter utilities for normalizing and comparing filter values with database data
 */

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
  return filterIds.some(filterId => 
    normalizedData.some(dataItem => 
      dataItem.includes(normalizeForFilter(filterId)) ||
      normalizeForFilter(filterId).includes(dataItem)
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
  return filterIds.some(filterId => 
    normalizedValue.includes(normalizeForFilter(filterId)) ||
    normalizeForFilter(filterId).includes(normalizedValue)
  );
};

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
