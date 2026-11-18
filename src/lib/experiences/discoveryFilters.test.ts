import { describe, expect, it } from 'vitest';
import { matchesExperienceFilters, readExperienceFilters } from './discoveryFilters';

const row = { price: 200, currency: 'THB', duration_minutes: 120 };
const filters = (query: string) => readExperienceFilters(new URLSearchParams(query));
describe('recorded experience discovery filters', () => {
  it('keeps missing attributes when no corresponding filter is selected', () => {
    expect(matchesExperienceFilters({ price: null, currency: '', duration_minutes: null }, filters(''))).toBe(true);
  });
  it.each(['minPrice=-1', 'maxPrice=NaN', 'minPrice=300&maxPrice=100', 'minPrice=', 'maxPrice=Infinity', 'duration=tomorrow'])('rejects malformed conditions: %s', query => {
    expect(filters(query).invalid).toBe(true);
    expect(matchesExperienceFilters(row, filters(query))).toBe(false);
  });
  it('compares inclusive recorded THB prices and preserves zero and fractional prices', () => {
    expect(matchesExperienceFilters(row, filters('minPrice=200&maxPrice=200'))).toBe(true);
    expect(matchesExperienceFilters({ ...row, price: 0 }, filters('maxPrice=0'))).toBe(true);
    expect(matchesExperienceFilters({ ...row, price: 0.29 }, filters('minPrice=0.29&maxPrice=0.29'))).toBe(true);
    expect(matchesExperienceFilters({ ...row, currency: 'USD' }, filters('maxPrice=300'))).toBe(false);
    expect(matchesExperienceFilters({ ...row, price: null }, filters('maxPrice=300'))).toBe(false);
  });
  it('partitions duration boundaries without inferring unknown durations', () => {
    for (const [duration, minutes, expected] of [['short', 120, true], ['short', 121, false], ['half-day', 120, false], ['half-day', 360, true], ['full-day', 360, false], ['full-day', 361, true]] as const) {
      expect(matchesExperienceFilters({ ...row, duration_minutes: minutes }, filters(`duration=${duration}`))).toBe(expected);
    }
    expect(matchesExperienceFilters({ ...row, duration_minutes: null }, filters('duration=short'))).toBe(false);
  });
});
