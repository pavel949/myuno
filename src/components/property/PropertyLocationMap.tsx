import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface PropertyLocationMapProps {
  lat?: number | null;
  lng?: number | null;
  district?: string;
  address?: string;
}

export function PropertyLocationMap({ lat, lng, district, address }: PropertyLocationMapProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
  const mapLat = hasCoords ? lat : 7.8804;
  const mapLng = hasCoords ? lng : 98.3923;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        // Fetch token from edge function (same as other map components)
        const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
        const token = tokenData?.token;
        
        if (!token || cancelled) {
          if (!cancelled) setMapError(true);
          return;
        }

        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        mapboxgl.accessToken = token;

        if (cancelled || !mapContainer.current) return;

        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [mapLng!, mapLat!],
          zoom: hasCoords ? 14 : 11,
          interactive: true,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          if (cancelled) return;
          setMapLoaded(true);

          if (hasCoords) {
            map.addSource('location-area', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [mapLng!, mapLat!] },
                properties: {},
              },
            });

            map.addLayer({
              id: 'location-circle',
              type: 'circle',
              source: 'location-area',
              paint: {
                'circle-radius': 80,
                'circle-color': 'hsl(var(--primary))',
                'circle-opacity': 0.15,
                'circle-stroke-width': 2,
                'circle-stroke-color': 'hsl(var(--primary))',
                'circle-stroke-opacity': 0.3,
              },
            });

            map.addLayer({
              id: 'location-dot',
              type: 'circle',
              source: 'location-area',
              paint: {
                'circle-radius': 6,
                'circle-color': 'hsl(var(--primary))',
                'circle-opacity': 0.8,
              },
            });
          }
        });

        map.on('error', () => {
          if (!cancelled) setMapError(true);
        });

        mapRef.current = map;
      } catch (err) {
        console.warn('Map failed to load:', err);
        if (!cancelled) setMapError(true);
      }
    };

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapLat, mapLng, hasCoords]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">
        {isRu ? 'Где вы будете' : "Where you'll be"}
      </h2>
      
      <div className="rounded-2xl overflow-hidden border border-border h-[300px] mb-3 relative">
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 gap-2">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{isRu ? 'Карта временно недоступна' : 'Map temporarily unavailable'}</p>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      <div className="flex items-start gap-2 text-muted-foreground">
        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-foreground">{district || 'Phuket'}</p>
          {address && <p className="text-sm">{address}</p>}
          {hasCoords && (
            <p className="text-xs mt-1">
              {isRu ? 'Точное местоположение будет предоставлено после бронирования' : 'Exact location provided after booking'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
