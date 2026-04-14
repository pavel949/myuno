/**
 * @module i18n
 * @description Centralized translation exports
 *
 * Static translations split by language for maintainability.
 * LanguageContext imports from here instead of inlining 1300+ lines.
 *
 * Default language (ru) is loaded eagerly; others are lazy-loaded on demand
 * to reduce initial bundle size (~60KB savings).
 */
import { ru } from './ru';

export type Language = 'ru' | 'en' | 'th';

// Default language loaded eagerly; others loaded on first use
const translationCache: Partial<Record<Language, Record<string, string>>> = { ru };

const loaders: Record<Language, () => Promise<{ default?: Record<string, string> } & Record<string, unknown>>> = {
  ru: () => Promise.resolve({ ru }),
  en: () => import('./en'),
  th: () => import('./th'),
};

/**
 * Load translations for a language. Returns cached data if already loaded.
 * Falls back to 'ru' if load fails.
 */
export async function loadTranslations(lang: Language): Promise<Record<string, string>> {
  if (translationCache[lang]) return translationCache[lang]!;
  try {
    const mod = await loaders[lang]();
    const data = (mod as Record<string, Record<string, string>>)[lang] ?? mod.default ?? {};
    translationCache[lang] = data;
    return data;
  } catch {
    return translationCache.ru ?? {};
  }
}

/**
 * Synchronous access to already-loaded translations.
 * Returns empty object if language hasn't been loaded yet.
 */
export function getTranslations(lang: Language): Record<string, string> {
  return translationCache[lang] ?? translationCache.ru ?? {};
}

/** @deprecated Use loadTranslations() for lazy loading. Kept for backward compat. */
export const translations: Record<Language, Record<string, string>> = new Proxy(
  {} as Record<Language, Record<string, string>>,
  {
    get(_target, prop: string) {
      return translationCache[prop as Language] ?? {};
    },
  },
);
