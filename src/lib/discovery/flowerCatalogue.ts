import type { FilterValues } from '@/components/filters/UniversalFilter';
export const FLOWER_FILTER_KEYS = ['priceLevel', 'occasion', 'style', 'colorPalette', 'flowerType'] as const;
/** Repeated URL keys preserve multi-select values without ambiguous comma splitting. */
export function readFlowerFilters(params: URLSearchParams): FilterValues {
  const values: FilterValues = {};
  for (const key of FLOWER_FILTER_KEYS) {
    const entries = [...new Set(params.getAll(key).filter(Boolean))];
    if (entries.length) values[key] = key === 'priceLevel' ? entries[0] : entries;
  }
  return values;
}
export function writeFlowerFilters(params: URLSearchParams, values: FilterValues) {
  const next = new URLSearchParams(params);
  for (const key of FLOWER_FILTER_KEYS) {
    next.delete(key);
    const value = values[key];
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) next.append(key, entry);
  }
  return next;
}
