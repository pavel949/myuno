import { describe, expect, it } from 'vitest';
import type { Yacht } from '@/hooks/useYachts';
import { comparableYachtPrices, readYachtFilters, selectYachts } from './yachtCatalogue';
const boat = (id: string, price: number | null, extra: Partial<Yacht> = {}) => ({ id, name_en: id, name_ru: '', capacity: 6, currency: 'THB', price_full_day: price, price_half_day: 1, ...extra } as Yacht);
const filters = (query: string) => readYachtFilters(new URLSearchParams(query));
describe('yacht catalogue selection', () => {
  it('restores URL criteria and fails closed for invalid capacity/type/sort', () => {
    expect(filters('type=catamaran&guests=8&q=Lagoon&sort=capacity')).toMatchObject({ type: 'catamaran', guests: '8', query: 'Lagoon', invalid: false });
    for (const value of ['guests=-1','guests=abc','guests=1.2','guests=1001','type=unknown','sort=unknown']) expect(selectYachts([boat('one', 10)], filters(value))).toEqual([]);
  });
  it('searches names and departure and respects known capacity', () => {
    expect(selectYachts([boat('Lagoon', 100, { capacity: 8 }), boat('other', 100, { capacity: 3 })], filters('q=lagoon&guests=6')).map(x => x.id)).toEqual(['Lagoon']);
  });
  it('compares full day to full day and leaves absent/invalid prices last in both directions', () => {
    const rows = [boat('low', 100, { price_half_day: 99 }), boat('high', 200, { price_half_day: 1 }), boat('unknown', null), boat('invalid', Infinity)];
    expect(selectYachts(rows, filters('sort=price_asc')).map(x => x.id)).toEqual(['low','high','unknown','invalid']);
    expect(selectYachts(rows, filters('sort=price_desc')).map(x => x.id)).toEqual(['high','low','unknown','invalid']);
  });
  it('does not sort across unknown or mixed currencies', () => {
    const rows = [boat('first', 200), boat('second', 100, { currency: 'USD' })];
    expect(comparableYachtPrices(rows)).toBe(false);
    expect(selectYachts(rows, filters('sort=price_asc'))).toEqual(rows);
    expect(comparableYachtPrices([boat('unknown',100,{currency:'XXX'})])).toBe(false);
  });
});
