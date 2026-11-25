/**
 * Outline helpers for knowledge articles (Design Bible K1): a table of
 * contents built from "## " headings and an honest reading-time estimate.
 */
export interface ArticleHeading {
  id: string;
  text: string;
}

/** Stable, URL-safe anchor id. Keeps Cyrillic/Thai letters, drops punctuation. */
export function headingAnchorId(text: string, index: number): string {
  const slug = text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return `section-${index + 1}${slug ? `-${slug}` : ''}`;
}

/** Second-level headings in document order; paragraphs are split on blank lines. */
export function extractArticleHeadings(content: string): ArticleHeading[] {
  if (!content) return [];
  return content
    .split('\n\n')
    .filter((paragraph) => paragraph.startsWith('## '))
    .map((paragraph, index) => {
      const text = paragraph.replace('## ', '').trim();
      return { id: headingAnchorId(text, index), text };
    });
}

const WORDS_PER_MINUTE = 200;

export function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
