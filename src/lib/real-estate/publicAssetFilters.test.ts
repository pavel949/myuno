import { describe, expect, it } from 'vitest';
import { publicAssetFilterIssue, publicAssetNumber, clearPublicAssetFilters } from './publicAssetFilters';
describe('public property catalogue URL filters', () => {
  it.each(['minPrice=NaN', 'minPrice=Infinity', 'minArea=-1', 'minPrice=20&maxPrice=10', 'minCap=101', 'intent=unexpected', 'type=unknown'])('rejects invalid commercial criteria %s', query => {
    expect(publicAssetFilterIssue(new URLSearchParams(query), 'commercial')).toBe('invalid');
  });
  it.each([['commercial', 'tenant=1'], ['commercial', 'intent=rent&minPrice=10'], ['hotel', 'minOcc=65'], ['hotel', 'mgmt=under_hma']])('does not treat unavailable %s filters as an empty market: %s', (kind, query) => {
    expect(publicAssetFilterIssue(new URLSearchParams(query), kind as 'commercial' | 'hotel')).toBe('unsupported');
  });
  it.each(['mode=unknown', 'minStars=6', 'minKeys=10&maxKeys=5', 'license=unknown', 'minKeys=-1'])('rejects invalid hotel criteria %s', query => {
    expect(publicAssetFilterIssue(new URLSearchParams(query), 'hotel')).toBe('invalid');
  });
  it('accepts a real public sale/area range, including a zero minimum', () => {
    const params = new URLSearchParams('intent=sale&type=office&minPrice=0&maxPrice=5000000&minArea=100&maxArea=200&ref=partner');
    expect(publicAssetFilterIssue(params, 'commercial')).toBeUndefined();
    expect(publicAssetNumber(params, 'minPrice')).toBe(0);
    expect(clearPublicAssetFilters(params).toString()).toBe('ref=partner');
  });
  it('keeps management as an explicit enquiry entrance', () => expect(publicAssetFilterIssue(new URLSearchParams('mode=management'), 'hotel')).toBeUndefined());
  it('does not silently broaden an unknown land intent or type', () => {
    expect(publicAssetFilterIssue(new URLSearchParams('intent=unexpected'), 'land')).toBe('invalid');
    expect(publicAssetFilterIssue(new URLSearchParams('type=office'), 'land')).toBe('invalid');
  });
});
