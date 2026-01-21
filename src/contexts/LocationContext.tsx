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

export function LocationProvider({ children }: LocationProviderProps) {
  const [currentCitySlug, setCurrentCitySlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'phuket';
    }
    return 'phuket';
  });

  const { cities, activeCities, comingSoonCities, isLoading } = useCities();
  const { city: currentCity, isLoading: isCityLoading } = useCity(currentCitySlug);

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
