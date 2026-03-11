import { useCallback, useRef } from 'react';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';

export interface GeocodeResult {
  address: string;
  placeId: string | null;
  lat: number;
  lng: number;
}

/**
 * Uses the Geocoder from the Maps JavaScript API (loaded by GoogleMapsProvider).
 * This avoids CORS issues that occur when calling the Geocoding REST API from the browser.
 */
export function useGoogleGeocode(language: string = 'en') {
  const { isLoaded } = useGoogleMaps();
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const getGeocoder = useCallback((): google.maps.Geocoder | null => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps?.Geocoder) return null;
    if (!geocoderRef.current) geocoderRef.current = new window.google.maps.Geocoder();
    return geocoderRef.current;
  }, [isLoaded]);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<GeocodeResult | null> => {
      const geocoder = getGeocoder();
      if (!geocoder) return null;
      return new Promise((resolve) => {
        geocoder.geocode(
          {
            location: { lat, lng },
            language: language === 'ru' ? 'ru' : 'en',
          },
          (results, status) => {
            if (status !== 'OK' || !results?.[0]) {
              resolve(null);
              return;
            }
            const r = results[0];
            const loc = r.geometry?.location;
            resolve({
              address: r.formatted_address ?? '',
              placeId: r.place_id ?? null,
              lat: loc?.lat() ?? lat,
              lng: loc?.lng() ?? lng,
            });
          }
        );
      });
    },
    [getGeocoder, language]
  );

  /** Returns result + raw status for diagnostics (e.g. OVER_QUERY_LIMIT, REQUEST_DENIED). */
  const reverseGeocodeWithStatus = useCallback(
    async (lat: number, lng: number): Promise<{ result: GeocodeResult | null; status: string }> => {
      const geocoder = getGeocoder();
      if (!geocoder) {
        return { result: null, status: 'GEOCODER_NOT_READY' };
      }
      return new Promise((resolve) => {
        geocoder.geocode(
          {
            location: { lat, lng },
            language: language === 'ru' ? 'ru' : 'en',
          },
          (results, status) => {
            if (status !== 'OK' || !results?.[0]) {
              resolve({ result: null, status: status ?? 'UNKNOWN' });
              return;
            }
            const r = results[0];
            const loc = r.geometry?.location;
            resolve({
              result: {
                address: r.formatted_address ?? '',
                placeId: r.place_id ?? null,
                lat: loc?.lat() ?? lat,
                lng: loc?.lng() ?? lng,
              },
              status,
            });
          }
        );
      });
    },
    [getGeocoder, language]
  );

  const searchAddress = useCallback(
    async (
      query: string,
      options?: { proximity?: { lat: number; lng: number }; country?: string }
    ): Promise<GeocodeResult[]> => {
      const geocoder = getGeocoder();
      if (!geocoder || !query.trim()) return [];
      return new Promise((resolve) => {
        const request: google.maps.GeocoderRequest = {
          address: query,
          language: language === 'ru' ? 'ru' : 'en',
        };
        if (options?.country) request.componentRestrictions = { country: options.country };
        geocoder.geocode(request, (results, status) => {
          if (status !== 'OK' && status !== 'ZERO_RESULTS') {
            resolve([]);
            return;
          }
          if (!results?.length) {
            resolve([]);
            return;
          }
          resolve(
            results.slice(0, 8).map((r) => {
              const loc = r.geometry?.location;
              return {
                address: r.formatted_address ?? '',
                placeId: r.place_id ?? null,
                lat: loc?.lat() ?? 0,
                lng: loc?.lng() ?? 0,
              };
            })
          );
        });
      });
    },
    [getGeocoder, language]
  );

  return { reverseGeocode, searchAddress, reverseGeocodeWithStatus, isReady: isLoaded };
}
