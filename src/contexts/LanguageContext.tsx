/**
 * @module LanguageContext
 * @description Provides i18n capabilities with DB-backed translations and realtime updates.
 * 
 * Static translations are imported from src/i18n/ (modular files per language).
 * DB translations override static ones and are cached for 1 hour.
 */
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTranslations, loadTranslations as loadI18n, type Language } from '@/i18n';
import { STORAGE_KEYS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export type { Language };

/** True if the current language was set explicitly by the user (UI switcher). */
export function hasExplicitLanguagePreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE_EXPLICIT) === '1';
  } catch {
    return false;
  }
}

/** Mark the current language as explicitly chosen (e.g. after writing to profile). */
export function markLanguageExplicit(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE_EXPLICIT, '1');
  } catch {
    /* private mode */
  }
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoadingTranslations: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cache key and duration
const TRANSLATIONS_CACHE_KEY = 'myuno-translations-cache';
const TRANSLATIONS_CACHE_TIMESTAMP = 'myuno-translations-timestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface CachedTranslations {
  [key: string]: { ru: string; en: string; th: string | null };
}

const LANGUAGE_LS_KEY = STORAGE_KEYS.LANGUAGE;
const LANGUAGE_EXPLICIT_LS_KEY = STORAGE_KEYS.LANGUAGE_EXPLICIT;

const isValidLanguage = (value: string | null | undefined): value is Language =>
  value === 'ru' || value === 'en' || value === 'th';

/**
 * Has the static dictionary for `lang` already been loaded into the cache?
 * RU is bundled eagerly; EN/TH are lazy chunks. We use this to decide whether
 * `t()` would resolve real strings or only fallbacks for a given language.
 */
const isDictionaryReady = (lang: Language): boolean =>
  lang === 'ru' || Object.keys(getTranslations(lang)).length > 0;

/**
 * Detect a sensible default language for first-time visitors:
 *   1) explicit choice stored in localStorage wins,
 *   2) otherwise look at navigator.languages (browser preference order),
 *   3) fall back to Russian (исторический дефолт платформы).
 * The detected language is persisted so subsequent visits skip detection.
 */
function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_LS_KEY);
    if (isValidLanguage(stored)) return stored;
  } catch {
    /* private mode */
  }
  let detected: Language = 'ru';
  try {
    const candidates: readonly string[] =
      typeof navigator !== 'undefined' && Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : typeof navigator !== 'undefined' && navigator.language
          ? [navigator.language]
          : [];
    let matched = false;
    for (const raw of candidates) {
      const tag = raw.toLowerCase().split('-')[0];
      if (tag === 'ru') { detected = 'ru'; matched = true; break; }
      if (tag === 'th') { detected = 'th'; matched = true; break; }
      if (tag === 'en') { detected = 'en'; matched = true; break; }
    }
    // Anything else (es/fr/de/zh/…) → English is the safer international default.
    if (!matched && candidates.length > 0) detected = 'en';
  } catch {
    /* SSR / restricted env */
  }
  // Persist detection result so subsequent loads don't re-detect (locks the
  // language to whatever we showed the user on their first visit).
  try {
    localStorage.setItem(LANGUAGE_LS_KEY, detected);
  } catch {
    /* private mode */
  }
  return detected;
}

function readLanguageFromLocalStorage(): Language {
  return detectInitialLanguage();
}

