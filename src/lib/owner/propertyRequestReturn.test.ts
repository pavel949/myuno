import { describe, expect, it } from 'vitest';
import { propertyRequestReturnPath } from './propertyNavigation';

const properties = [{ property_id: 'p1' }, { property_id: 'p2' }];

describe('property request return path', () => {
  it('returns only to the selected accessible property', () => {
    expect(propertyRequestReturnPath('p2', properties, false)).toBe('/mc/properties/p2');
  });
  it.each(['', 'missing', 'https://evil.test', '//evil.test', '../admin'])('uses the management fallback for an unavailable ID: %s', id => {
    expect(propertyRequestReturnPath(id, properties, false)).toBe('/mc');
  });
  it('does not use stale/loading property access', () => {
    expect(propertyRequestReturnPath('p1', properties, true)).toBe('/mc');
    expect(propertyRequestReturnPath('p1', [], false)).toBe('/mc');
  });
  it('encodes the ID as a single path segment', () => {
    const id = 'p1/?returnTo=https://evil.test';
    expect(propertyRequestReturnPath(id, [{ property_id: id }], false)).toBe(`/mc/properties/${encodeURIComponent(id)}`);
  });
});
