import { useCallback } from 'react';
import { getGoogleMapsKey } from '@/lib/googleMaps';

export interface GeocodeResult {
  address: string;
  placeId: string | null;
  lat: number;
  lng: number;
}

const langParam = (language: string) => (language === 'ru' ? 'ru' : 'en');

/**
 * Hook for Google Geocoding.
 * Uses dynamic API key from system_config when available.
 * Falls back to edge function (geocode-address) when no key is set.
 */
export function useGoogleGeocode(language: string = 'en') {
  const lang = langParam(language);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<GeocodeResult | null> => {
      try {
        const key = getGoogleMapsKey();
        if (key) {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}&language=${lang}`
          );
          const data = await res.json();
          if (data.status !== 'OK' || !data.results?.length) return null;
          const r = data.results[0];
          return { address: r.formatted_address, placeId: r.place_id || null, lat, lng };
        }

        // Fallback: use edge function
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode-address?lat=${lat}&lng=${lng}&language=${lang}`;
        const res = await fetch(url, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const data = await res.json();
        if (!data.results?.length) return null;
        return {
          address: data.results[0].address || data.results[0].name,
          placeId: data.results[0].mapbox_id || null,
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
      if (!query.trim()) return [];
      try {
        const key = getGoogleMapsKey();
        if (key) {
          let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}&language=${lang}`;
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
        }

        // Fallback: use edge function
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode-address?query=${encodeURIComponent(query)}&language=${lang}`;
        const res = await fetch(url, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const data = await res.json();
        return (data.results || []).map((r: any) => ({
          address: r.address || r.name,
          placeId: r.mapbox_id || null,
          lat: 0,
          lng: 0,
        }));
      } catch {
        return [];
      }
    },
    [lang]
  );

  return { reverseGeocode, searchAddress };
}
