import { expect, it } from 'vitest';
import { serviceCatalogueReturnTo } from './serviceNavigation';
it('preserves homepage and catalog returns and rejects arbitrary destinations', () => {
  expect(serviceCatalogueReturnTo('/')).toBe('/');
  expect(serviceCatalogueReturnTo('/services?category=ac')).toBe(
    '/services?category=ac',
  );
  for (const value of [
    'https://example.com',
    '//example.com',
    '/admin',
    '/\\example.com',
    null,
  ]) {
    expect(serviceCatalogueReturnTo(value)).toBe('/discover/services');
  }
});
