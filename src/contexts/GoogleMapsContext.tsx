import React, { createContext, useContext, useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, hasGoogleMapsKey } from '@/lib/googleMaps';

const LIBRARIES: ('places')[] = ['places'];

const NO_KEY_ERROR = new Error('VITE_GOOGLE_MAPS_API_KEY is not set');

interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
  hasKey: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue | null>(null);

const noKeyValue: GoogleMapsContextValue = {
  isLoaded: false,
  loadError: NO_KEY_ERROR,
  hasKey: false,
};

/** Inner provider that runs useJsApiLoader only when key is present. */
function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  const value = useMemo<GoogleMapsContextValue>(
    () => ({
      isLoaded,
      loadError: loadError ?? undefined,
      hasKey: true,
    }),
    [isLoaded, loadError]
  );

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const hasKey = hasGoogleMapsKey();

  if (!hasKey) {
    return (
      <GoogleMapsContext.Provider value={noKeyValue}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return <GoogleMapsLoader>{children}</GoogleMapsLoader>;
}

export function useGoogleMaps() {
  const ctx = useContext(GoogleMapsContext);
  if (!ctx) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return ctx;
}
