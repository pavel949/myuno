/**
 * pickLocalized — locale resolver for DB records with localized columns
 * (title_th/title_en/title_ru, name_th/name_en/name_ru, etc).
 *
 * Fallback order: requested language → en → ru → first non-empty.
 *
 * Examples:
 *   pickLocalized(situation, 'th', 'title')      // title_th, then title_en, then title_ru
 *   pickLocalized(category, 'th', 'name')        // name_th, then name_en, then name_ru
 */
export type Lang = 'ru' | 'en' | 'th';

type LocalizedRecord = Record<string, unknown> | object;

const ORDER: Record<Lang, Lang[]> = {
  th: ['th', 'en', 'ru'],
  en: ['en', 'ru', 'th'],
  ru: ['ru', 'en', 'th'],
};

export function pickLocalized(
  record: LocalizedRecord | null | undefined,
  lang: Lang | string | undefined,
  base: 'title' | 'name' | 'description' = 'name'
): string {
  if (!record) return '';
  const rec = record as Record<string, unknown>;
  const norm: Lang = lang === 'th' || lang === 'en' || lang === 'ru' ? lang : 'en';
  for (const l of ORDER[norm]) {
    const v = rec[base + '_' + l];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  for (const k of [base + '_en', base + '_ru', base + '_th']) {
    const v = rec[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}
