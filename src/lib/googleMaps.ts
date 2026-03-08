/**
 * Google Maps API key and config.
 * Enable Maps JavaScript API and Places API in Google Cloud Console.
 */
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const DEFAULT_MAP_CENTER = { lat: 7.8804, lng: 98.3923 }; // Phuket
export const DEFAULT_ZOOM = 12;

export function hasGoogleMapsKey(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 0);
}
