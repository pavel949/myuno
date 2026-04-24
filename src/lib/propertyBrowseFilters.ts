/**
 * Helpers for persisting /property/browse filter state.
 * Filters live in the URL (shareable) and mirror to localStorage (returns).
 */
import type { FilterValues } from '@/components/filters/UniversalFilter';

export const LS_KEY = 'myuno:propertyBrowse:filters:v1';
const FILTER_PREFIX = 'f.';
const CATS_KEY = 'cats';

export interface BrowseFilterState {
  filterValues: FilterValues;
  categories: string[];
}

/** Convert filters + categories to a flat string-map for URLSearchParams. */
export function serializeFilters(
  filterValues: FilterValues,
  categories: string[]
): Record<string, string> {
  const out: Record<string, string> = {};
  if (categories.length > 0) {
    out[CATS_KEY] = categories.join(',');
  }
  Object.entries(filterValues).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      out[`${FILTER_PREFIX}${key}`] = value.join(',');
    } else if (typeof value === 'string' && value.length > 0) {
      out[`${FILTER_PREFIX}${key}`] = value;
    }
  });
  return out;
}

/**
 * Parse URL search params into filter state.
 * `hasAny` = true if at least one persisted key is present (cats or f.*).
 */
export function parseFiltersFromParams(
  params: URLSearchParams
): BrowseFilterState & { hasAny: boolean } {
  const filterValues: FilterValues = {};
  const categories: string[] = [];
  let hasAny = false;

  const catsRaw = params.get(CATS_KEY);
  if (catsRaw) {
    const parsed = catsRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (parsed.length > 0) {
      categories.push(...parsed);
      hasAny = true;
    }
  }

  params.forEach((value, key) => {
    if (!key.startsWith(FILTER_PREFIX)) return;
    const sectionId = key.slice(FILTER_PREFIX.length);
    if (!sectionId) return;
    if (value.includes(',')) {
      const arr = value.split(',').map(s => s.trim()).filter(Boolean);
      if (arr.length > 0) {
        filterValues[sectionId] = arr;
        hasAny = true;
      }
    } else if (value.length > 0) {
      filterValues[sectionId] = value;
      hasAny = true;
    }
  });

  return { filterValues, categories, hasAny };
}

/** Keys this module owns inside URLSearchParams (everything else is left untouched). */
export function isOwnedKey(key: string): boolean {
  return key === CATS_KEY || key.startsWith(FILTER_PREFIX);
}

export function loadFromStorage(): BrowseFilterState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BrowseFilterState>;
    return {
      filterValues: parsed.filterValues && typeof parsed.filterValues === 'object' ? parsed.filterValues : {},
      categories: Array.isArray(parsed.categories) ? parsed.categories.filter(c => typeof c === 'string') : [],
    };
  } catch {
    return null;
  }
}

export function saveToStorage(state: BrowseFilterState): void {
  try {
    const hasFilters =
      state.categories.length > 0 ||
      Object.values(state.filterValues).some(v => (Array.isArray(v) ? v.length > 0 : !!v));
    if (!hasFilters) {
      localStorage.removeItem(LS_KEY);
      return;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / disabled storage
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}
