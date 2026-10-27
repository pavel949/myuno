import { describe, expect, it, vi } from 'vitest';
import { applyProjectCatalogFilters } from '../projectCatalogQuery';

describe('commercial project publication filters', () => {
  it('requires each explicit canonical publication condition without conflating activity and publication', () => {
    const query = { eq: vi.fn() };
    query.eq.mockReturnValue(query);
    applyProjectCatalogFilters(query, { isActive: true, isApproved: true, publicListingEnabled: true });
    expect(query.eq.mock.calls).toEqual([
      ['is_active', true], ['public_listing_enabled', true], ['is_approved', true],
    ]);
  });
  it('does not silently change other inventory consumers', () => {
    const query = { eq: vi.fn() };
    query.eq.mockReturnValue(query);
    applyProjectCatalogFilters(query, { isActive: true });
    expect(query.eq.mock.calls).toEqual([['is_active', true]]);
  });
});