function readExplicitFlag(): boolean {
  try {
    return localStorage.getItem(LANGUAGE_EXPLICIT_LS_KEY) === '1';
  } catch {
    return false;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readLanguageFromLocalStorage());
  const [customTranslations, setCustomTranslations] = useState<CachedTranslations>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);
  // True once the static dictionary for the *current* language is loaded.
  // RU is bundled eagerly, so it starts ready; EN/TH are lazy chunks.
  // `staticReady` also doubles as a re-render trigger so consumers update the
  // moment a lazily-loaded dictionary becomes available.
  const [staticReady, setStaticReady] = useState<boolean>(() =>
    isDictionaryReady(readLanguageFromLocalStorage()),
  );
  // Whether we have ever reached a ready state. Used to gate the *initial*
  // render only — once the app has painted once, a subsequent language switch
  // must never unmount the whole tree (it would drop scroll/form state).
  const hasRenderedReady = useRef<boolean>(staticReady);
  if (staticReady) hasRenderedReady.current = true;

  const setLanguage = useCallback((lang: Language) => {
    // Persist and update state immediately to avoid language flicker on fast navigation.
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_LS_KEY, lang);
      // Mark as an explicit user choice — profile hydration must not override it.
      localStorage.setItem(LANGUAGE_EXPLICIT_LS_KEY, '1');
    } catch {
      // Private mode / quota — UI language still updates for this session.
    }
    if (isDictionaryReady(lang)) {
      setStaticReady(true);
    } else {
      // Dictionary not loaded yet — mark not-ready so `t()` is recomputed once
      // the chunk resolves. The tree is NOT blanked because hasRenderedReady
      // is already true (initial paint happened); strings fall back briefly.
      setStaticReady(false);
      void loadI18n(lang).then(() => setStaticReady(true));
    }
  }, []);

  // Eagerly load static translations for current language
  useEffect(() => {
    let cancelled = false;
    if (isDictionaryReady(language)) {
      setStaticReady(true);
      return;
    }
    void loadI18n(language).then(() => {
      if (!cancelled) setStaticReady(true);
    });
    return () => { cancelled = true; };
  }, [language]);

  // Load translations from DB with caching
  useEffect(() => {
    let cancelled = false;

    const loadTranslations = async (): Promise<boolean> => {
      // Check cache first
      const cachedTimestamp = localStorage.getItem(TRANSLATIONS_CACHE_TIMESTAMP);
      const cachedData = localStorage.getItem(TRANSLATIONS_CACHE_KEY);
      
      if (cachedTimestamp && cachedData) {
        const timestamp = parseInt(cachedTimestamp, 10);
        if (Date.now() - timestamp < CACHE_DURATION) {
          try {
            setCustomTranslations(JSON.parse(cachedData));
            setIsLoadingTranslations(false);
            return true;
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
      }

      try {
        const { data, error } = await supabase
          .from('translations')
          .select('key, value_ru, value_en, value_th');

        if (error) throw error;

        const map: CachedTranslations = {};
        data?.forEach(row => {
          map[row.key] = {
            ru: row.value_ru,
            en: row.value_en,
            th: row.value_th,
          };
        });

        if (!cancelled) setCustomTranslations(map);

        // Cache the results
        localStorage.setItem(TRANSLATIONS_CACHE_KEY, JSON.stringify(map));
        localStorage.setItem(TRANSLATIONS_CACHE_TIMESTAMP, Date.now().toString());
        return true;
      } catch (err) {
        logger.warn('Failed to load translations from DB', { err });
        // Fallback to static translations (already in the component)
        return false;
      } finally {
        setIsLoadingTranslations(false);
      }
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;

    loadTranslations().then((success) => {
      if (!success || cancelled) return;
      // Use a unique channel name per mount — reusing the same topic across
      // React StrictMode double-mounts returns the already-subscribed channel,
      // which rejects further `.on('postgres_changes', ...)` calls.
      const topic = `translations_realtime_${Math.random().toString(36).slice(2, 10)}`;
      const ch = supabase.channel(topic);
      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'translations' },
        () => {
          localStorage.removeItem(TRANSLATIONS_CACHE_KEY);
          localStorage.removeItem(TRANSLATIONS_CACHE_TIMESTAMP);
          loadTranslations();
        }
      ).subscribe();
      channel = ch;
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_LS_KEY) return;
      // Another tab cleared the key or wrote garbage — do not reset to default `ru`.
      if (!isValidLanguage(event.newValue)) return;
      setLanguageState(event.newValue);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = useCallback((key: string): string => {
    // Priority: DB translations -> static(lang) -> static(en) -> static(ru) -> key.
    // RU is kept as the final static fallback (instead of returning the raw key)
    // because most missing translations are EN/TH gaps and showing a Russian
    // string degrades better than a dotted.key.path for end users.
    const custom = customTranslations[key];
    if (custom) {
      const value = custom[language];
      if (value) return value;
    }
    return (
      getTranslations(language)[key] ||
      getTranslations('en')[key] ||
      getTranslations('ru')[key] ||
      key
    );
  }, [language, customTranslations, staticReady]);

  const value = useMemo(() => ({
    language, setLanguage, t, isLoadingTranslations,
  }), [language, setLanguage, t, isLoadingTranslations]);

  // Initial-load gate: if the first language we show is a non-RU language whose
  // dictionary has not loaded yet, hold the very first paint for the lazy chunk
  // (a microtask, since the import is already in flight) so the user never sees
  // a flash of Russian/keys. This only applies before the first ready render —
  // later switches keep the tree mounted (see hasRenderedReady).
  if (!staticReady && !hasRenderedReady.current) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
