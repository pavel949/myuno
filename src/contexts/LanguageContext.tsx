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

const isValidLanguage = (value: string | null | undefined): value is Language =>
  value === 'ru' || value === 'en' || value === 'th';

const normalizeLanguage = (value: string | null): Language => {
  if (isValidLanguage(value)) return value;
  return 'ru';
};

function readLanguageFromLocalStorage(): Language {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_LS_KEY));
  } catch {
    return 'ru';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readLanguageFromLocalStorage());
  const [customTranslations, setCustomTranslations] = useState<CachedTranslations>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  const setLanguage = useCallback((lang: Language) => {
    // Persist and update state immediately to avoid language flicker on fast navigation.
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_LS_KEY, lang);
    } catch {
      // Private mode / quota — UI language still updates for this session.
    }
    void loadI18n(lang);
  }, []);

  // Eagerly load static translations for current language
  useEffect(() => {
    loadI18n(language);
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
      if (!success) return;
      // Only subscribe to realtime changes after initial load succeeds
      channel = supabase
        .channel('translations_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'translations' },
          () => {
            // Invalidate cache and reload
            localStorage.removeItem(TRANSLATIONS_CACHE_KEY);
            localStorage.removeItem(TRANSLATIONS_CACHE_TIMESTAMP);
            loadTranslations();
          }
        )
        .subscribe();
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
    // Priority: DB translations -> static translations -> fallback to English -> key
    const custom = customTranslations[key];
    if (custom) {
      const value = custom[language];
      if (value) return value;
    }
    return getTranslations(language)[key] || getTranslations('en')[key] || key;
  }, [language, customTranslations]);

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
