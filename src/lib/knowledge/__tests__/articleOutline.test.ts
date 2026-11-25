import { describe, expect, it } from 'vitest';
import { extractArticleHeadings, headingAnchorId, readingMinutes } from '../articleOutline';

describe('articleOutline', () => {
  it('extracts only second-level headings in order with unique ids', () => {
    const content = 'Intro\n\n## Who can buy\n\nText\n\n### Detail\n\n## Квота 49%';
    expect(extractArticleHeadings(content)).toEqual([
      { id: 'section-1-who-can-buy', text: 'Who can buy' },
      { id: 'section-2-квота-49', text: 'Квота 49%' },
    ]);
  });

  it('builds an id even when the heading has no letters', () => {
    expect(headingAnchorId('!!!', 0)).toBe('section-1');
  });

  it('estimates reading time, never zero for real text', () => {
    expect(readingMinutes('')).toBe(0);
    expect(readingMinutes('one two three')).toBe(1);
    expect(readingMinutes(Array.from({ length: 1000 }, () => 'w').join(' '))).toBe(5);
  });
});
