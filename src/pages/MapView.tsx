import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { usePropertiesForMap, transformPropertiesToMarkers } from '@/hooks/useProperties';
import { useRestaurants } from '@/hooks/useRestaurants';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';
import { APP_ROUTES } from '@/lib/config/routes';
import { isOpenNow } from '@/lib/filterUtils';
import { MapLibreMap, MapMarker, MapLibreMapHandle } from '@/components/map/MapLibreMap';
import { MapSearchBox, MapSearchResult } from '@/components/map/MapSearchBox';


type VerticalFilter =
  | 'all'
  | 'property'
  | 'commercial'
  | 'land'
  | 'beauty'
  | 'restaurant'
  | 'fitness'
  | 'pharmacy'
  | 'vet'
  | 'flowers'
  | 'venue'
  | 'event';
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
  fitness: { icon: '🏋️', color: '#0ea5e9', labelEn: 'Fitness', labelRu: 'Фитнес', route: (id) => `/fitness/${id}` },
  pharmacy: { icon: '💊', color: '#16a34a', labelEn: 'Pharmacy', labelRu: 'Аптеки', route: (id) => `/pharmacy/${id}` },
  vet: { icon: '🐾', color: '#db2777', labelEn: 'Vet', labelRu: 'Ветклиники', route: (id) => `/pets/vet/${id}` },
  flowers: { icon: '💐', color: '#e11d48', labelEn: 'Flowers', labelRu: 'Цветы', route: (id) => `/flowers/shop/${id}` },
  venue: { icon: '🏛️', color: '#7c3aed', labelEn: 'Venues', labelRu: 'Площадки', route: (id) => `/venues/${id}` },
  event: { icon: '🎉', color: '#f59e0b', labelEn: 'Events', labelRu: 'События', route: (id) => APP_ROUTES.EVENT_DETAIL(id) },
};

const FILTER_OPTIONS: { value: VerticalFilter; labelEn: string; labelRu: string; icon: string }[] = [
  { value: 'all', labelEn: 'All', labelRu: 'Все', icon: '🗺️' },
  { value: 'property', labelEn: 'Housing', labelRu: 'Жильё', icon: '🏠' },
  { value: 'commercial', labelEn: 'Commercial', labelRu: 'Коммерч.', icon: '🏢' },
  { value: 'land', labelEn: 'Land', labelRu: 'Земля', icon: '🌾' },
  { value: 'beauty', labelEn: 'Beauty', labelRu: 'Красота', icon: '💇' },
  { value: 'restaurant', labelEn: 'Restaurants', labelRu: 'Рестораны', icon: '🍽️' },
  { value: 'fitness', labelEn: 'Fitness', labelRu: 'Фитнес', icon: '🏋️' },
  { value: 'pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптеки', icon: '💊' },
  { value: 'vet', labelEn: 'Vet', labelRu: 'Ветклиники', icon: '🐾' },
  { value: 'flowers', labelEn: 'Flowers', labelRu: 'Цветы', icon: '💐' },
  { value: 'venue', labelEn: 'Venues', labelRu: 'Площадки', icon: '🏛️' },
  { value: 'event', labelEn: 'Events', labelRu: 'События', icon: '🎉' },
];

const OSM_CATEGORIES = ['all','hotel','restaurant','pharmacy','clinic','attraction','beach','park','shop','finance','fuel','education','worship','civic','fitness','vet'];

type ClickedMarker =
  | { kind: 'vendor'; marker: UniversalMarker }
  | { kind: 'osm'; poi: any }
  | null;

