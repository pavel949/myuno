/**
 * @module LanguageContext
 * @description Provides i18n capabilities with DB-backed translations and realtime updates.
 * 
 * Static translations are imported from src/i18n/ (modular files per language).
 * DB translations override static ones and are cached for 1 hour.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
  // For non-RU languages we must wait for the static dictionary to load
  // before exposing translations, otherwise `t()` falls back to keys.
  const [staticReady, setStaticReady] = useState<boolean>(() => readLanguageFromLocalStorage() === 'ru');

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
    if (lang !== 'ru') setStaticReady(false);
    void loadI18n(lang).then(() => setStaticReady(true));
  }, []);

  // Eagerly load static translations for current language
  useEffect(() => {
    let cancelled = false;
    if (language === 'ru') {
      setStaticReady(true);
      return;
    }
    void loadI18n(language).then(() => {
      if (!cancelled) setStaticReady(true);
    });
    return () => { cancelled = true; };
  }, [language]);

  // Preload the other two dictionaries on idle so the FIRST switch to another
  // language is instant (no dynamic-import lag). RU is bundled eagerly; EN/TH
  // are code-split, so without this the initial toggle would show a brief flash.
  useEffect(() => {
    const preloadOthers = () => {
      void loadI18n('en');
      void loadI18n('th');
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (typeof ric === 'function') {
      const id = ric(preloadOthers, { timeout: 3000 });
      return () => {
        const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
        if (typeof cic === 'function') cic(id);
      };
    }
    const t = setTimeout(preloadOthers, 1500);
    return () => clearTimeout(t);
  }, []);

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
