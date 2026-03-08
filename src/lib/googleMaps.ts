/**
 * Google Maps API key and config.
 * Key is loaded dynamically from system_config table,
 * with fallback to VITE_GOOGLE_MAPS_API_KEY env var.
 */
import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_MAP_CENTER = { lat: 7.8804, lng: 98.3923 }; // Phuket
export const DEFAULT_ZOOM = 12;

/** Mutable runtime key – set after fetching from DB */
let _resolvedKey: string | null = null;
let _fetchPromise: Promise<string | null> | null = null;

/**
 * Synchronous getter – returns the key if already resolved.
 */
export function getGoogleMapsKey(): string | null {
  return _resolvedKey;
}

/**
 * Fetch key from system_config (cached). Falls back to env var.
 */
export async function fetchGoogleMapsKey(): Promise<string | null> {
  if (_resolvedKey) return _resolvedKey;

  // Check env var first
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (envKey && envKey.length > 0) {
    _resolvedKey = envKey;
    return _resolvedKey;
  }

  // Deduplicate concurrent calls
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'GOOGLE_MAPS_API_KEY')
        .maybeSingle();

      if (!error && data?.value) {
        _resolvedKey = data.value;
        return _resolvedKey;
      }
    } catch {
      // silent
    }
    return null;
  })();

  const result = await _fetchPromise;
  _fetchPromise = null;
  return result;
}

export function hasGoogleMapsKey(): boolean {
  return Boolean(_resolvedKey && _resolvedKey.length > 0);
}

// Legacy export for backwards compat (will be null until fetched)
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
