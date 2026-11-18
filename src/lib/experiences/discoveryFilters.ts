export const EXPERIENCE_DURATIONS = ['short', 'half-day', 'full-day'] as const;
export type ExperienceDuration = typeof EXPERIENCE_DURATIONS[number];

export function readExperienceFilters(params: URLSearchParams) {
  const amount = (key: string) => {
    const raw = params.get(key);
    if (raw === null) return undefined;
    return /^\d+(?:\.\d{1,2})?$/.test(raw) && Number.isFinite(Number(raw)) && Number(raw) <= Number.MAX_SAFE_INTEGER / 100
      ? Number(raw) : NaN;
  };
  const min = amount('minPrice'), max = amount('maxPrice');
  const duration = params.get('duration') || '';
  const invalid = (min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max))
    || (min !== undefined && max !== undefined && min > max)
    || Boolean(duration && !EXPERIENCE_DURATIONS.includes(duration as ExperienceDuration));
  return { min, max, duration, invalid };
}

/** Filters recorded catalogue attributes, never a quote or availability claim. */
export function matchesExperienceFilters(row: { price: number | null; currency: string; duration_minutes: number | null }, filters: ReturnType<typeof readExperienceFilters>) {
  if (filters.invalid) return false;
  if (filters.min !== undefined || filters.max !== undefined) {
    if (row.currency?.trim().toUpperCase() !== 'THB' || row.price === null || !Number.isFinite(row.price) || row.price < 0) return false;
    if (filters.min !== undefined && row.price < filters.min) return false;
    if (filters.max !== undefined && row.price > filters.max) return false;
  }
  if (filters.duration) {
    const minutes = row.duration_minutes;
    if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) return false;
    if (filters.duration === 'short' && minutes > 120) return false;
    if (filters.duration === 'half-day' && (minutes <= 120 || minutes > 360)) return false;
    if (filters.duration === 'full-day' && minutes <= 360) return false;
  }
  return true;
}
