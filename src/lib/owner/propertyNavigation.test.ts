import { describe, expect, it } from 'vitest';
import { accessiblePropertySelection, propertyContextBackPath } from './propertyNavigation';
const properties = [{ property_id: 'p1' }, { property_id: 'p2' }];
describe('accessible property URL selection', () => {
  it('only selects a known ID after loading', () => {
    expect(accessiblePropertySelection('p2', properties, false, 'first')).toBe('p2');
    expect(accessiblePropertySelection('p2', properties, true, 'first')).toBe('');
    expect(accessiblePropertySelection('missing', properties, false, 'all')).toBe('');
    expect(accessiblePropertySelection('', properties, false, 'first')).toBe('');
    expect(accessiblePropertySelection(null, [], false, 'all')).toBe('');
  });
  it('preserves no-context defaults only for nonempty accessible lists', () => {
    expect(accessiblePropertySelection(null, properties, false, 'first')).toBe('p1');
    expect(accessiblePropertySelection(null, properties, false, 'all')).toBe('all');
  });
});
describe('bounded contextual return paths', () => {
  it.each([null, 'https://evil.test', '//evil.test', '/\\evil.test', '/admin/users', '/mc/properties/p1/editor'])('rejects arbitrary return %s', value => {
    expect(propertyContextBackPath(value, 'p2')).toBe('/mc/properties/p2');
  });
  it('replaces stale selected ID while retaining calendar context', () => {
    expect(propertyContextBackPath('/mc/calendar?property=p1&ref=owner&returnTo=x', 'p2')).toBe('/mc/calendar?property=p2&ref=owner');
    expect(propertyContextBackPath('/mc/properties/p1', 'p2')).toBe('/mc/properties/p2');
  });
  it('does not navigate to a stale property if no valid selection remains', () => {
    expect(propertyContextBackPath('/mc/calendar?property=p1', '')).toBe('/mc/properties');
    expect(propertyContextBackPath(null, 'all')).toBe('/mc/properties');
  });
});
