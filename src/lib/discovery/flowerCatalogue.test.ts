import { describe, expect, it } from 'vitest';
import { readFlowerFilters, writeFlowerFilters } from './flowerCatalogue';
describe('flower catalogue URL filters', () => {
  it('round trips repeated values including comma-containing terms', () => {
    const values = { occasion: ['birthday', 'a,b'], colorPalette: ['red'], priceLevel: '2' };
    expect(readFlowerFilters(writeFlowerFilters(new URLSearchParams(), values))).toEqual(values);
  });
  it('clear preserves unrelated persona, campaign and search context', () => {
    const next = writeFlowerFilters(new URLSearchParams('persona=tourist&utm_source=test&q=roses&occasion=birthday'), {});
    expect(next.toString()).toBe('persona=tourist&utm_source=test&q=roses');
  });
  it('ignores unsupported controls and deduplicates repeated filters', () => {
    expect(readFlowerFilters(new URLSearchParams('size=M&occasion=birthday&occasion=birthday'))).toEqual({occasion:['birthday']});
  });
});
