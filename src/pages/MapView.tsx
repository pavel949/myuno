import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { usePropertiesForMap, transformPropertiesToMarkers } from '@/hooks/useProperties';
import { useRestaurants } from '@/hooks/useRestaurants';
import { createMapPopupHtml } from '@/lib/sanitize';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';
import { APP_ROUTES } from '@/lib/config/routes';
import { isOpenNow } from '@/lib/filterUtils';

type VerticalFilter = 'all' | 'property' | 'commercial' | 'land' | 'beauty' | 'restaurant';
type PriceFilter = 'all' | 'budget' | 'mid' | 'premium' | 'luxury';
type AvailabilityFilter = 'all' | 'open_now';

const PRICE_RANGES: Record<Exclude<PriceFilter, 'all'>, [number, number]> = {
  budget: [0, 500],
  mid: [500, 1500],
  premium: [1500, 5000],
  luxury: [5000, Number.POSITIVE_INFINITY],
};

const PRICE_OPTIONS: { value: PriceFilter; labelEn: string; labelRu: string; icon: string }[] = [
  { value: 'all', labelEn: 'Any price', labelRu: 'Любая цена', icon: '💰' },
  { value: 'budget', labelEn: '< ฿500', labelRu: '< ฿500', icon: '💵' },
  { value: 'mid', labelEn: '฿500–1.5k', labelRu: '฿500–1.5k', icon: '💴' },
  { value: 'premium', labelEn: '฿1.5k–5k', labelRu: '฿1.5k–5k', icon: '💶' },
  { value: 'luxury', labelEn: '฿5k+', labelRu: '฿5k+', icon: '💎' },
];

const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; labelEn: string; labelRu: string; icon: string }[] = [
  { value: 'all', labelEn: 'Anytime', labelRu: 'В любое время', icon: '🕒' },
  { value: 'open_now', labelEn: 'Open now', labelRu: 'Открыто сейчас', icon: '🟢' },
];

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
  workingHours?: Record<string, string> | null;
}

const VERTICAL_CONFIG: Record<
  Exclude<VerticalFilter, 'all'>,
  { icon: string; color: string; labelEn: string; labelRu: string; route: (id: string) => string }
> = {
  property: { icon: '🏠', color: '#059669', labelEn: 'Real Estate', labelRu: 'Жильё', route: (id) => APP_ROUTES.PROPERTY_DETAIL(id) },
  commercial: { icon: '🏢', color: '#C9A84C', labelEn: 'Commercial', labelRu: 'Коммерческая', route: (id) => `/property/commercial/${id}` },
  land: { icon: '🌾', color: '#A0784A', labelEn: 'Land', labelRu: 'Земля', route: (id) => `/property/land/${id}` },
  beauty: { icon: '💇', color: '#6366f1', labelEn: 'Beauty', labelRu: 'Красота', route: (id) => `/beauty/salon/${id}` },
  restaurant: { icon: '🍽️', color: '#ea580c', labelEn: 'Restaurants', labelRu: 'Рестораны', route: (id) => `/restaurants/${id}` },
};

const FILTER_OPTIONS: { value: VerticalFilter; labelEn: string; labelRu: string; icon: string }[] = [
  { value: 'all', labelEn: 'All', labelRu: 'Все', icon: '🗺️' },
  { value: 'property', labelEn: 'Housing', labelRu: 'Жильё', icon: '🏠' },
  { value: 'commercial', labelEn: 'Commercial', labelRu: 'Коммерч.', icon: '🏢' },
  { value: 'land', labelEn: 'Land', labelRu: 'Земля', icon: '🌾' },
  { value: 'beauty', labelEn: 'Beauty', labelRu: 'Красота', icon: '💇' },
  { value: 'restaurant', labelEn: 'Restaurants', labelRu: 'Рестораны', icon: '🍽️' },
];

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

