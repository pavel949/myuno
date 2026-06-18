import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { fetchGoogleMapsKey, getGoogleMapsKey } from '@/lib/googleMaps';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

const LIBRARIES: ('places')[] = ['places'];

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
}

const GoogleMapsContext = createContext<GoogleMapsContextValue | null>(null);

/** Inner provider that runs useJsApiLoader once key is available. */
function GoogleMapsLoader({
  apiKey,
  language,
  onLanguageFallback,
  children,
}: {
  apiKey: string;
  language: string;
  onLanguageFallback: () => void;
  children: React.ReactNode;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
    language,
    region: MAPS_REGION,
    // Re-mount loader if language changes (Google Maps script can't be re-localized at runtime)
    id: `gmaps-${language}`,
  });

  // Detect Google Maps auth failures (RefererNotAllowedMapError, InvalidKeyMapError, etc.)
  // These happen AFTER the script loads and aren't caught by useJsApiLoader's loadError.
  const [authError, setAuthError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    // Google Maps calls window.gm_authFailure when the API key is rejected
    (window as unknown as Record<string, unknown>).gm_authFailure = () => {
      setAuthError(new Error('Google Maps auth failed: check API key restrictions (HTTP referrers) in Google Cloud Console'));
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).gm_authFailure;
    };
  }, []);

  const effectiveError = loadError ?? authError;

  // Fallback: if the script failed to load with a non-English locale, retry once with `en`.
  // Auth failures (gm_authFailure) are NOT a localization issue — don't retry those.
  useEffect(() => {
    if (loadError && language !== 'en') {
      logger.warn(`[GoogleMaps] Failed to load with language="${language}", falling back to "en"`, loadError);
      onLanguageFallback();
    }
  }, [loadError, language, onLanguageFallback]);

  const value = useMemo<GoogleMapsContextValue>(
    () => ({
      isLoaded,
      loadError: effectiveError,
      hasKey: true,
      apiKey,
      apiAvailable: isLoaded && !effectiveError,
    }),
    [isLoaded, effectiveError, apiKey]
  );

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

const noKeyValue: GoogleMapsContextValue = {
  isLoaded: false,
  loadError: new Error('Google Maps API key not available'),
  hasKey: false,
  apiKey: null,
  apiAvailable: false,
};

const loadingValue: GoogleMapsContextValue = {
  isLoaded: false,
  loadError: undefined,
  hasKey: false,
  apiKey: null,
  apiAvailable: false,
};

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const { language: appLang } = useLanguage();
  const requestedLanguage = resolveMapsLanguage(appLang);
  const [forceFallbackLang, setForceFallbackLang] = useState(false);
  const mapsLanguage = forceFallbackLang ? 'en' : requestedLanguage;

  // Reset fallback if the user changes app language (give the new language a fresh try)
  useEffect(() => {
    setForceFallbackLang(false);
  }, [requestedLanguage]);

  const handleLanguageFallback = React.useCallback(() => {
    setForceFallbackLang(true);
  }, []);

  const [apiKey, setApiKey] = useState<string | null>(getGoogleMapsKey());
  const [fetched, setFetched] = useState(!!apiKey);

  useEffect(() => {
    if (apiKey) return;
    let cancelled = false;
    fetchGoogleMapsKey().then((key) => {
      if (!cancelled) {
        setApiKey(key);
        setFetched(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setFetched(true); // Allow fallback to noKeyValue state
      }
    });
    return () => { cancelled = true; };
  }, [apiKey]);

  // Still fetching
  if (!fetched) {
    return (
      <GoogleMapsContext.Provider value={loadingValue}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  // No key found
  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={noKeyValue}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <GoogleMapsLoader apiKey={apiKey} language={mapsLanguage} onLanguageFallback={handleLanguageFallback}>
      {children}
    </GoogleMapsLoader>
  );
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