export default function MapView() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { getCityConfig } = useLocationContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialVertical = (searchParams.get('vertical') as VerticalFilter) || 'all';
  const initialPrice = (searchParams.get('price') as PriceFilter) || 'all';
  const initialAvailability = (searchParams.get('availability') as AvailabilityFilter) || 'all';
  const [selectedVertical, setSelectedVertical] = useState<VerticalFilter>(initialVertical);
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>(initialPrice);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityFilter>(initialAvailability);
  const [selected, setSelected] = useState<ClickedMarker>(null);
  const mapRef = useRef<MapLibreMapHandle | null>(null);
  const [searchPin, setSearchPin] = useState<MapSearchResult | null>(null);

  const handleSearchSelect = useCallback((r: MapSearchResult) => {
    setSearchPin(r);
    mapRef.current?.flyTo(r.lat, r.lng, 16);
  }, []);


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

  const useGeoLayer = (table: 'gyms' | 'pharmacies' | 'veterinary_clinics' | 'flower_shops' | 'venues') =>
    useQuery({
      queryKey: [`${table}-map`],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(table)
          .select('id, name_en, name_ru, lat, lng, cover_image')
          .eq('is_active', true)
          .not('lat', 'is', null)
          .not('lng', 'is', null);
        if (error) throw error;
        return data || [];
      },
    });

  const { data: gyms, isLoading: gymLoading } = useGeoLayer('gyms');
  const { data: pharmacies, isLoading: pharmLoading } = useGeoLayer('pharmacies');
  const { data: vets, isLoading: vetLoading } = useGeoLayer('veterinary_clinics');
  const { data: flowerShops, isLoading: flowerLoading } = useGeoLayer('flower_shops');
  const { data: venues, isLoading: venueLoading } = useGeoLayer('venues');

  const { data: events, isLoading: eventLoading } = useQuery({
    queryKey: ['events-map'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('events')
        .select('id, title_en, title_ru, lat, lng, cover_image, price, event_date')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .or(`event_date.is.null,event_date.gte.${today}`);
      if (error) throw error;
      return data || [];
    },
  });

  // OSM POI layer (OpenStreetMap, ODbL). Loaded on toggle.
  const [showOsm, setShowOsm] = useState(false);
  const [osmCategory, setOsmCategory] = useState<string>('all');
  const { data: osmPois } = useQuery({
    queryKey: ['osm-pois', osmCategory],
    enabled: showOsm,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const cats = osmCategory === 'all' ? null : [osmCategory];
      const { data, error } = await supabase.rpc('nearby_pois', {
        in_lat: 7.88,
        in_lng: 98.39,
        in_radius_m: 30000,
        in_categories: cats,
        in_limit: 600,
      });
      if (error) throw error;
      return (data || []).filter((p: any) => p.source === 'osm');
    },
  });

  const [placeDetails, setPlaceDetails] = useState<any | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);

  const loadPlaceDetails = useCallback(async (poi: any) => {
    setPlaceLoading(true);
    setPlaceDetails(null);
    try {
      const { data, error } = await supabase.functions.invoke('place-details', {
        body: { query: { name: poi.name, lat: poi.lat, lng: poi.lng } },
      });
      if (error) throw error;
      setPlaceDetails((data as any)?.place ?? null);
    } catch (e) {
      console.error('[place-details]', e);
    } finally {
      setPlaceLoading(false);
    }
  }, []);

  const isDataLoading =
    propLoading || salonLoading || restLoading || gymLoading || pharmLoading || vetLoading || flowerLoading || venueLoading || eventLoading;

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
          id: s.id, name: s.name_en, nameRu: s.name_ru,
          lat: Number(s.lat), lng: Number(s.lng),
          rating: s.rating || 0, priceFrom: s.price_from || 0,
          image: s.cover_image || undefined, vertical: 'beauty',
        });
      }
    });
    (restaurants || []).forEach((r) => {
      if (r.lat != null && r.lng != null) {
        markers.push({
          id: r.id, name: r.name_en, nameRu: r.name_ru,
          lat: Number(r.lat), lng: Number(r.lng),
          rating: r.rating || 0, priceFrom: 0,
          image: r.cover_image || undefined,
          vertical: 'restaurant',
          workingHours: r.working_hours ?? null,
        });
      }
    });

    const pushGeoLayer = (
      rows: Array<{ id: string; name_en: string; name_ru: string | null; lat: number | null; lng: number | null; cover_image: string | null }> | undefined,
      vertical: VerticalFilter,
    ) => {
      (rows || []).forEach((row) => {
        if (row.lat == null || row.lng == null) return;
        markers.push({
          id: row.id, name: row.name_en, nameRu: row.name_ru || row.name_en,
          lat: Number(row.lat), lng: Number(row.lng),
          rating: 0, priceFrom: 0,
          image: row.cover_image || undefined, vertical,
        });
      });
    };
    pushGeoLayer(gyms, 'fitness');
    pushGeoLayer(pharmacies, 'pharmacy');
    pushGeoLayer(vets, 'vet');
    pushGeoLayer(flowerShops, 'flowers');
    pushGeoLayer(venues, 'venue');

    (events || []).forEach((e: any) => {
      if (e.lat == null || e.lng == null) return;
      markers.push({
        id: e.id, name: e.title_en, nameRu: e.title_ru || e.title_en,
        lat: Number(e.lat), lng: Number(e.lng),
        rating: 0, priceFrom: e.price ? Number(e.price) : 0,
        image: e.cover_image || undefined, vertical: 'event',
      });
    });

    return markers;
  }, [properties, salons, restaurants, gyms, pharmacies, vets, flowerShops, venues, events]);

  const filteredMarkers = useMemo(() => {
    return allMarkers.filter((m) => {
      if (selectedVertical !== 'all' && m.vertical !== selectedVertical) return false;
      if (selectedPrice !== 'all') {
        const [min, max] = PRICE_RANGES[selectedPrice];
        if (m.priceFrom > 0 && (m.priceFrom < min || m.priceFrom >= max)) return false;
      }
      if (selectedAvailability === 'open_now') {
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

  // Adapt vendor + OSM markers to MapLibre format.
  const mlMarkers = useMemo<MapMarker[]>(() => {
    const vendor: MapMarker[] = filteredMarkers.map((m) => {
      const cfg = VERTICAL_CONFIG[m.vertical as Exclude<VerticalFilter, 'all'>];
      return {
        id: `${m.vertical}-${m.id}`,
        lat: m.lat,
        lng: m.lng,
        color: cfg?.color,
        icon: cfg?.icon,
        title: language === 'ru' ? m.nameRu : m.name,
        data: { kind: 'vendor', marker: m },
      };
    });
    const osm: MapMarker[] = showOsm
      ? (osmPois || []).map((p: any) => ({
          id: `osm-${p.source_id}`,
          lat: Number(p.lat),
          lng: Number(p.lng),
          color: '#0A2240',
          icon: '·',
          title: p.name || p.category,
          data: { kind: 'osm', poi: p },
        }))
      : [];
    return [...vendor, ...osm];
  }, [filteredMarkers, osmPois, showOsm, language]);

  const handleMarkerClick = useCallback((m: MapMarker) => {
    const d = m.data as ClickedMarker;
    if (!d) return;
    setSelected(d);
    if (d.kind === 'osm') setPlaceDetails(null);
  }, []);

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
    setSelected(null);
    updateParam('vertical', value);
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

  const showLoading = isDataLoading && allMarkers.length === 0;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="px-4 py-3 bg-background/95 border-b border-border z-10 space-y-2">
          <MapSearchBox onSelect={handleSearchSelect} language={language as 'ru' | 'en'} />

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {language === 'ru' ? 'Категория' : 'Category'}
            </p>
            <FilterChipGroup scrollable>
              {FILTER_OPTIONS.map((opt) => (
                <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} icon={opt.icon} isActive={selectedVertical === opt.value} onToggle={() => handleFilterChange(opt.value)} size="md" />
              ))}
            </FilterChipGroup>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {language === 'ru' ? 'Цена' : 'Price'}
            </p>
            <FilterChipGroup scrollable>
              {PRICE_OPTIONS.map((opt) => (
                <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} icon={opt.icon} isActive={selectedPrice === opt.value} onToggle={() => { setSelectedPrice(opt.value); updateParam('price', opt.value); }} size="md" />
              ))}
            </FilterChipGroup>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {language === 'ru' ? 'Доступность' : 'Availability'}
            </p>
            <FilterChipGroup scrollable>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} icon={opt.icon} isActive={selectedAvailability === opt.value} onToggle={() => { setSelectedAvailability(opt.value); updateParam('availability', opt.value); }} size="md" />
              ))}
            </FilterChipGroup>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {language === 'ru' ? 'OSM места (OpenStreetMap)' : 'OSM places (OpenStreetMap)'}
            </p>
            <FilterChipGroup scrollable>
              <FilterChip label={language === 'ru' ? (showOsm ? 'Скрыть OSM' : 'Показать OSM') : (showOsm ? 'Hide OSM' : 'Show OSM')} icon="🗺️" isActive={showOsm} onToggle={() => setShowOsm((v) => !v)} size="md" />
              {showOsm && OSM_CATEGORIES.map((c) => (
                <FilterChip key={c} label={c === 'all' ? (language === 'ru' ? 'Все OSM' : 'All OSM') : c} isActive={osmCategory === c} onToggle={() => setOsmCategory(c)} size="md" />
              ))}
            </FilterChipGroup>
          </div>

          {!showLoading && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {filteredMarkers.length}
                {showOsm ? ` + ${osmPois?.length ?? 0} OSM` : ''}{' '}
                {language === 'ru' ? 'локаций' : 'locations'}
              </p>
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetAllFilters} className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm px-1">
                  {language === 'ru' ? `Сбросить (${activeFilterCount})` : `Clear (${activeFilterCount})`}
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
          ) : (
            <MapLibreMap
              ref={mapRef}
              center={defaultCenter}
              zoom={11}
              markers={mlMarkers}
              onMarkerClick={handleMarkerClick}
              fitToMarkers={mlMarkers.length > 0 && mlMarkers.length < 200 && !searchPin}
              className="absolute inset-0"
              locateLabel={language === 'ru' ? 'Найти меня' : 'Find me'}
            />
          )}

          {searchPin && (
            <div className="absolute top-3 left-3 right-3 md:right-auto md:max-w-sm bg-card border border-border rounded-md shadow-lg px-3 py-2 z-20 flex items-start gap-2">
              <span className="text-primary">📍</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{searchPin.label}</p>
                {searchPin.sublabel && (
                  <p className="text-[11px] text-muted-foreground truncate">{searchPin.sublabel}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSearchPin(null)}
                className="p-1 rounded hover:bg-muted shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Marker detail panel */}

          {selected && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-card border border-border rounded-lg shadow-xl p-3 z-20">
              <button
                type="button"
                aria-label="Close"
                onClick={() => { setSelected(null); setPlaceDetails(null); }}
                className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>

              {selected.kind === 'vendor' && (() => {
                const m = selected.marker;
                const cfg = VERTICAL_CONFIG[m.vertical as Exclude<VerticalFilter, 'all'>];
                return (
                  <button
                    type="button"
                    onClick={() => cfg && navigate(cfg.route(m.id))}
                    className="text-left w-full pr-6"
                  >
                    {m.image && (
                      <img src={m.image} alt="" className="w-full h-32 object-cover rounded mb-2" loading="lazy" />
                    )}
                    <div className="font-semibold text-sm">{language === 'ru' ? m.nameRu : m.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {cfg?.icon} {language === 'ru' ? cfg?.labelRu : cfg?.labelEn}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {m.rating > 0 && <span>⭐ {m.rating.toFixed(1)}</span>}
                      {m.priceFrom > 0 && <span className="text-primary font-medium">{formatPrice(m.priceFrom)}+</span>}
                    </div>
                  </button>
                );
              })()}

              {selected.kind === 'osm' && (() => {
                const p = selected.poi;
                return (
                  <div className="space-y-2 pr-6">
                    <div className="font-semibold text-sm">{p.name || p.category}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {p.category}{p.subcategory ? ` · ${p.subcategory}` : ''}
                    </div>
                    {!placeDetails && !placeLoading && (
                      <button type="button" onClick={() => loadPlaceDetails(p)} className="text-xs text-primary hover:underline">
                        {language === 'ru' ? 'Загрузить детали Google' : 'Load Google details'}
                      </button>
                    )}
                    {placeLoading && (
                      <div className="text-xs text-muted-foreground">{language === 'ru' ? 'Загрузка…' : 'Loading…'}</div>
                    )}
                    {placeDetails && (
                      <div className="space-y-1 text-xs">
                        {placeDetails.rating && <div>⭐ {placeDetails.rating} ({placeDetails.user_ratings_total ?? 0})</div>}
                        {placeDetails.formatted_address && <div className="text-muted-foreground">{placeDetails.formatted_address}</div>}
                        {placeDetails.formatted_phone_number && (
                          <a href={`tel:${placeDetails.formatted_phone_number}`} className="text-primary block">📞 {placeDetails.formatted_phone_number}</a>
                        )}
                        {placeDetails.website && (
                          <a href={placeDetails.website} target="_blank" rel="noopener noreferrer" className="text-primary block truncate">🌐 {placeDetails.website}</a>
                        )}
                        {placeDetails.opening_hours?.open_now != null && (
                          <div>{placeDetails.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
