import { describe, expect, it } from 'vitest';
import { buildExperienceSearchParams } from './HomeExperienceSearch';
describe('buildExperienceSearchParams', () => {
  it('passes query, type and budget to the catalogue', () => {
    expect(buildExperienceSearchParams({ q: ' diving ', type: 'activity', maxPrice: '2500' }).toString()).toBe('q=diving&type=activity&maxPrice=2500');
  });
  it('omits unknown type and negative budget', () => {
    expect(buildExperienceSearchParams({ q: '', type: 'all', maxPrice: '-1' }).toString()).toBe('');
  });
});
