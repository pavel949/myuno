/**
 * Copy check — Design Bible Round 4A (H1 "Public text has no banned words",
 * H3 "automatic copy check against banned words and unsourced numbers").
 *
 * Sources:
 *  - docs/canonical/03-tone-of-voice.md §5.4 (forbidden vocabulary)
 *  - docs/canonical/10-semantic-core.md via FORBIDDEN_SYNONYMS
 */
import { FORBIDDEN_SYNONYMS } from '@/content/semantic/forbiddenSynonyms';

/** Tone-of-voice §5.4 plus the EN equivalents used in product copy. */
/* eslint-disable no-restricted-syntax -- this list IS the banned vocabulary the checker detects */
export const TONE_BANNED_TERMS: readonly string[] = [
  'лучший в мире', 'уникальный', 'революционный', 'беспрецедентный',
  'ваш надёжный партнёр', 'индивидуальный подход', 'экосистема возможностей',
  'делаем жизнь проще', 'меняем правила игры', 'спешите', 'только сейчас',
  'не упустите', 'последний шанс', 'всего за 5 минут', 'дорогой клиент',
  'уважаемый пользователь', 'наша команда профессионалов', 'инновационное решение',
  'передовые технологии', 'в ближайшее время',
  'world-class', 'best in class', 'revolutionary', 'unprecedented', 'seamless',
  'game-changing', 'game changer', 'hurry', "don't miss", 'last chance',
  'cutting-edge', 'innovative solution', 'dear customer',
];
/* eslint-enable no-restricted-syntax */

export interface CopyIssue {
  kind: 'banned' | 'synonym' | 'unsourced_number';
  term: string;
  suggestion?: string;
}

const NUMBER_CLAIM = /(\d[\d,.\s]*\s?(%|percent|процент|x\b|×))|(\b(roi|yield|доходност\w*)\b[^.]{0,40}\d)/i;
const SOURCE_MARKER = /(source|источник|according to|по данным|\[\d+\]|https?:\/\/)/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function contains(text: string, term: string): boolean {
  return new RegExp(`(^|[^\\p{L}])${escapeRe(term)}(?=$|[^\\p{L}])`, 'iu').test(text);
}

/** Pure check: returns every issue found in `text` (deduplicated by term). */
export function checkCopy(text: string | null | undefined): CopyIssue[] {
  if (!text?.trim()) return [];
  const issues: CopyIssue[] = [];
  for (const term of TONE_BANNED_TERMS) {
    if (contains(text, term)) issues.push({ kind: 'banned', term });
  }
  for (const rule of FORBIDDEN_SYNONYMS) {
    if (rule.contexts.includes('all') || rule.contexts.includes('commercial')) {
      if (contains(text, rule.forbidden)) issues.push({ kind: 'synonym', term: rule.forbidden, suggestion: rule.canonical });
    }
  }
  // Numeric claims (percentages, multiples, yields) must cite a source in the same text.
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  for (const s of sentences) {
    const m = s.match(NUMBER_CLAIM);
    if (m && !SOURCE_MARKER.test(s)) issues.push({ kind: 'unsourced_number', term: m[0].trim() });
  }
  const seen = new Set<string>();
  return issues.filter((i) => {
    const k = `${i.kind}:${i.term.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
