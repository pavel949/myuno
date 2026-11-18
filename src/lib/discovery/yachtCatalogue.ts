import type { Yacht } from '@/hooks/useYachts';
import { CURRENCIES } from '@/lib/config/currencies';

export const YACHT_TYPES = ['all', 'motor_yacht', 'catamaran', 'speedboat', 'superyacht'] as const;
export const YACHT_SORTS = ['featured', 'price_asc', 'price_desc', 'rating', 'capacity'] as const;
export function readYachtFilters(params: URLSearchParams) {
  const type = params.get('type') || 'all';
  const sort = params.get('sort') || 'featured';
  const guests = params.get('guests') || '';
  return { type, sort, query: params.get('q') || '', guests,
    invalid: !YACHT_TYPES.includes(type as typeof YACHT_TYPES[number]) ||
      !YACHT_SORTS.includes(sort as typeof YACHT_SORTS[number]) ||
      Boolean(guests && (!/^\d+$/.test(guests) || Number(guests) < 1 || Number(guests) > 1000)),
  };
}
export const fullDayPrice = (yacht: Yacht) => typeof yacht.price_full_day === 'number' && Number.isFinite(yacht.price_full_day) && yacht.price_full_day > 0 ? yacht.price_full_day : null;
/** Compare only one recorded tariff and currency; do not infer currency conversion. */
export function comparableYachtPrices(yachts: Yacht[]) {
  const currencies = yachts.filter(y => fullDayPrice(y) !== null).map(y => y.currency?.trim().toUpperCase());
  return new Set(currencies).size <= 1 && currencies.every(c => c && Object.prototype.hasOwnProperty.call(CURRENCIES, c));
}
export function selectYachts(yachts: Yacht[], filters: ReturnType<typeof readYachtFilters>) {
  if (filters.invalid) return [];
  const query = filters.query.trim().toLocaleLowerCase();
  const rows = yachts.filter(y => (!query || [y.name_ru, y.name_en, y.location_name, y.location_ru].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)) && (!filters.guests || y.capacity >= Number(filters.guests)));
  if (filters.sort === 'price_asc' || filters.sort === 'price_desc') {
    if (!comparableYachtPrices(rows)) return rows;
    return rows.sort((a, b) => {
      const x = fullDayPrice(a), z = fullDayPrice(b);
      if (x === null) return z === null ? 0 : 1;
      if (z === null) return -1;
      return filters.sort === 'price_asc' ? x - z : z - x;
    });
  }
  return rows.sort((a, b) => filters.sort === 'rating' ? (b.rating || 0) - (a.rating || 0) : filters.sort === 'capacity' ? (b.capacity || 0) - (a.capacity || 0) : Number(b.is_featured) - Number(a.is_featured));
}
