/**
 * Unified language configuration for the platform
 * Supports normalization of various input formats to standard codes
 */

export interface LanguageInfo {
  code: string;
  flag: string;
  nameEn: string;
  nameRu: string;
  color: string; // Tailwind color class suffix (e.g., 'blue' for bg-blue-500)
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  en: {
    code: 'en',
    flag: '🇬🇧',
    nameEn: 'English',
    nameRu: 'Английский',
    color: 'blue',
  },
  ru: {
    code: 'ru',
    flag: '🇷🇺',
    nameEn: 'Russian',
    nameRu: 'Русский',
    color: 'red',
  },
  th: {
    code: 'th',
    flag: '🇹🇭',
    nameEn: 'Thai',
    nameRu: 'Тайский',
    color: 'purple',
  },
  zh: {
    code: 'zh',
    flag: '🇨🇳',
    nameEn: 'Chinese',
    nameRu: 'Китайский',
    color: 'amber',
  },
  ko: {
    code: 'ko',
    flag: '🇰🇷',
    nameEn: 'Korean',
    nameRu: 'Корейский',
    color: 'emerald',
  },
  ja: {
    code: 'ja',
    flag: '🇯🇵',
    nameEn: 'Japanese',
    nameRu: 'Японский',
    color: 'pink',
  },
  de: {
    code: 'de',
    flag: '🇩🇪',
    nameEn: 'German',
    nameRu: 'Немецкий',
    color: 'yellow',
  },
  fr: {
    code: 'fr',
    flag: '🇫🇷',
    nameEn: 'French',
    nameRu: 'Французский',
    color: 'indigo',
  },
  es: {
    code: 'es',
    flag: '🇪🇸',
    nameEn: 'Spanish',
    nameRu: 'Испанский',
    color: 'orange',
  },
  it: {
    code: 'it',
    flag: '🇮🇹',
    nameEn: 'Italian',
    nameRu: 'Итальянский',
    color: 'green',
  },
  vi: {
    code: 'vi',
    flag: '🇻🇳',
    nameEn: 'Vietnamese',
    nameRu: 'Вьетнамский',
    color: 'rose',
  },
  hi: {
    code: 'hi',
    flag: '🇮🇳',
    nameEn: 'Hindi',
    nameRu: 'Хинди',
    color: 'orange',
  },
};

// Machine translation indicator
export const MACHINE_TRANSLATION: LanguageInfo = {
  code: 'mt',
  flag: '🤖',
  nameEn: 'Machine Translation',
  nameRu: 'Машинный перевод',
  color: 'gray',
};

// Normalization map for various input formats
const NORMALIZATION_MAP: Record<string, string> = {
  // English variants
  'english': 'en',
  'en': 'en',
  'eng': 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'английский': 'en',
  
  // Russian variants
  'russian': 'ru',
  'ru': 'ru',
  'rus': 'ru',
  'русский': 'ru',
  
  // Thai variants
  'thai': 'th',
  'th': 'th',
  'tha': 'th',
  'тайский': 'th',
  'ไทย': 'th',
  
  // Chinese variants
  'chinese': 'zh',
  'zh': 'zh',
  'zho': 'zh',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  'mandarin': 'zh',
  'китайский': 'zh',
  
  // Korean variants
  'korean': 'ko',
  'ko': 'ko',
  'kor': 'ko',
  'корейский': 'ko',
  
  // Japanese variants
  'japanese': 'ja',
  'ja': 'ja',
  'jpn': 'ja',
  'японский': 'ja',
  
  // German variants
  'german': 'de',
  'de': 'de',
  'deu': 'de',
  'немецкий': 'de',
  
  // French variants
  'french': 'fr',
  'fr': 'fr',
  'fra': 'fr',
  'французский': 'fr',
  
  // Spanish variants
  'spanish': 'es',
  'es': 'es',
  'spa': 'es',
  'испанский': 'es',
  
  // Italian variants
  'italian': 'it',
  'it': 'it',
  'ita': 'it',
  'итальянский': 'it',
  
  // Vietnamese variants
  'vietnamese': 'vi',
  'vi': 'vi',
  'vie': 'vi',
  'вьетнамский': 'vi',
  
  // Hindi variants
  'hindi': 'hi',
  'hi': 'hi',
  'hin': 'hi',
  'хинди': 'hi',
};

/**
 * Normalize a language string to a standard 2-letter code
 */
export function normalizeLanguageCode(input: string): string {
  const normalized = input.toLowerCase().trim();
  return NORMALIZATION_MAP[normalized] || normalized;
}

/**
 * Get language info by code (handles normalization)
 */
export function getLanguageInfo(input: string): LanguageInfo | null {
  const code = normalizeLanguageCode(input);
  return SUPPORTED_LANGUAGES[code] || null;
}

/**
 * Normalize an array of language codes
 */
export function normalizeLanguages(languages: string[]): string[] {
  const seen = new Set<string>();
  return languages
    .map(normalizeLanguageCode)
    .filter(code => {
      if (seen.has(code)) return false;
      seen.add(code);
      return SUPPORTED_LANGUAGES[code] !== undefined;
    });
}

/**
 * Get stored UI language from localStorage (outside of React context).
 * Use this in non-component code (error handlers, hooks with toast messages, etc.)
 * instead of duplicating localStorage reads.
 */
export function getStoredLang(): 'en' | 'ru' {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('myuno-language');
      if (stored === 'ru') return 'ru';
    } catch {}
  }
  return 'en';
}
