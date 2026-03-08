/**
 * Shared Google Maps hook for consistent map usage across the app.
 * Replaces the old useMapbox hook.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';

export interface GoogleMapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  icon?: string;
  color?: string;
  data?: Record<string, unknown>;
}

export interface UseGoogleMapOptions {
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  enableGeolocation?: boolean;
}

export interface UseGoogleMapReturn {
  isLoading: boolean;
  error: string | null;
  isMapReady: boolean;
  hasKey: boolean;
  userLocation: { lat: number; lng: number } | null;
}

export function useGoogleMap(options: UseGoogleMapOptions = {}): UseGoogleMapReturn {
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const { enableGeolocation = true } = options;

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!enableGeolocation) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [enableGeolocation]);

  return {
    isLoading: hasKey && !isLoaded && !loadError,
    error: loadError?.message || (!hasKey ? 'Google Maps API key not set' : null),
    isMapReady: isLoaded,
    hasKey,
    userLocation,
  };
}
