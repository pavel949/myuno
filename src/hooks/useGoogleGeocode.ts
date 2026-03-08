import { useCallback } from 'react';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleMaps';

export interface GeocodeResult {
  address: string;
  placeId: string | null;
  lat: number;
  lng: number;
}

const langParam = (language: string) => (language === 'ru' ? 'ru' : 'en');

export function useGoogleGeocode(language: string = 'en') {
  const lang = langParam(language);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<GeocodeResult | null> => {
      if (!GOOGLE_MAPS_API_KEY) return null;
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=${lang}`
        );
        const data = await res.json();
        if (data.status !== 'OK' || !data.results?.length) return null;
        const r = data.results[0];
        return {
          address: r.formatted_address,
          placeId: r.place_id || null,
          lat,
          lng,
        };
      } catch {
        return null;
      }
    },
    [lang]
  );

  const searchAddress = useCallback(
    async (
      query: string,
      options?: { proximity?: { lat: number; lng: number }; country?: string }
    ): Promise<GeocodeResult[]> => {
      if (!GOOGLE_MAPS_API_KEY || !query.trim()) return [];
      try {
        let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=${lang}`;
        if (options?.country) url += `&region=${options.country}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
        return (data.results || []).slice(0, 8).map((r: { formatted_address: string; place_id?: string; geometry: { location: { lat: number; lng: number } } }) => ({
          address: r.formatted_address,
          placeId: r.place_id || null,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
      } catch {
        return [];
      }
    },
    [lang]
  );

  return { reverseGeocode, searchAddress };
}
