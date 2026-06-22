/**
 * pickLang — resolve a localized literal object against the active UI language.
 *
 * Use for inline `{ ru, en, th }` label maps that live in component/data files
 * (as opposed to the central i18n dictionaries resolved via `t()`).
 *
 * Fallback order: requested language → English → Russian. This guarantees the
 * UI never renders `undefined` for a language whose string is missing (e.g. a
 * Thai string not yet written), degrading to English instead of a blank node.
 */
import type { Language } from '@/i18n';

export type LangMap<T = string> = { ru: T; en: T; th?: T };

export function pickLang<T>(map: LangMap<T>, lang: Language): T {
  return (map[lang] ?? map.en ?? map.ru) as T;
}
