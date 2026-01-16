import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { createMapPopupHtml, escapeHtml } from '@/lib/sanitize';

export interface SalonMarker {
  id: string;
  name: string;
  nameRu: string;
  lat: number;
  lng: number;
  rating: number;
  priceFrom: number;
  image?: string;
}

interface SalonMapProps {
  salons: SalonMarker[];
  onSalonSelect?: (salonId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  distanceFilter?: number; // in km
  className?: string;
}

const SalonMap: React.FC<SalonMapProps> = ({
  salons,
  onSalonSelect,
  userLocation,
  distanceFilter,
  className = '',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { language } = useLanguage();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          throw new Error('No token received');
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
        setError('Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter salons by distance
  const filteredSalons = salons.filter(salon => {
    if (!distanceFilter || !userLocation) return true;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      salon.lat,
      salon.lng
    );
    return distance <= distanceFilter;
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Default center to Phuket
    const defaultCenter: [number, number] = [98.3923, 7.8804];
    const center = userLocation 
      ? [userLocation.lng, userLocation.lat] as [number, number]
      : defaultCenter;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 12,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

  // Update markers when salons change
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredSalons.forEach(salon => {
      const el = document.createElement('div');
      el.className = 'salon-marker';
      el.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-transform border-2 border-white">
          <span class="text-white text-lg">💆</span>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        createMapPopupHtml({
          name: language === 'ru' ? salon.nameRu : salon.name,
          rating: salon.rating,
          price: `฿${escapeHtml(salon.priceFrom)}+`,
        })
      );

      const marker = new mapboxgl.Marker(el)
        .setLngLat([salon.lng, salon.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onSalonSelect?.(salon.id);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have salons
    if (filteredSalons.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredSalons.forEach(salon => {
        bounds.extend([salon.lng, salon.lat]);
      });
      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat]);
      }
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [filteredSalons, mapboxToken, language, onSalonSelect, userLocation]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-card ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-card ${className}`}>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-xl overflow-hidden" />
    </div>
  );
};

export default SalonMap;
