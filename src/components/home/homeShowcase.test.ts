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

it('never advertises stale nightly pricing for monthly/yearly-only homes or unknown tenancy', () => {
  for (const tenancy_modes of [undefined, [], ['medium'], ['long']]) {
    expect(homeShowcasePrice(property('a', { tenancy_modes, currency: 'THB', price_per_night: 1000, price_period: 'night' }))).toBeNull();
  }
  expect(homeShowcasePrice(property('monthly', { tenancy_modes: ['medium'], currency: 'THB', price_per_night: 1000, price: 30000, price_period: 'month' }))).toEqual({ amount: 30000, currency: 'THB', period: 'month' });
  expect(homeShowcasePrice(property('short', { tenancy_modes: ['short'], currency: 'THB', price_per_night: 1000 }))).toEqual({ amount: 1000, currency: 'THB', period: 'night' });
});
