import { useState, useCallback } from 'react';
import { getGoogleMapsKey } from '@/lib/googleMaps';
import { useGoogleGeocode } from './useGoogleGeocode';

export interface PlaceDetails {
  address: string;
  rating: number | null;
  photoUrl: string | null;
  placeId: string | null;
}

/**
 * Fetch place details (address, Google rating, photo) via Places API.
 * For lat/lng we first get place_id from Geocoding API, then fetch Place Details.
 */
export function usePlacesDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { reverseGeocode } = useGoogleGeocode();

  const getDetailsByPlaceId = useCallback(async (placeId: string, signal?: AbortSignal): Promise<PlaceDetails | null> => {
    const key = getGoogleMapsKey();
    if (!key) return null;
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=formattedAddress,rating,photos&key=${key}`,
        { signal }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const photoName = data.photos?.[0]?.name;
      let photoUrl: string | null = null;
      if (photoName) {
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${key}&maxWidthPx=400`;
      }
      return {
        address: data.formattedAddress || '',
        rating: data.rating ?? null,
        photoUrl,
        placeId,
      };
    } catch {
      return null;
    }
  }, []);

  const getDetailsByLatLng = useCallback(
    async (lat: number, lng: number): Promise<PlaceDetails | null> => {
      const key = getGoogleMapsKey();
      if (!key) return null;
      setLoading(true);
      setError(null);
      try {
        const geo = await reverseGeocode(lat, lng);
        if (!geo?.placeId) {
          return {
            address: geo?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            rating: null,
            photoUrl: null,
            placeId: null,
          };
        }
        const details = await getDetailsByPlaceId(geo.placeId);
        if (details) {
          return { ...details, address: details.address || geo.address };
        }
        return {
          address: geo.address,
          rating: null,
          photoUrl: null,
          placeId: geo.placeId,
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch place details'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [reverseGeocode, getDetailsByPlaceId]
  );

  return { getDetailsByPlaceId, getDetailsByLatLng, loading, error };
}
