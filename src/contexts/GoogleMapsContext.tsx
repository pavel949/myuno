import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Loader, type Libraries } from '@googlemaps/js-api-loader';
import { fetchGoogleMapsKey, getGoogleMapsKey } from '@/lib/googleMaps';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

const LIBRARIES: Libraries = ['places'];

/**
 * Force Google Maps UI language (labels, controls, copyright).
 * Without this, Google falls back to the user's browser locale or the IP region —
 * which on Phuket means Thai. We pin to the app language (RU/EN).
 */
function resolveMapsLanguage(appLang: string): string {
  return appLang === 'ru' ? 'ru' : 'en';
}

/** Region biases place results & defaults (e.g. spelling). 'TH' = Thailand. */
const MAPS_REGION = 'TH';

export interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
  hasKey: boolean;
  apiKey: string | null;
  /** True when key is set, script loaded successfully, and no load error (API is usable). */
  apiAvailable: boolean;
  /** Current locale used for Maps UI labels/controls. */
  language: string;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue | null>(null);

/**
 * Fully tear down the previous Google Maps script so we can re-load it with
 * a different locale. The Google Maps JS API cannot be re-localized at runtime,
 * and `@googlemaps/js-api-loader` enforces "Loader must not be called again with
 * different options" via a static singleton — we must reset both.
 */
function teardownGoogleMaps() {
  // 1. Remove every injected <script> that points at maps.googleapis.com.
  document
    .querySelectorAll('script[src*="maps.googleapis.com"], script[src*="maps.gstatic.com"]')
    .forEach((node) => node.parentNode?.removeChild(node));

  // 2. Drop the global namespace so the next loader actually re-initialises.
  const w = window as unknown as Record<string, unknown>;
  try {
    delete w.google;
  } catch {
    w.google = undefined;
  }
  // Loader uses this callback name internally; clear it so a stale one doesn't fire.
  delete w.__googleMapsCallback__;

  // 3. Reset the Loader singleton — private field, accessed via cast.
  (Loader as unknown as { instance?: Loader }).instance = undefined;
}

function loadGoogleMaps(opts: {
  apiKey: string;
  language: string;
  region: string;
}): Promise<void> {
  const loader = new Loader({
    apiKey: opts.apiKey,
    version: 'weekly',
    libraries: LIBRARIES,
    language: opts.language,
    region: opts.region,
    authReferrerPolicy: 'origin',
  });
  return loader.load().then(() => undefined);
}

const noKeyValue: GoogleMapsContextValue = {
  isLoaded: false,
  loadError: new Error('Google Maps API key not available'),
  hasKey: false,
  apiKey: null,
  apiAvailable: false,
  language: 'en',
};

const loadingValue: GoogleMapsContextValue = {
  isLoaded: false,
  loadError: undefined,
  hasKey: false,
  apiKey: null,
  apiAvailable: false,
  language: 'en',
};

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const { language: appLang } = useLanguage();
  const requestedLanguage = resolveMapsLanguage(appLang);

  const [apiKey, setApiKey] = useState<string | null>(getGoogleMapsKey());
  const [fetched, setFetched] = useState(!!apiKey);

  useEffect(() => {
    if (apiKey) return;
    let cancelled = false;
    fetchGoogleMapsKey()
      .then((key) => {
        if (cancelled) return;
        setApiKey(key);
        setFetched(true);
      })
      .catch(() => {
        if (!cancelled) setFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Active locale that Maps was last loaded with (drives re-init).
  const [activeLanguage, setActiveLanguage] = useState(requestedLanguage);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);
  const [authError, setAuthError] = useState<Error | undefined>(undefined);
  // Fallback to 'en' once if the requested locale fails to load.
  const triedFallbackRef = useRef(false);

  // Re-load the script whenever the requested language changes.
  useEffect(() => {
    if (activeLanguage === requestedLanguage) return;
    // Light reset: trigger the load effect below by switching activeLanguage.
    setActiveLanguage(requestedLanguage);
  }, [requestedLanguage, activeLanguage]);

  // Capture Google Maps auth failures (RefererNotAllowedMapError, InvalidKeyMapError, etc.)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).gm_authFailure = () => {
      setAuthError(
        new Error(
          'Google Maps auth failed: check API key restrictions (HTTP referrers) in Google Cloud Console',
        ),
      );
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).gm_authFailure;
    };
  }, []);

  // Main load / re-load effect.
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    // If google is already on window AND it's the same locale, nothing to do.
    const w = window as unknown as { google?: { maps?: { __myunoLang?: string } } };
    if (w.google?.maps && w.google.maps.__myunoLang === activeLanguage) {
      setIsLoaded(true);
      setLoadError(undefined);
      return;
    }

    // Otherwise tear down any previous script before re-initialising.
    if (w.google?.maps) {
      teardownGoogleMaps();
    }
    setIsLoaded(false);
    setLoadError(undefined);

    loadGoogleMaps({ apiKey, language: activeLanguage, region: MAPS_REGION })
      .then(() => {
        if (cancelled) return;
        // Stamp the locale on the namespace so we can detect drift.
        const gm = (window as unknown as { google?: { maps?: Record<string, unknown> } }).google?.maps;
        if (gm) gm.__myunoLang = activeLanguage;
        setIsLoaded(true);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        logger.warn(`[GoogleMaps] Failed to load with language="${activeLanguage}"`, err);
        if (!triedFallbackRef.current && activeLanguage !== 'en') {
          triedFallbackRef.current = true;
          teardownGoogleMaps();
          setActiveLanguage('en');
          return;
        }
        setLoadError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, activeLanguage]);

  const effectiveError = loadError ?? authError;

  const value = useMemo<GoogleMapsContextValue>(
    () => ({
      isLoaded,
      loadError: effectiveError,
      hasKey: !!apiKey,
      apiKey,
      apiAvailable: isLoaded && !effectiveError,
      language: activeLanguage,
    }),
    [isLoaded, effectiveError, apiKey, activeLanguage],
  );

  if (!fetched) {
    return (
      <GoogleMapsContext.Provider value={loadingValue}>{children}</GoogleMapsContext.Provider>
    );
  }
  if (!apiKey) {
    return <GoogleMapsContext.Provider value={noKeyValue}>{children}</GoogleMapsContext.Provider>;
  }

  return <GoogleMapsContext.Provider value={value}>{children}</GoogleMapsContext.Provider>;
}

export function useGoogleMaps() {
  const ctx = useContext(GoogleMapsContext);
  // GoogleMapsProvider lives in DeferredProviders (one paint after first
  // render) so any component that calls this hook before the gate flips
  // would otherwise crash its subtree. Return a stable "no key / not
  // loaded" fallback instead — matches the contract in App.tsx that
  // every deferred provider's hook handles the undefined-context case.
  return ctx ?? noKeyValue;
}
