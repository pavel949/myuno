import { expect, it } from 'vitest';
import type { Property } from '@/hooks/useProperties';
import { selectHomeShowcase, homeShowcasePrice } from './homeShowcase';
const property = (id: string, overrides = {}) => ({ id, title_ru: 'Жильё', title_en: 'Home', cover_image: 'https://example.invalid/home.webp', ...overrides }) as Property;
it('uses only named homes with usable stored media and unique IDs, capped without inventing records', () => {
  expect(selectHomeShowcase([property('no-photo', { cover_image: null }), property('script', { cover_image: 'javascript:alert(1)' }), property('unnamed', { title_ru: '', title_en: '' }), property('a'), property('a'), property('b')], 1).map(p => p.id)).toEqual(['a']);
});
it('uses another stored image when the cover URL is invalid and accepts homes without prices', () => {
  expect(selectHomeShowcase([property('a', { cover_image: 'bad', images: ['https://example.invalid/a.jpg'], price: undefined })])).toHaveLength(1);
});

it('preserves explicit tariffs independently from tenancy duration', () => {
  for (const tenancy_modes of [undefined, [], ['medium'], ['long']]) {
    expect(homeShowcasePrice(property('a', { tenancy_modes, currency: 'THB', price_per_night: 1000, price_period: 'night' }))).toEqual({ amount: 1000, currency: 'THB', period: 'night' });
  }
  expect(homeShowcasePrice(property('monthly', { tenancy_modes: ['long'], currency: 'THB', price_per_night: 1000, price: 30000, price_period: 'month' }))).toEqual({ amount: 30000, currency: 'THB', period: 'month' });
  expect(homeShowcasePrice(property('unknown', { price: 1000 }))).toBeNull();
  expect(homeShowcasePrice(property('usd', { currency: 'USD', price_period: 'month', price: 1000 }))).toBeNull();
});

it('prefers clear recorded tariffs without excluding or mutating other homes', () => {
  const equal = property('equal', { currency: 'THB', price_per_night: 3000, price: 3000, price_period: 'month' });
  const clear = property('clear', { currency: 'THB', price_per_night: 2000, price: 40000, price_period: 'month' });
  const next = property('next', { currency: 'THB', price_per_night: 1500, price_period: 'night' });
  const unknown = property('unknown');
  const input = [equal, unknown, clear, next];
  expect(selectHomeShowcase(input, 4).map(p => p.id)).toEqual(['clear', 'next', 'equal', 'unknown']);
  expect(input.map(p => p.id)).toEqual(['equal', 'unknown', 'clear', 'next']);
  expect(selectHomeShowcase([equal], 3)).toEqual([equal]);
});

it('represents different stored projects before repeating units from one resort', () => {
  const input = [
    property('a1', { project_id: 'resort-a' }), property('a2', { project_id: 'resort-a' }),
    property('a3', { project_id: 'resort-a' }), property('a4', { project_id: 'resort-a' }),
    property('b1', { project_id: 'resort-b' }), property('c1', { complex_id: 'resort-c' }),
  ];
  expect(selectHomeShowcase(input, 4).map(p => p.id)).toEqual(['a1', 'b1', 'c1', 'a2']);
  expect(input.map(p => p.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'b1', 'c1']);
});

it('uses project and complex links consistently while keeping unlinked homes independent', () => {
  expect(selectHomeShowcase([
    property('a1', { project_id: 'a' }), property('a2', { complex_id: 'a' }),
    property('standalone-1'), property('standalone-2'),
  ], 3).map(p => p.id)).toEqual(['a1', 'standalone-1', 'standalone-2']);
});

it('fills a small single-project catalogue without fabricated alternatives and handles zero limits', () => {
  const input = [property('a1', { project_id: 'a' }), property('a2', { project_id: 'a' })];
  expect(selectHomeShowcase(input, 6)).toEqual(input);
  expect(selectHomeShowcase(input, 0)).toEqual([]);
});
