import { describe, it, expect } from 'vitest';
import { rankRelatedProperties, allowedRecommendationIds } from './relatedProperties';
describe('related catalogue ranking', () => {
  const source = { id: 'source', district: 'Bang Tao', property_type: 'apartment', price_per_night: 2000 };
  const pool = [
    { id: 'fallback', listing_type: 'rent', property_type: 'apartment', price_per_night: 2400 },
    { id: 'area', listing_type: 'rent', district: 'Bang Tao' },
    { id: 'source', listing_type: 'rent' },
    { id: 'sale', listing_type: 'sale' },
    { id: 'unknown', price_per_night: 2000 },
  ];
  it('ranks the area then comparable type/price, excluding current and unsupported offers', () => {
    expect(rankRelatedProperties(pool, source, 'rent').map(p => p.id)).toEqual(['area', 'fallback']);
  });
  it('keeps sale offers separate from rental offers', () => {
    expect(rankRelatedProperties(pool, source, 'buy').map(p => p.id)).toEqual(['sale']);
  });
  it('rejects invented AI IDs, source IDs and duplicates', () => {
    expect(allowedRecommendationIds(['area', 'invented', 'source', 'area', 'fallback'], pool, 'source')).toEqual(['area', 'fallback']);
    expect(allowedRecommendationIds({ ids: ['area'] }, pool, 'source')).toEqual([]);
  });
});