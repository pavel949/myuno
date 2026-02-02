/**
 * Geographic configuration and default coordinates
 * Centralized location data for maps, geolocation fallbacks, and city defaults
 */

export interface CityCoordinates {
  lat: number;
  lng: number;
}

export interface CityGeography {
  center: CityCoordinates;
  zoom: number;
  bounds?: {
    sw: [number, number]; // Southwest corner [lng, lat]
    ne: [number, number]; // Northeast corner [lng, lat]
  };
  timezone: string;
}

// Default map settings for supported cities
export const CITY_GEOGRAPHY: Record<string, CityGeography> = {
  phuket: {
    center: { lat: 7.8804, lng: 98.3923 },
    zoom: 11,
    bounds: {
      sw: [98.2, 7.7],
      ne: [98.5, 8.2],
    },
    timezone: 'Asia/Bangkok',
  },
  bangkok: {
    center: { lat: 13.7563, lng: 100.5018 },
    zoom: 12,
    bounds: {
      sw: [100.3, 13.5],
      ne: [100.9, 14.0],
    },
    timezone: 'Asia/Bangkok',
  },
  samui: {
    center: { lat: 9.5120, lng: 100.0136 },
    zoom: 12,
    bounds: {
      sw: [99.9, 9.4],
      ne: [100.1, 9.6],
    },
    timezone: 'Asia/Bangkok',
  },
  bali: {
    center: { lat: -8.3405, lng: 115.0920 },
    zoom: 11,
    bounds: {
      sw: [114.4, -8.8],
      ne: [115.7, -8.0],
    },
    timezone: 'Asia/Makassar',
  },
  dubai: {
    center: { lat: 25.2048, lng: 55.2708 },
    zoom: 11,
    bounds: {
      sw: [54.9, 24.8],
      ne: [55.6, 25.4],
    },
    timezone: 'Asia/Dubai',
  },
} as const;

// Default city for the platform (used when no city is selected)
export const DEFAULT_CITY = 'phuket';

// Get default center coordinates
export const getDefaultCenter = (citySlug?: string): CityCoordinates => {
  const city = citySlug && CITY_GEOGRAPHY[citySlug] 
    ? CITY_GEOGRAPHY[citySlug] 
    : CITY_GEOGRAPHY[DEFAULT_CITY];
  return city.center;
};

// Get map center as [lng, lat] tuple for Mapbox
export const getMapCenter = (citySlug?: string): [number, number] => {
  const center = getDefaultCenter(citySlug);
  return [center.lng, center.lat];
};

// Get default zoom level
export const getDefaultZoom = (citySlug?: string): number => {
  const city = citySlug && CITY_GEOGRAPHY[citySlug]
    ? CITY_GEOGRAPHY[citySlug]
    : CITY_GEOGRAPHY[DEFAULT_CITY];
  return city.zoom;
};

// Get city bounds for Mapbox fitBounds
export const getCityBounds = (citySlug?: string): [[number, number], [number, number]] | null => {
  const city = citySlug && CITY_GEOGRAPHY[citySlug]
    ? CITY_GEOGRAPHY[citySlug]
    : CITY_GEOGRAPHY[DEFAULT_CITY];
  
  if (!city.bounds) return null;
  return [city.bounds.sw, city.bounds.ne];
};

// Phuket-specific locations (popular landmarks for geocoding proximity)
export const PHUKET_LANDMARKS = {
  airport: { lat: 8.1132, lng: 98.3169, nameEn: 'Phuket Airport', nameRu: 'Аэропорт Пхукета' },
  central: { lat: 7.8917, lng: 98.3648, nameEn: 'Central Festival', nameRu: 'Централ Фестиваль' },
  patong: { lat: 7.8959, lng: 98.2961, nameEn: 'Patong Beach', nameRu: 'Пляж Патонг' },
  karon: { lat: 7.8468, lng: 98.2947, nameEn: 'Karon Beach', nameRu: 'Пляж Карон' },
  kata: { lat: 7.8201, lng: 98.2981, nameEn: 'Kata Beach', nameRu: 'Пляж Ката' },
  rawai: { lat: 7.7773, lng: 98.3253, nameEn: 'Rawai', nameRu: 'Равай' },
  phuketTown: { lat: 7.8804, lng: 98.3923, nameEn: 'Phuket Town', nameRu: 'Пхукет Таун' },
  chalong: { lat: 7.8432, lng: 98.3424, nameEn: 'Chalong', nameRu: 'Чалонг' },
  bangTao: { lat: 7.9772, lng: 98.2970, nameEn: 'Bang Tao', nameRu: 'Банг Тао' },
} as const;
