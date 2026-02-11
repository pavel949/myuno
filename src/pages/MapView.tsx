import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { usePropertiesForMap, transformPropertiesToMarkers } from '@/hooks/useProperties';
import { useRestaurants } from '@/hooks/useRestaurants';
import { createMapPopupHtml } from '@/lib/sanitize';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';

type VerticalFilter = 'all' | 'property' | 'beauty' | 'restaurant';

interface UniversalMarker {
  id: string;
  name: string;
  nameRu: string;
  lat: number;
  lng: number;
  rating: number;
  priceFrom: number;
  image?: string;
  vertical: VerticalFilter;
}

const VERTICAL_CONFIG: Record<Exclude<VerticalFilter, 'all'>, { icon: string; color: string; labelEn: string; labelRu: string; route: (id: string) => string }> = {
  property: { icon: '🏠', color: '#059669', labelEn: 'Real Estate', labelRu: 'Жильё', route: (id) => `/property/${id}` },
  beauty: { icon: '💇', color: '#6366f1', labelEn: 'Beauty', labelRu: 'Красота', route: (id) => `/beauty/salon/${id}` },
  restaurant: { icon: '🍽️', color: '#ea580c', labelEn: 'Restaurants', labelRu: 'Рестораны', route: (id) => `/restaurants/${id}` },
};

const FILTER_OPTIONS: { value: VerticalFilter; labelEn: string; labelRu: string; icon: string }[] = [
  { value: 'all', labelEn: 'All', labelRu: 'Все', icon: '🗺️' },
  { value: 'property', labelEn: 'Housing', labelRu: 'Жильё', icon: '🏠' },
  { value: 'beauty', labelEn: 'Beauty', labelRu: 'Красота', icon: '💇' },
  { value: 'restaurant', labelEn: 'Food', labelRu: 'Еда', icon: '🍽️' },
];

export default function MapView() {
  const { t, language } = useLanguage();
  const { getCityConfig } = useLocationContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialVertical = (searchParams.get('vertical') as VerticalFilter) || 'all';
  const [selectedVertical, setSelectedVertical] = useState<VerticalFilter>(initialVertical);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch data from all verticals
  const { data: properties, isLoading: propLoading } = usePropertiesForMap({});

  // Salons - query directly to get lat/lng (not in Salon interface)
  const { data: salons, isLoading: salonLoading } = useQuery({
    queryKey: ['salons-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salons')
        .select('id, name_en, name_ru, lat, lng, rating, price_from, cover_image')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      if (error) throw error;
      return data || [];
    },
  });

  const { restaurants, isLoading: restLoading } = useRestaurants({});

  const isDataLoading = propLoading || salonLoading || restLoading;

  // Build unified markers
  const allMarkers = useMemo<UniversalMarker[]>(() => {
    const markers: UniversalMarker[] = [];

    // Properties
    const propMarkers = transformPropertiesToMarkers(properties || []);
    propMarkers.forEach(m => markers.push({ ...m, vertical: 'property' }));

    // Salons
    (salons || []).forEach(s => {
      if (s.lat != null && s.lng != null) {
        markers.push({
          id: s.id, name: s.name_en, nameRu: s.name_ru,
          lat: Number(s.lat), lng: Number(s.lng),
          rating: s.rating || 0, priceFrom: s.price_from || 0,
          image: s.cover_image || undefined, vertical: 'beauty',
        });
      }
    });

    // Restaurants
    (restaurants || []).forEach(r => {
      if (r.lat != null && r.lng != null) {
        markers.push({
          id: r.id, name: r.name_en, nameRu: r.name_ru,
          lat: Number(r.lat), lng: Number(r.lng),
          rating: r.rating || 0, priceFrom: 0,
          image: r.cover_image || undefined, vertical: 'restaurant',
        });
      }
    });

    return markers;
  }, [properties, salons, restaurants]);

  const filteredMarkers = useMemo(() => {
    if (selectedVertical === 'all') return allMarkers;
    return allMarkers.filter(m => m.vertical === selectedVertical);
  }, [allMarkers, selectedVertical]);

  // Fetch Mapbox token
  useEffect(() => {
    let mounted = true;
    supabase.functions.invoke('get-mapbox-token').then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data?.token) {
        setMapError('Failed to load map');
      } else {
        setMapboxToken(data.token);
      }
      setMapLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    mapboxgl.accessToken = mapboxToken;

    const cityConfig = getCityConfig();
    const center: [number, number] = cityConfig
      ? [cityConfig.lng, cityConfig.lat]
      : getMapCenter(DEFAULT_CITY);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 11,
      pitch: 30,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true, showUserHeading: true,
    }), 'top-right');

    return () => { map.current?.remove(); };
  }, [mapboxToken]);

  // Update markers
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    const listeners: Array<{ el: HTMLElement; handler: () => void }> = [];
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredMarkers.forEach(marker => {
      const cfg = VERTICAL_CONFIG[marker.vertical as Exclude<VerticalFilter, 'all'>];
      if (!cfg) return;

      const el = document.createElement('div');
      el.innerHTML = `
        <div style="width:36px;height:36px;border-radius:50%;background:${cfg.color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;border:2px solid white;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          <span style="font-size:16px;line-height:1;">${cfg.icon}</span>
        </div>
      `;

      const displayName = language === 'ru' ? marker.nameRu : marker.name;
      const priceText = marker.priceFrom > 0 ? `฿${marker.priceFrom.toLocaleString()}+` : '';

      const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '240px' }).setHTML(
        createMapPopupHtml({
          name: displayName,
          rating: marker.rating,
          price: priceText,
          image: marker.image,
        })
      );

      const mapMarker = new mapboxgl.Marker(el)
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map.current!);

      const clickHandler = () => navigate(cfg.route(marker.id));
      el.addEventListener('click', clickHandler);
      listeners.push({ el, handler: clickHandler });

      markersRef.current.push(mapMarker);
    });

    // Fit bounds
    if (filteredMarkers.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredMarkers.forEach(m => bounds.extend([m.lng, m.lat]));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }

    return () => {
      listeners.forEach(({ el, handler }) => el.removeEventListener('click', handler));
    };
  }, [filteredMarkers, mapboxToken, language, navigate]);

  const handleFilterChange = (value: VerticalFilter) => {
    setSelectedVertical(value);
    if (value === 'all') {
      searchParams.delete('vertical');
    } else {
      searchParams.set('vertical', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const showLoading = mapLoading || (isDataLoading && allMarkers.length === 0);

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Filter chips */}
        <div className="px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <FilterChipGroup scrollable>
            {FILTER_OPTIONS.map(opt => (
              <FilterChip
                key={opt.value}
                label={language === 'ru' ? opt.labelRu : opt.labelEn}
                icon={opt.icon}
                isActive={selectedVertical === opt.value}
                onToggle={() => handleFilterChange(opt.value)}
                size="md"
              />
            ))}
          </FilterChipGroup>
          {!showLoading && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {filteredMarkers.length} {language === 'ru' ? 'локаций' : 'locations'}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {showLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <p className="text-muted-foreground">{mapError}</p>
            </div>
          ) : (
            <div ref={mapContainer} className="absolute inset-0" />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
