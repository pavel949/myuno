import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { fetchGoogleMapsKey, getGoogleMapsKey } from '@/lib/googleMaps';

const LIBRARIES: ('places')[] = ['places'];

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
function GoogleMapsLoader({ apiKey, children }: { apiKey: string; children: React.ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  const value = useMemo<GoogleMapsContextValue>(
    () => ({
      isLoaded,
      loadError: loadError ?? undefined,
      hasKey: true,
      apiKey,
      apiAvailable: isLoaded && !loadError,
    }),
    [isLoaded, loadError, apiKey]
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

  return <GoogleMapsLoader apiKey={apiKey}>{children}</GoogleMapsLoader>;
}

export function useGoogleMaps() {
  const ctx = useContext(GoogleMapsContext);
  if (!ctx) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return ctx;
}
