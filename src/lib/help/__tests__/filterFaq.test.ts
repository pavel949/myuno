import { describe, expect, it } from 'vitest';
import { filterFaqCategories } from '../filterFaq';

const categories = [
  { title: 'General', items: [{ q: 'What is myUNO?', a: 'A platform in Phuket.' }] },
  { title: 'Payments', items: [{ q: 'How do refunds work?', a: 'Refund rules depend on the service.' }] },
];

describe('filterFaqCategories', () => {
  it('returns every category for an empty query', () => {
    expect(filterFaqCategories(categories, '  ')).toHaveLength(2);
  });

  it('matches all terms across question and answer, case-insensitively', () => {
    const result = filterFaqCategories(categories, 'REFUND service');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Payments');
  });

  it('drops categories without matches', () => {
    expect(filterFaqCategories(categories, 'yacht')).toEqual([]);
  });
});