export default function MapView() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { getCityConfig } = useLocationContext();
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialVertical = (searchParams.get('vertical') as VerticalFilter) || 'all';
  const initialPrice = (searchParams.get('price') as PriceFilter) || 'all';
  const initialAvailability = (searchParams.get('availability') as AvailabilityFilter) || 'all';
  const [selectedVertical, setSelectedVertical] = useState<VerticalFilter>(initialVertical);
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>(initialPrice);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityFilter>(initialAvailability);
  const [selectedMarker, setSelectedMarker] = useState<UniversalMarker | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Fetch data from all verticals
  const { data: properties, isLoading: propLoading } = usePropertiesForMap({});

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

  const allMarkers = useMemo<UniversalMarker[]>(() => {
    const markers: UniversalMarker[] = [];
    const propMarkers = transformPropertiesToMarkers(properties || []);
    const acById = new Map<string, 'residential' | 'commercial' | 'land' | null>();
    (properties || []).forEach((p) => acById.set(p.id, p.asset_class ?? 'residential'));
    propMarkers.forEach((m) => {
      const ac = acById.get(m.id);
      const vertical: VerticalFilter = ac === 'commercial' ? 'commercial' : ac === 'land' ? 'land' : 'property';
      markers.push({ ...m, vertical });
    });
    (salons || []).forEach((s) => {
      if (s.lat != null && s.lng != null) {
        markers.push({
          id: s.id,
          name: s.name_en,
          nameRu: s.name_ru,
          lat: Number(s.lat),
          lng: Number(s.lng),
          rating: s.rating || 0,
          priceFrom: s.price_from || 0,
          image: s.cover_image || undefined,
          vertical: 'beauty',
        });
      }
    });
    (restaurants || []).forEach((r) => {
      if (r.lat != null && r.lng != null) {
        markers.push({
          id: r.id,
          name: r.name_en,
          nameRu: r.name_ru,
          lat: Number(r.lat),
          lng: Number(r.lng),
          rating: r.rating || 0,
          priceFrom: 0,
          image: r.cover_image || undefined,
          vertical: 'restaurant',
          workingHours: r.working_hours ?? null,
        });
      }
    });
    return markers;
  }, [properties, salons, restaurants]);

  const filteredMarkers = useMemo(() => {
    return allMarkers.filter((m) => {
      if (selectedVertical !== 'all' && m.vertical !== selectedVertical) return false;
      if (selectedPrice !== 'all') {
        const [min, max] = PRICE_RANGES[selectedPrice];
        // Only filter by price when the marker actually has a price (>0).
        // Verticals without pricing data (e.g. restaurants) are kept visible.
        if (m.priceFrom > 0 && (m.priceFrom < min || m.priceFrom >= max)) return false;
      }
      if (selectedAvailability === 'open_now') {
        // Only restaurants currently expose working hours; others fall through.
        if (m.workingHours && !isOpenNow(m.workingHours)) return false;
      }
      return true;
    });
  }, [allMarkers, selectedVertical, selectedPrice, selectedAvailability]);

  const defaultCenter = useMemo(() => {
    const cityConfig = getCityConfig();
    if (cityConfig) return { lat: cityConfig.lat, lng: cityConfig.lng };
    const c = getMapCenter(DEFAULT_CITY);
    return { lat: c[1], lng: c[0] };
  }, [getCityConfig]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Fit bounds when markers change
  React.useEffect(() => {
    if (!mapRef.current || filteredMarkers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    filteredMarkers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  }, [filteredMarkers]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value === 'all') next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleFilterChange = (value: VerticalFilter) => {
    setSelectedVertical(value);
    setSelectedMarker(null);
    updateParam('vertical', value);
  };

  const handlePriceChange = (value: PriceFilter) => {
    setSelectedPrice(value);
    updateParam('price', value);
  };

  const handleAvailabilityChange = (value: AvailabilityFilter) => {
    setSelectedAvailability(value);
    updateParam('availability', value);
  };

  const activeFilterCount =
    (selectedVertical !== 'all' ? 1 : 0) +
    (selectedPrice !== 'all' ? 1 : 0) +
    (selectedAvailability !== 'all' ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedVertical('all');
    setSelectedPrice('all');
    setSelectedAvailability('all');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const mapError = !hasKey ? (language === 'ru' ? 'Ключ Google Maps не задан' : 'Google Maps key not set') : loadError?.message ?? null;
  const showLoading = !hasKey || !isLoaded || (isDataLoading && allMarkers.length === 0);

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="px-4 py-3 bg-background/95 border-b border-border z-10 space-y-2">
          {/* Category */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {language === 'ru' ? 'Категория' : 'Category'}
            </p>
            <FilterChipGroup scrollable>
              {FILTER_OPTIONS.map((opt) => (
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
          </div>

          {/* Price range */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {language === 'ru' ? 'Цена' : 'Price'}
            </p>
            <FilterChipGroup scrollable>
              {PRICE_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={language === 'ru' ? opt.labelRu : opt.labelEn}
                  icon={opt.icon}
                  isActive={selectedPrice === opt.value}
                  onToggle={() => handlePriceChange(opt.value)}
                  size="md"
                />
              ))}
            </FilterChipGroup>
          </div>

          {/* Availability */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {language === 'ru' ? 'Доступность' : 'Availability'}
            </p>
            <FilterChipGroup scrollable>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={language === 'ru' ? opt.labelRu : opt.labelEn}
                  icon={opt.icon}
                  isActive={selectedAvailability === opt.value}
                  onToggle={() => handleAvailabilityChange(opt.value)}
                  size="md"
                />
              ))}
            </FilterChipGroup>
          </div>

          {!showLoading && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {filteredMarkers.length} {language === 'ru' ? 'локаций' : 'locations'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm px-1"
                >
                  {language === 'ru'
                    ? `Сбросить (${activeFilterCount})`
                    : `Clear (${activeFilterCount})`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 relative min-h-0">
          {showLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : mapError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card p-6 text-center">
              <p className="text-muted-foreground">{mapError}</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {language === 'ru'
                  ? 'Задайте VITE_GOOGLE_MAPS_API_KEY в .env и включите Maps JavaScript API в Google Cloud.'
                  : 'Set VITE_GOOGLE_MAPS_API_KEY in .env and enable Maps JavaScript API in Google Cloud.'}
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=7.8804,98.3923"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {language === 'ru' ? 'Открыть карту Пхукета в Google Maps' : 'Open Phuket in Google Maps'}
              </a>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={11}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              options={{
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                styles: [
                  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
                  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
                ],
              }}
            >
              {filteredMarkers.map((marker) => {
                const cfg = VERTICAL_CONFIG[marker.vertical as Exclude<VerticalFilter, 'all'>];
                if (!cfg) return null;
                const displayName = language === 'ru' ? marker.nameRu : marker.name;
                return (
                  <Marker
                    key={`${marker.vertical}-${marker.id}`}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    label={{ text: cfg.icon, color: 'white', fontWeight: 'bold', fontSize: '12px' }}
                    title={displayName}
                    onClick={() => setSelectedMarker(marker)}
                  />
                );
              })}
              {selectedMarker && (
                <InfoWindow
                  position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div
                    className="min-w-[200px] max-w-[240px] text-left"
                    dangerouslySetInnerHTML={{
                      __html: createMapPopupHtml({
                        name: language === 'ru' ? selectedMarker.nameRu : selectedMarker.name,
                        rating: selectedMarker.rating,
                        price: selectedMarker.priceFrom > 0 ? `${formatPrice(selectedMarker.priceFrom)}+` : '',
                        image: selectedMarker.image,
                      }),
                    }}
                  />
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
