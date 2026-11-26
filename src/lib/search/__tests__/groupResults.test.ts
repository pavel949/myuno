import { describe, expect, it } from 'vitest';
import { groupResultsByType } from '../groupResults';

describe('groupResultsByType', () => {
  it('keeps ranked order of first appearance and counts every result', () => {
    const groups = groupResultsByType(
      [
        { id: '1', type: 'property' },
        { id: '2', type: 'yachts' },
        { id: '3', type: 'property' },
        { id: '4', type: 'property' },
      ],
      2,
    );
    expect(groups.map((g) => g.type)).toEqual(['property', 'yachts']);
    expect(groups[0].total).toBe(3);
    expect(groups[0].items.map((i) => i.id)).toEqual(['1', '3']);
    expect(groups[1].items).toHaveLength(1);
  });

  it('returns no groups for an empty list', () => {
    expect(groupResultsByType([], 3)).toEqual([]);
  });
});
