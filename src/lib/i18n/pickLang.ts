/**
 * @module lib/i18n/pickLang
 * @description Tri-lingual string selector — the migration primitive that replaces
 * binary `isRu ? ru : en` ternaries scattered across the app.
 *
 * Those binary branches silently collapse Thai into the English (else) branch, which
 * is the dominant reason Thai users see English on screens that "should" be translated.
 * `pickLang` makes the fallback explicit and Thai-safe: `th → en → ru`, so a Thai user
 * never silently gets the wrong language and there is a single place to evolve policy.
 *
 * Prefer a real translation-key lookup via `t(...)` (backed by `src/i18n/{ru,en,th}.ts`) when
 * the string is reusable. Use `pickLang` for local, one-off, or co-located strings during migration.
 *
 * @example
 *   const { language } = useLanguage();
 *   <button>{pickLang(language, { ru: 'Бронировать', en: 'Book', th: 'จองเลย' })}</button>
 */
import type { Language } from '@/i18n';

export interface LangValues {
  ru: string;
  en: string;
  /** Optional — falls back to `en` then `ru` when absent. */
  th?: string;
}

/**
 * Pick the string for the active language with a Thai-safe fallback chain.
 *   th → th ?? en ?? ru
 *   en → en ?? ru
 *   ru → ru
 */
export function pickLang(lang: Language, values: LangValues): string {
  if (lang === 'th') return values.th ?? values.en ?? values.ru;
  if (lang === 'en') return values.en ?? values.ru;
  return values.ru;
}
