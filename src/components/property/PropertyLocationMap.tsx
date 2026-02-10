import React, { useRef, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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

  // Default to Phuket center if no coordinates
  const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
  const mapLat = hasCoords ? lat : 7.8804;
  const mapLng = hasCoords ? lng : 98.3923;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        // Use env variable or fallback public token
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibXl1bm9hcHAiLCJhIjoiY200a3Rib3AwMDFndjJrcjF2MDRhZG1rZiJ9.hEx6JOnSqJr1EfZzfVPjPg';

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
            // Add a blurred circle for privacy (approximate location)
            map.addSource('location-area', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [mapLng!, mapLat!],
                },
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

            // Center marker
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

        mapRef.current = map;
      } catch (err) {
        console.warn('Map failed to load:', err);
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
      
      <div className="rounded-2xl overflow-hidden border border-border h-[300px] mb-3">
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
