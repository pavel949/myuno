import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { City, useCities, useCity } from '@/hooks/useCities';

interface LocationContextValue {
  // Current selected city
  currentCity: City | null;
  currentCitySlug: string | null;
  
  // City lists
  cities: City[];
  activeCities: City[];
  comingSoonCities: City[];
  
  // Loading states
  isLoading: boolean;
  isCityLoading: boolean;
  
  // Actions
  setCity: (slug: string) => void;
  
  // Helpers
  getCityName: (lang: 'en' | 'ru' | 'th') => string;
  getCityConfig: () => CityConfig | null;
}

interface CityConfig {
  lat: number;
  lng: number;
  countryCode: string;
  timezone: string;
  currency: string;
  bounds: any | null;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const STORAGE_KEY = 'myuno-user-location';

interface LocationProviderProps {
  children: React.ReactNode;
}

// Read user-saved slug only; do NOT hardcode a default city.
// Resolution waterfall (effect below): saved slug → first active city → null.
function readStoredSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [currentCitySlug, setCurrentCitySlug] = useState<string | null>(readStoredSlug);

  const { cities, activeCities, comingSoonCities, isLoading } = useCities();
  const { city: currentCity, isLoading: isCityLoading } = useCity(currentCitySlug);

  // Auto-pick first active city when nothing is stored.
  // Phase 1: deterministic fallback (sort_order). Phase 2 will add IP/geo detection.
  useEffect(() => {
    if (currentCitySlug || isLoading || activeCities.length === 0) return;
    const firstActive = activeCities[0];
    if (firstActive) {
      setCurrentCitySlug(firstActive.slug);
      localStorage.setItem(STORAGE_KEY, firstActive.slug);
    }
  }, [currentCitySlug, isLoading, activeCities]);

  // Set city and persist to localStorage
  const setCity = useCallback((slug: string) => {
    setCurrentCitySlug(slug);
    localStorage.setItem(STORAGE_KEY, slug);
  }, []);


  // Get localized city name
  const getCityName = useCallback((lang: 'en' | 'ru' | 'th'): string => {
    if (!currentCity) return '';
    
    switch (lang) {
      case 'ru':
        return currentCity.name_ru || currentCity.name_en;
      case 'th':
        return currentCity.name_th || currentCity.name_en;
      default:
        return currentCity.name_en;
    }
  }, [currentCity]);

  // Get city configuration for maps, etc.
  const getCityConfig = useCallback((): CityConfig | null => {
    if (!currentCity) return null;
    
    return {
      lat: Number(currentCity.lat),
      lng: Number(currentCity.lng),
      countryCode: currentCity.country_code,
      timezone: currentCity.timezone,
      currency: currentCity.default_currency,
      bounds: currentCity.mapbox_bounds,
    };
  }, [currentCity]);

  const value = useMemo(() => ({
    currentCity,
    currentCitySlug,
    cities,
    activeCities,
    comingSoonCities,
    isLoading,
    isCityLoading,
    setCity,
    getCityName,
    getCityConfig,
  }), [
    currentCity,
    currentCitySlug,
    cities,
    activeCities,
    comingSoonCities,
    isLoading,
    isCityLoading,
    setCity,
    getCityName,
    getCityConfig,
  ]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
