/**
 * Shared Mapbox hook for consistent map initialization across the app
 * Eliminates code duplication between SalonMap, RestaurantMap, etc.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';

export interface MapboxMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  icon?: string;
  color?: string;
  data?: Record<string, unknown>;
}

export interface UseMapboxOptions {
  defaultCenter?: [number, number]; // [lng, lat]
  defaultZoom?: number;
  style?: 'dark' | 'light' | 'streets' | 'satellite';
  pitch?: number;
  enableGeolocation?: boolean;
  enableNavigation?: boolean;
}

export interface UseMapboxReturn {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: mapboxgl.Map | null;
  isLoading: boolean;
  error: string | null;
  isMapReady: boolean;
  userLocation: { lat: number; lng: number } | null;
  flyTo: (coords: [number, number], zoom?: number) => void;
  addMarkers: (markers: MapboxMarker[], onClick?: (marker: MapboxMarker) => void) => void;
  clearMarkers: () => void;
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;
}

const STYLE_MAP: Record<string, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// Default center: Phuket
const DEFAULT_CENTER: [number, number] = [98.3923, 7.8804];

export function useMapbox(options: UseMapboxOptions = {}): UseMapboxReturn {
  const {
    defaultCenter = DEFAULT_CENTER,
    defaultZoom = 12,
    style = 'streets',
    pitch = 0,
    enableGeolocation = true,
    enableNavigation = true,
  } = options;

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const listenersRef = useRef<Array<{ el: HTMLElement; handler: () => void }>>([]);

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    let isMounted = true;

    const fetchToken = async () => {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke('get-mapbox-token');
        if (!isMounted) return;

        if (fetchError) throw fetchError;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          throw new Error('No token received');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch Mapbox token:', err);
          setError('Failed to load map');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const center = userLocation
      ? [userLocation.lng, userLocation.lat] as [number, number]
      : defaultCenter;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: STYLE_MAP[style] || STYLE_MAP.streets,
      center,
      zoom: defaultZoom,
      pitch,
    });

    if (enableNavigation) {
      map.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: pitch > 0 }),
        'top-right'
      );
    }

    if (enableGeolocation) {
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      });

      geolocate.on('geolocate', (e: GeolocationPosition) => {
        setUserLocation({
          lat: e.coords.latitude,
          lng: e.coords.longitude,
        });
      });

      map.addControl(geolocate, 'top-right');
    }

    map.on('load', () => {
      setIsMapReady(true);
    });

    mapRef.current = map;

    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(({ el, handler }) => {
        el.removeEventListener('click', handler);
      });
      listenersRef.current = [];

      // Cleanup markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [mapboxToken, defaultCenter, defaultZoom, style, pitch, enableGeolocation, enableNavigation]);

  // Fly to location
  const flyTo = useCallback((coords: [number, number], zoom?: number) => {
    mapRef.current?.flyTo({
      center: coords,
      zoom: zoom || mapRef.current.getZoom(),
      duration: 1000,
    });
  }, []);

  // Clear existing markers
  const clearMarkers = useCallback(() => {
    listenersRef.current.forEach(({ el, handler }) => {
      el.removeEventListener('click', handler);
    });
    listenersRef.current = [];

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Add markers to map
  const addMarkers = useCallback((
    markers: MapboxMarker[],
    onClick?: (marker: MapboxMarker) => void
  ) => {
    if (!mapRef.current || !isMapReady) return;

    // Clear existing markers first
    clearMarkers();

    markers.forEach((markerData) => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      
      const color = markerData.color || 'hsl(var(--primary))';
      const icon = markerData.icon || '📍';

      el.innerHTML = `
        <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-transform"
             style="background-color: ${color};">
          <span class="text-lg">${icon}</span>
        </div>
      `;

      if (onClick) {
        const clickHandler = () => {
          setSelectedMarkerId(markerData.id);
          onClick(markerData);
          flyTo([markerData.lng, markerData.lat], 14);
        };

        el.addEventListener('click', clickHandler);
        listenersRef.current.push({ el, handler: clickHandler });
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [isMapReady, clearMarkers, flyTo]);

  return {
    mapContainer,
    map: mapRef.current,
    isLoading,
    error,
    isMapReady,
    userLocation,
    flyTo,
    addMarkers,
    clearMarkers,
    selectedMarkerId,
    setSelectedMarkerId,
  };
}
