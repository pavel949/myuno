import { ProjectStartingPrice } from '@/components/newbuilds/ProjectStartingPrice';
import { projectStartingPriceText } from '@/lib/real-estate/publicNewbuildPresentation';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, X, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { usePropertiesForMap, transformPropertiesToMarkers } from '@/hooks/useProperties';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';
import { PHUKET_MAP_BOUNDS, isInPhuketMapCoverage } from '@/lib/map/basemap';
import { APP_ROUTES } from '@/lib/config/routes';
import { isMapOpenNow } from '@/lib/map/openNow';
import { MapLibreMap, MapMarker, MapLibreMapHandle } from '@/components/map/MapLibreMap';
import { MapSearchBox, MapSearchResult, MapSearchBoxHandle } from '@/components/map/MapSearchBox';
import { MapListBottomSheet } from '@/components/map/MapListBottomSheet';
import { MapListItem } from '@/components/map/MapListItem';
import { useMapListSync } from '@/hooks/useMapListSync';
import { EXPERIENCE_CATEGORIES } from '@/hooks/useExperiences';
import { useExploreLayers } from '@/hooks/useExploreLayers';
import { PoiClaimSheet, type ClaimablePoi } from '@/components/map/PoiClaimSheet';


type VerticalFilter =
  | 'all'
  | 'stay'
  | 'rent'
  | 'sale'
  | 'newbuild'
  | 'experience'
  | 'service'
  | 'commercial'
  | 'land'
  | 'beauty'
  | 'restaurant'
  | 'fitness'
  | 'pharmacy'
  | 'vet'
  | 'flowers'
  | 'venue'
  | 'event'
  | 'community';
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
  priceFrom: number | null;
  image?: string;
  vertical: VerticalFilter;
  workingHours?: Record<string, string> | null;
  approximate?: boolean;
  routeId?: string;
  href?: string;
  currency?: string | null;
  pricePeriod?: string | null;
  district?: string;
  projectId?: string;
  propertyType?: string;
  bedrooms?: number;
  category?: string;
  locationKind?: 'place' | 'meeting_point';
}

const VERTICAL_CONFIG: Record<
  Exclude<VerticalFilter, 'all'>,
  { icon: string; color: string; labelEn: string; labelRu: string; route: (id: string) => string }
> = {
  stay: { icon: '🛏️', color: 'hsl(var(--cat-real-estate))', labelEn: 'Short stays', labelRu: 'Посуточная аренда', route: (id) => APP_ROUTES.PROPERTY_DETAIL(id) },
  rent: { icon: '🔑', color: 'hsl(var(--accent-indigo))', labelEn: 'Long-term', labelRu: 'Долгосрочная аренда', route: (id) => APP_ROUTES.PROPERTY_DETAIL(id) },
  sale: { icon: '🏷️', color: 'hsl(var(--accent-coral))', labelEn: 'Resale homes', labelRu: 'Вторичное жильё', route: (id) => APP_ROUTES.PROPERTY_DETAIL(id) },
  newbuild: { icon: '🏗️', color: 'hsl(var(--accent-amber))', labelEn: 'New developments', labelRu: 'Новостройки', route: (id) => APP_ROUTES.OFFPLAN_DETAIL(id) },
  experience: { icon: '✦', color: 'hsl(var(--cat-tourism))', labelEn: 'Experiences', labelRu: 'Впечатления', route: (id) => APP_ROUTES.EXPERIENCE_DETAIL(id) },
  service: { icon: '🛠️', color: 'hsl(var(--accent-emerald))', labelEn: 'Services', labelRu: 'Услуги', route: (id) => `/services/provider/${id}` },
  commercial: { icon: '🏢', color: '#C9A84C', labelEn: 'Commercial', labelRu: 'Коммерческая недвижимость', route: (id) => `/property/commercial/${id}` },
  land: { icon: '🌾', color: '#A0784A', labelEn: 'Land', labelRu: 'Земельные участки', route: (id) => `/property/land/${id}` },
  beauty: { icon: '💇', color: 'hsl(var(--accent-emerald))', labelEn: 'Beauty', labelRu: 'Красота', route: (id) => `/beauty/salon/${id}` },
  restaurant: { icon: '🍽️', color: 'hsl(var(--cat-food))', labelEn: 'Restaurants', labelRu: 'Рестораны', route: (id) => `/restaurants/${id}` },
  fitness: { icon: '🏋️', color: 'hsl(var(--accent-emerald))', labelEn: 'Fitness', labelRu: 'Фитнес', route: (id) => `/fitness/gym/${id}` },
  pharmacy: { icon: '💊', color: 'hsl(var(--accent-emerald))', labelEn: 'Pharmacy', labelRu: 'Аптеки', route: (id) => `/pharmacy/${id}` },
  vet: { icon: '🐾', color: 'hsl(var(--accent-emerald))', labelEn: 'Vet', labelRu: 'Ветеринарные клиники', route: (id) => `${APP_ROUTES.VETERINARY}?clinic=${encodeURIComponent(id)}` },
  flowers: { icon: '💐', color: '#e11d48', labelEn: 'Flowers', labelRu: 'Цветы', route: (id) => `/flowers/shop/${id}` },
  venue: { icon: '🏛️', color: '#7c3aed', labelEn: 'Venues', labelRu: 'Площадки', route: (id) => `/venues/${id}` },
  event: { icon: '🎉', color: '#f59e0b', labelEn: 'Events', labelRu: 'События', route: (id) => APP_ROUTES.EVENT_DETAIL(id) },
  community: { icon: '🛕', color: '#0A2240', labelEn: 'Communities', labelRu: 'Сообщества', route: (id) => `/communities/${id}` },
};

const FILTER_OPTIONS: { value: VerticalFilter; labelEn: string; labelRu: string; icon: string }[] = [
  { value: 'all', labelEn: 'All', labelRu: 'Все', icon: '🗺️' },
  { value: 'stay', labelEn: 'Short stays', labelRu: 'Посуточная аренда', icon: '🛏️' },
  { value: 'rent', labelEn: 'Long-term', labelRu: 'Долгосрочная аренда', icon: '🔑' },
  { value: 'sale', labelEn: 'Resale homes', labelRu: 'Вторичное жильё', icon: '🏷️' },
  { value: 'newbuild', labelEn: 'New developments', labelRu: 'Новостройки', icon: '🏗️' },
  { value: 'experience', labelEn: 'Experiences', labelRu: 'Впечатления', icon: '✦' },
  { value: 'service', labelEn: 'Services', labelRu: 'Услуги', icon: '🛠️' },
  { value: 'commercial', labelEn: 'Commercial', labelRu: 'Коммерч.', icon: '🏢' },
  { value: 'land', labelEn: 'Land', labelRu: 'Земельные участки', icon: '🌾' },
  { value: 'beauty', labelEn: 'Beauty', labelRu: 'Красота', icon: '💇' },
  { value: 'restaurant', labelEn: 'Restaurants', labelRu: 'Рестораны', icon: '🍽️' },
  { value: 'fitness', labelEn: 'Fitness', labelRu: 'Фитнес', icon: '🏋️' },
  { value: 'pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптеки', icon: '💊' },
  { value: 'vet', labelEn: 'Vet', labelRu: 'Ветеринарные клиники', icon: '🐾' },
  { value: 'flowers', labelEn: 'Flowers', labelRu: 'Цветы', icon: '💐' },
  { value: 'venue', labelEn: 'Venues', labelRu: 'Площадки', icon: '🏛️' },
  { value: 'event', labelEn: 'Events', labelRu: 'События', icon: '🎉' },
  { value: 'community', labelEn: 'Communities', labelRu: 'Сообщества', icon: '🛕' },
];

const STATIONARY_SERVICE_LAYERS: VerticalFilter[] = ['beauty', 'fitness', 'pharmacy', 'vet'];

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

  // URL is the source of truth, including browser Back/Forward and shared links.
  const selectedLayers = useMemo(() => (searchParams.get('layers') ?? searchParams.get('vertical') ?? '')
    .split(',').filter((value): value is Exclude<VerticalFilter, 'all'> => value !== 'all' && FILTER_OPTIONS.some((option) => option.value === value)), [searchParams]);
  const selectedVertical: VerticalFilter = selectedLayers.length === 1 ? selectedLayers[0] : 'all';
  const selectedPrice: PriceFilter = PRICE_OPTIONS.some((option) => option.value === searchParams.get('price')) ? searchParams.get('price') as PriceFilter : 'all';
  const selectedAvailability: AvailabilityFilter = searchParams.get('availability') === 'open_now' ? 'open_now' : 'all';
  const [showMoreLayers, setShowMoreLayers] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selected, setSelected] = useState<ClickedMarker>(null);
  const { selectedId: focusedMarkerId, select: selectMarker } = useMapListSync();
  const activeMarkerId = focusedMarkerId ?? undefined;
  const mapRef = useRef<MapLibreMapHandle | null>(null);
  const searchBoxRef = useRef<MapSearchBoxHandle | null>(null);
  const [searchPin, setSearchPin] = useState<MapSearchResult | null>(null);

  const [searchOutsideCoverage, setSearchOutsideCoverage] = useState(false);
  const handleSearchSelect = useCallback((r: MapSearchResult) => {
    if (!isInPhuketMapCoverage(r.lat, r.lng)) {
      setSearchPin(null);
      setSearchOutsideCoverage(true);
      return;
    }
    setSearchOutsideCoverage(false);
    setSearchPin(r);
    mapRef.current?.flyTo(r.lat, r.lng, 16);
    selectMarker(null);
  }, [selectMarker]);



  // Fetch data from all verticals
  const { data: properties, isLoading: propLoading, isError: propError } = usePropertiesForMap({});
  const { data: exploreItems, isLoading: exploreLoading, layerErrors = [], missingCoordinates = 0, isError: exploreError } = useExploreLayers();

  const { data: salons, isLoading: salonLoading, isError: salonError } = useQuery({
    queryKey: ['salons-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_salon_catalog')
        .select('id, name_en, name_ru, lat, lng, rating, price_from, cover_image')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: restaurants, isLoading: restLoading, error: restaurantError } = useQuery({
    queryKey: ['restaurants-map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('restaurants')
        .select('id, name_en, name_ru, lat, lng, rating, cover_image, district, cuisine, working_hours')
        .eq('is_active', true).eq('approval_status', 'approved')
        .not('lat', 'is', null).not('lng', 'is', null);
      if (error) throw error;
      return data || [];
    },
  });

  const useGeoLayer = (table: 'gyms' | 'pharmacies' | 'veterinary_clinics' | 'flower_shops' | 'venues') =>
    useQuery({
      queryKey: [`${table}-map`],
      queryFn: async () => {
        // Narrow the table union before building the query so approval_status
        // is only requested from schemas that actually expose it.
        const columns = 'id, name_en, name_ru, lat, lng, cover_image';
        const query = table === 'gyms' || table === 'pharmacies' || table === 'flower_shops'
          ? supabase.from(table).select(columns).eq('approval_status', 'approved')
          : supabase.from(table).select(columns);
        const { data, error } = await query.eq('is_active', true)
          .not('lat', 'is', null).not('lng', 'is', null);
        if (error) throw error;
        return data || [];
      },
    });

  const { data: gyms, isLoading: gymLoading, isError: gymError } = useGeoLayer('gyms');
  const { data: pharmacies, isLoading: pharmLoading, isError: pharmError } = useGeoLayer('pharmacies');
  const { data: vets, isLoading: vetLoading, isError: vetError } = useGeoLayer('veterinary_clinics');
  const { data: flowerShops, isLoading: flowerLoading, isError: flowerError } = useGeoLayer('flower_shops');
  const { data: venues, isLoading: venueLoading, isError: venueError } = useGeoLayer('venues');

  const { data: events, isLoading: eventLoading, isError: eventError } = useQuery({
    queryKey: ['events-map'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('events')
        .select('id, title_en, title_ru, lat, lng, cover_image, price, event_date')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .or(`event_date.is.null,event_date.gte.${today}`);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: communities, isLoading: communityLoading, isError: communityError } = useQuery({
    queryKey: ['communities-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('slug, name_en, name_ru, lat, lng, cover_image_url')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      if (error) throw error;
      return data || [];
    },
  });

  const defaultCenter = useMemo(() => {
    const cityConfig = getCityConfig();
    if (cityConfig && isInPhuketMapCoverage(cityConfig.lat, cityConfig.lng)) return { lat: cityConfig.lat, lng: cityConfig.lng };
    const c = getMapCenter(DEFAULT_CITY);
    return { lat: c[1], lng: c[0] };
  }, [getCityConfig]);

  // OSM POI layer (OpenStreetMap, ODbL). Loaded on toggle.
  const [showOsm, setShowOsm] = useState(false);
  const [osmCategory, setOsmCategory] = useState<string>('all');
  const { data: osmPois } = useQuery({
    queryKey: ['osm-pois', osmCategory, defaultCenter.lat, defaultCenter.lng],
    enabled: showOsm,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const cats = osmCategory === 'all' ? null : [osmCategory];
      const { data, error } = await supabase.rpc('nearby_pois', {
        in_lat: defaultCenter.lat,
        in_lng: defaultCenter.lng,
        in_radius_m: 30000,
        in_categories: cats,
        in_limit: 600,
      });
      if (error) throw error;
      return (data || []).filter((p: any) => p.source === 'osm' && isInPhuketMapCoverage(Number(p.lat), Number(p.lng)));
    },
  });

  const [placeDetails, setPlaceDetails] = useState<any | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [claimPoi, setClaimPoi] = useState<ClaimablePoi | null>(null);

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
    propLoading || exploreLoading || salonLoading || restLoading || gymLoading || pharmLoading || vetLoading || flowerLoading || venueLoading || eventLoading || communityLoading;

  const hasDataError = Boolean(layerErrors.length || exploreError || restaurantError || propError || salonError || gymError || pharmError || vetError || flowerError || venueError || eventError || communityError);

  const locatedMarkers = useMemo<UniversalMarker[]>(() => {
    const markers: UniversalMarker[] = [];
    const propMarkers = transformPropertiesToMarkers(properties || []);
    const acById = new Map<string, 'residential' | 'commercial' | 'land' | null>();
    (properties || []).forEach((p) => acById.set(p.id, p.asset_class ?? 'residential'));
    // Residential listings come from useExploreLayers (split by purpose);
    // this source only feeds the commercial / land layers.
    propMarkers.forEach((m) => {
      const ac = acById.get(m.id);
      if (ac === 'commercial' || ac === 'land') markers.push({ ...m, vertical: ac, priceFrom: null });
    });
    (exploreItems || []).forEach((it) => {
      markers.push({
        id: it.id, name: it.name, nameRu: it.nameRu, lat: it.lat, lng: it.lng,
        rating: it.rating, priceFrom: it.priceFrom, image: it.image,
        vertical: it.layer, approximate: it.approximate, routeId: it.routeId,
        href: it.href, currency: it.currency, pricePeriod: it.pricePeriod,
        district: it.district, projectId: it.projectId, propertyType: it.propertyType,
        bedrooms: it.bedrooms, category: it.category, locationKind: it.locationKind,
      });
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
      if (r.id && r.lat != null && r.lng != null) {
        // Compatibility view stores JSON: only supported string day schedules
        // may enter the open-now parser, never arrays or nested metadata.
        const workingHours: Record<string, string> = {};
        if (r.working_hours && typeof r.working_hours === 'object' && !Array.isArray(r.working_hours)) {
          for (const [day, hours] of Object.entries(r.working_hours)) {
            if (typeof hours === 'string') workingHours[day] = hours;
          }
        }
        markers.push({
          id: r.id, name: r.name_en || r.name_ru || 'Restaurant', nameRu: r.name_ru || r.name_en || 'Ресторан',
          lat: Number(r.lat), lng: Number(r.lng),
          rating: r.rating || 0, priceFrom: 0,
          image: r.cover_image || undefined,
          vertical: 'restaurant', district: r.district || undefined, category: r.cuisine || undefined,
          workingHours: Object.keys(workingHours).length ? workingHours : null,
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

    (communities || []).forEach((c: any) => {
      if (c.lat == null || c.lng == null) return;
      markers.push({
        id: c.slug, name: c.name_en, nameRu: c.name_ru || c.name_en,
        lat: Number(c.lat), lng: Number(c.lng),
        rating: 0, priceFrom: 0,
        image: c.cover_image_url || undefined, vertical: 'community',
      });
    });

    return markers.filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng)
      && Math.abs(marker.lat) <= 90 && Math.abs(marker.lng) <= 180 && (marker.lat !== 0 || marker.lng !== 0));
  }, [properties, exploreItems, salons, restaurants, gyms, pharmacies, vets, flowerShops, venues, events, communities]);

  // The page uses the Phuket archive. Other-city records remain untouched in
  // their catalogues, but must not pull fitBounds beyond the available map.
  const allMarkers = useMemo(() => locatedMarkers.filter(marker => isInPhuketMapCoverage(marker.lat, marker.lng)), [locatedMarkers]);
  const outsideCoverageCount = locatedMarkers.length - allMarkers.length;

  const filteredMarkers = useMemo(() => {
    return allMarkers.filter((m) => {
      if (searchParams.get('district') && m.district !== searchParams.get('district')) return false;
      if (searchParams.get('propertyType') && m.propertyType !== searchParams.get('propertyType')) return false;
      if (searchParams.get('project') && m.projectId !== searchParams.get('project')) return false;
      if (searchParams.get('bedrooms') && (m.bedrooms == null || m.bedrooms < Number(searchParams.get('bedrooms')))) return false;
      if (searchParams.get('category') && m.category !== searchParams.get('category')) return false;
      if (selectedLayers.length && !selectedLayers.includes(m.vertical as Exclude<VerticalFilter, 'all'>)
        && !(selectedLayers.includes('service') && STATIONARY_SERVICE_LAYERS.includes(m.vertical))) return false;
      if (selectedPrice !== 'all' && (m.vertical === 'stay' || m.vertical === 'all')) {
        const [min, max] = PRICE_RANGES[selectedPrice];
        if (m.currency !== 'THB' || m.pricePeriod !== 'night' || m.priceFrom == null || m.priceFrom <= 0 || m.priceFrom < min || m.priceFrom >= max) return false;
      }
      if (selectedAvailability === 'open_now') {
        if (!m.workingHours || !isMapOpenNow(m.workingHours)) return false;
      }
      return true;
    });
  }, [allMarkers, searchParams, selectedLayers, selectedPrice, selectedAvailability]);

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
    selectMarker(m.id);
    if (d.kind === 'osm') setPlaceDetails(null);
    // Sync search input with the clicked marker and try to highlight matching result.
    const label =
      d.kind === 'vendor'
        ? (language === 'ru' ? d.marker.nameRu : d.marker.name) || d.marker.name
        : (d.poi.name || d.poi.category || '');
    const matchId = d.kind === 'osm' ? `local:${d.poi.id}` : undefined;
    if (label && d.kind === 'osm') searchBoxRef.current?.setSelection(label, matchId);
    mapRef.current?.flyTo(m.lat, m.lng, Math.max(14, 11));
  }, [language, selectMarker]);

  // Drive selection from URL (?focus=<id>) and list clicks → set `selected` and fly to marker.
  useEffect(() => {
    if (!focusedMarkerId) {
      setSelected(null);
      return;
    }
    const match = mlMarkers.find((mm) => mm.id === focusedMarkerId);
    if (!match) return;
    setSelected(match.data as ClickedMarker);
    mapRef.current?.flyTo(match.lat, match.lng, Math.max(14, 11));
  }, [focusedMarkerId, mlMarkers]);

  // If active filter removes selected marker — clear selection.
  useEffect(() => {
    if (!focusedMarkerId || isDataLoading) return;
    if (!mlMarkers.find((mm) => mm.id === focusedMarkerId)) {
      selectMarker(null);
    }
  }, [mlMarkers, focusedMarkerId, selectMarker, isDataLoading]);




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
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      const layers = value === 'all' ? [] : selectedLayers.includes(value)
        ? selectedLayers.filter((layer) => layer !== value) : [...selectedLayers, value];
      next.delete('vertical');
      next.delete('focus');
      if (layers.length) next.set('layers', layers.join(',')); else next.delete('layers');
      return next;
    });
  };
  const activeFilterCount = selectedLayers.length + (selectedPrice !== 'all' ? 1 : 0) + (selectedAvailability !== 'all' ? 1 : 0) + ['district', 'project', 'bedrooms', 'category', 'propertyType'].filter((key) => searchParams.has(key)).length;
  const resetAllFilters = () => {
    setShowOsm(false);
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      ['layers', 'vertical', 'price', 'availability', 'focus', 'district', 'project', 'bedrooms', 'category', 'propertyType'].forEach((key) => next.delete(key));
      return next;
    });
  };

  const mapPrice = (marker: UniversalMarker) => {
    if (!marker.priceFrom || marker.priceFrom <= 0) return undefined;
    const value = marker.currency && /^[A-Z]{3}$/.test(marker.currency) && marker.currency !== 'THB'
      ? new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en', { style: 'currency', currency: marker.currency }).format(marker.priceFrom)
      : formatPrice(marker.priceFrom);
    const periods: Record<string, string> = { week: language === 'ru' ? '/нед' : '/week', person: language === 'ru' ? '/чел' : '/person', night: language === 'ru' ? '/ночь' : '/night', month: language === 'ru' ? '/мес' : '/month', year: language === 'ru' ? '/год' : '/year' };
    return `${value}${periods[marker.pricePeriod || ''] || ''}`;
  };
  const districts = [...new Set(allMarkers.map((marker) => marker.district).filter(Boolean))].sort();
  const categories = [...new Set(allMarkers.filter((marker) => !selectedLayers.length || selectedLayers.includes(marker.vertical as Exclude<VerticalFilter, 'all'>)).map((marker) => marker.category).filter(Boolean))].sort();
  const propertyTypes = [...new Set(allMarkers.map((marker) => marker.propertyType).filter(Boolean))].sort();
  const projectsForFilter = [...new Set(allMarkers.map((marker) => marker.projectId).filter(Boolean))];
  const projectNames = new Map((exploreItems || []).filter((item) => item.layer === 'newbuild').map((item) => [item.routeId, language === 'ru' ? item.nameRu : item.name]));

  const showLoading = isDataLoading && allMarkers.length === 0;

  const secondaryFilterCount =
    (selectedPrice !== 'all' ? 1 : 0) +
    (selectedAvailability !== 'all' ? 1 : 0) +
    (showOsm ? 1 : 0) + ['district', 'project', 'bedrooms', 'category', 'propertyType'].filter((key) => searchParams.has(key)).length;

  return (
    <AppLayout usePageContainer={false}>
      <div className="flex flex-col h-[calc(100dvh-var(--shell-header-height,var(--consumer-header-height,3.5rem))-var(--bottom-nav-h,4rem))]">
        <div className="px-4 pt-3 pb-2 bg-background/95 border-b border-border z-10 space-y-2 shrink-0">
          <div><h1 className="text-lg font-semibold tracking-tight">{language === 'ru' ? 'Найдите своё место на Пхукете' : 'Find your place in Phuket'}</h1>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Выберите слои и нажмите на метку, чтобы открыть предложение.' : 'Choose layers and select a pin to explore an offer.'}</p></div>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <MapSearchBox ref={searchBoxRef} onSelect={handleSearchSelect} language={language as 'ru' | 'en'} />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="relative shrink-0 h-10 w-10"
                  aria-label={language === 'ru' ? 'Фильтры' : 'Filters'}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {secondaryFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold flex items-center justify-center">
                      {secondaryFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{language === 'ru' ? 'Фильтры карты' : 'Map filters'}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-sm">{language === 'ru' ? 'Район' : 'Area'}
                      <select className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3" value={searchParams.get('district') || 'all'} onChange={(event) => updateParam('district', event.target.value)}>
                        <option value="all">{language === 'ru' ? 'Все районы' : 'All areas'}</option>
                        {districts.map((district) => <option key={district} value={district}>{district}</option>)}
                      </select>
                    </label>
                    <label className="text-sm">{language === 'ru' ? 'Спальни' : 'Bedrooms'}
                      <select className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3" value={searchParams.get('bedrooms') || 'all'} onChange={(event) => updateParam('bedrooms', event.target.value)}>
                        <option value="all">{language === 'ru' ? 'Любое количество' : 'Any number'}</option>
                        {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}+</option>)}
                      </select>
                    </label>
                    {categories.length > 0 && <label className="text-sm">{language === 'ru' ? 'Категория' : 'Category'}
                      <select className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3" value={searchParams.get('category') || 'all'} onChange={(event) => updateParam('category', event.target.value)}>
                        <option value="all">{language === 'ru' ? 'Все категории' : 'All categories'}</option>
                        {categories.map((category) => <option key={category} value={category}>{EXPERIENCE_CATEGORIES.find((item) => item.id === category)?.[language === 'ru' ? 'labelRu' : 'labelEn'] || category}</option>)}
                      </select>
                    </label>}
                    {projectsForFilter.some((id) => projectNames.has(id)) && <label className="text-sm">{language === 'ru' ? 'Комплекс' : 'Development'}
                      <select className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3" value={searchParams.get('project') || 'all'} onChange={(event) => updateParam('project', event.target.value)}>
                        <option value="all">{language === 'ru' ? 'Все комплексы' : 'All developments'}</option>
                        {projectsForFilter.filter((id) => projectNames.has(id)).map((id) => <option key={id} value={id}>{projectNames.get(id)}</option>)}
                      </select>
                    </label>}
                    <label className="text-sm">{language === 'ru' ? 'Тип жилья' : 'Property type'}
                      <select className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3" value={searchParams.get('propertyType') || 'all'} onChange={(event) => updateParam('propertyType', event.target.value)}>
                        <option value="all">{language === 'ru' ? 'Все типы' : 'All types'}</option>
                        {propertyTypes.map((type) => <option key={type} value={type}>{language === 'ru' ? ({villa: 'Вилла', condo: 'Кондоминиум', apartment: 'Квартира', house: 'Дом', townhouse: 'Таунхаус'}[type] || type) : type}</option>)}
                      </select>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Показываем предложения с сохранённой геопозицией. Доступность на ваши даты уточняется в карточке.' : 'Offers with a saved location are shown. Check date availability on the offer page.'}</p>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {language === 'ru' ? 'Цена за ночь · посуточное жильё' : 'Nightly price · short stays'}
                    </p>
                    {['all', 'stay'].includes(selectedVertical) && (
                      <FilterChipGroup scrollable className="touch-pan-x">
                        {PRICE_OPTIONS.map((opt) => (
                          <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} icon={opt.icon} isActive={selectedPrice === opt.value} onToggle={() => { updateParam('price', opt.value); }} size="md" />
                        ))}
                      </FilterChipGroup>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {language === 'ru' ? 'Доступность' : 'Availability'}
                    </p>
                    <FilterChipGroup scrollable className="touch-pan-x">
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} icon={opt.icon} isActive={selectedAvailability === opt.value} onToggle={() => { updateParam('availability', opt.value); }} size="md" />
                      ))}
                    </FilterChipGroup>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {language === 'ru' ? 'Объекты OpenStreetMap' : 'OSM places (OpenStreetMap)'}
                    </p>
                    <FilterChipGroup scrollable className="touch-pan-x">
                      <FilterChip label={language === 'ru' ? (showOsm ? 'Скрыть объекты OSM' : 'Показать объекты OSM') : (showOsm ? 'Hide OSM' : 'Show OSM')} icon="🗺️" isActive={showOsm} onToggle={() => setShowOsm((v) => !v)} size="md" />
                      {showOsm && OSM_CATEGORIES.map((c) => (
                        <FilterChip key={c} label={c === 'all' ? (language === 'ru' ? 'Все OSM' : 'All OSM') : c} isActive={osmCategory === c} onToggle={() => setOsmCategory(c)} size="md" />
                      ))}
                    </FilterChipGroup>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <FilterChipGroup scrollable className="touch-pan-x">
            {FILTER_OPTIONS.filter((opt) => showMoreLayers || ['all', 'stay', 'rent', 'sale', 'newbuild', 'experience', 'service', 'restaurant'].includes(opt.value)).map((opt) => (
              <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} icon={opt.value === 'all' ? opt.icon : <span aria-hidden data-map-layer-color={opt.value} className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: VERTICAL_CONFIG[opt.value].color }} />} isActive={opt.value === 'all' ? selectedLayers.length === 0 : selectedLayers.includes(opt.value)} onToggle={() => handleFilterChange(opt.value)} aria-pressed={opt.value === 'all' ? selectedLayers.length === 0 : selectedLayers.includes(opt.value)} className="min-h-11 [&>span]:max-w-none" size="md" />
            ))}
          </FilterChipGroup>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowMoreLayers((value) => !value)} aria-expanded={showMoreLayers}>
              {language === 'ru' ? (showMoreLayers ? 'Меньше слоёв' : 'Другие места и услуги') : (showMoreLayers ? 'Fewer layers' : 'More places & services')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowList((value) => !value)} aria-expanded={showList}>
              {language === 'ru' ? (showList ? 'Закрыть список' : 'Показать списком') : (showList ? 'Close list' : 'Show list')}
            </Button>
          </div>
          {hasDataError && <p role="alert" className="text-xs text-destructive">{language === 'ru' ? 'Не все слои удалось загрузить. Часть предложений может отсутствовать.' : 'Some layers could not load. Some offers may be missing.'}</p>}
          {searchOutsideCoverage && <p role="alert" className="text-xs text-muted-foreground">{language === 'ru' ? 'Это место вне покрытия карты Пхукета. Выберите место на Пхукете.' : 'This place is outside the Phuket map coverage. Choose a place in Phuket.'}</p>}
          {outsideCoverageCount > 0 && <p className="text-xs text-muted-foreground">{language === 'ru' ? `Вне покрытия карты Пхукета: ${outsideCoverageCount}.` : `${outsideCoverageCount} offers outside the Phuket map coverage are not shown.`}</p>}
          {missingCoordinates > 0 && <p className="text-xs text-muted-foreground">{language === 'ru' ? `${missingCoordinates} предложений пока без точной геопозиции.` : `${missingCoordinates} offers have no precise location yet.`}</p>}
          {!showLoading && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {filteredMarkers.length}
                {showOsm ? ` + ${osmPois?.length ?? 0} OSM` : ''}{' '}
                {language === 'ru' ? 'объектов на карте' : 'locations'}
              </p>
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetAllFilters} className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm px-1">
                  {language === 'ru' ? `Сбросить фильтры (${activeFilterCount})` : `Clear (${activeFilterCount})`}
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
              coverageBounds={PHUKET_MAP_BOUNDS}
              zoom={11}
              markers={mlMarkers}
              onMarkerClick={handleMarkerClick}
              fitToMarkers={mlMarkers.length > 0 && mlMarkers.length < 200 && !searchPin}
              className="absolute inset-0"
              locateLabel={language === 'ru' ? 'Моё местоположение' : 'Find me'}
              activeMarkerId={activeMarkerId}
            />

          )}

          {searchPin && (
            <div className="absolute top-3 left-3 right-3 md:right-auto md:max-w-sm bg-card border border-border rounded-none shadow-lg px-3 py-2 z-20 flex items-start gap-2">
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
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-card border border-border rounded-xl shadow-xl p-4 z-20 max-h-[65%] overflow-y-auto">
              <span className="inline-block mb-2 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-sm bg-primary text-primary-foreground">
                {language === 'ru' ? 'Вы выбрали' : 'Selected place'}
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => { setSelected(null); setPlaceDetails(null); selectMarker(null); searchBoxRef.current?.clear(); }}
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
                    onClick={() => cfg && navigate(m.href || cfg.route(m.routeId ?? m.id))}
                    className="text-left w-full pr-6"
                  >
                    {m.image && (
                      <img src={m.image} alt="" className="w-full h-32 object-cover rounded mb-2" loading="lazy" />
                    )}
                    <div className="font-semibold text-sm">{language === 'ru' ? m.nameRu : m.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {cfg?.icon} {language === 'ru' ? cfg?.labelRu : cfg?.labelEn}{m.locationKind === 'meeting_point' ? (language === 'ru' ? ' · Точка встречи' : ' · Meeting point') : ''}
                    </div>
                    <span className="mt-3 inline-flex text-sm font-semibold text-primary">{language === 'ru' ? 'Открыть предложение →' : 'View offer →'}</span>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {m.rating > 0 && <span>⭐ {m.rating.toFixed(1)}</span>}
                      {m.vertical === 'newbuild' ? <ProjectStartingPrice price={m.priceFrom} /> : m.priceFrom != null && m.priceFrom > 0 && <span className="text-primary font-medium">{mapPrice(m)}</span>}
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
                        {language === 'ru' ? 'Загрузить детали' : 'Load details'}
                      </button>
                    )}
                    {placeLoading && (
                      <div className="text-xs text-muted-foreground">{language === 'ru' ? 'Загрузка…' : 'Loading…'}</div>
                    )}
                    {placeDetails && (
                      <div className="space-y-1 text-xs">
                        {placeDetails.rating && <div>⭐ {placeDetails.rating} ({placeDetails.user_ratings_total ?? 0})</div>}
                        {placeDetails.formatted_address && <div className="text-muted-foreground">{placeDetails.formatted_address}</div>}
                        {placeDetails.opening_hours?.open_now != null && (
                          <div>{placeDetails.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}</div>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setClaimPoi({
                          name: p.name || p.category,
                          category: p.category ?? null,
                          lat: p.lat != null ? Number(p.lat) : null,
                          lng: p.lng != null ? Number(p.lng) : null,
                          osm_type: p.source === 'osm' ? (p.osm_type ?? 'node') : null,
                          osm_id: p.source === 'osm' && p.source_id ? Number(p.source_id) : null,
                          google_place_id: placeDetails?.place_id ?? null,
                        })
                      }
                      className="mt-2 w-full text-xs font-semibold py-2 rounded-sm bg-primary text-primary-foreground hover:opacity-90"
                    >
                      {language === 'ru' ? '🛡 Это ваш бизнес? Заявить бесплатно' : '🛡 Is this your business? Claim free'}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

      {showList && <MapListBottomSheet
        onClose={() => setShowList(false)}
        closeLabel={language === 'ru' ? 'Закрыть список' : 'Close list'}
        title={
          <span>
            {mlMarkers.length}{' '}
            {language === 'ru' ? 'объектов на карте' : 'locations'}
          </span>
        }
      >
        {mlMarkers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {showLoading ? (language === 'ru' ? 'Загружаем предложения…' : 'Loading offers…') : hasDataError ? (language === 'ru' ? 'Часть данных не загрузилась. Попробуйте обновить страницу.' : 'Some data could not load. Please refresh.') : (language === 'ru' ? 'Нет предложений с точной геопозицией по этим фильтрам.' : 'No offers with a precise location match these filters.')}
          </div>
        ) : (
          <div role="listbox" aria-label={language === 'ru' ? 'Список локаций' : 'Locations list'}>
            {mlMarkers.map((m) => {
              const d = m.data as ClickedMarker;
              const isVendor = d?.kind === 'vendor';
              const vendor = isVendor ? d.marker : null;
              const cfg = vendor ? VERTICAL_CONFIG[vendor.vertical as Exclude<VerticalFilter, 'all'>] : null;
              const title = m.title || '—';
              const subtitle = vendor
                ? `${(language === 'ru' ? cfg?.labelRu : cfg?.labelEn) || ''}${vendor?.approximate ? (language === 'ru' ? ' · примерный район' : ' · approximate area') : ''}`
                : (d?.kind === 'osm' ? `${d.poi.category}${d.poi.subcategory ? ' · ' + d.poi.subcategory : ''}` : '');
              return (
                <MapListItem
                  key={m.id}
                  id={m.id}
                  icon={m.icon}
                  color={m.color}
                  title={title}
                  subtitle={subtitle}
                  rating={vendor?.rating}
                  priceLabel={vendor?.vertical === 'newbuild' ? projectStartingPriceText(vendor.priceFrom, language) : vendor ? mapPrice(vendor) : undefined}
                  isSelected={activeMarkerId === m.id}
                  onSelect={(id) => {
                    setShowList(false);
                    selectMarker(id);
                    // also trigger same flyTo path as marker click
                    const mm = mlMarkers.find((x) => x.id === id);
                    if (mm) {
                      setSelected(mm.data as ClickedMarker);
                      mapRef.current?.flyTo(mm.lat, mm.lng, Math.max(14, 11));
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </MapListBottomSheet>}
        </div>
      </div>
      <PoiClaimSheet open={!!claimPoi} onOpenChange={(v) => !v && setClaimPoi(null)} poi={claimPoi} />
    </AppLayout>
  );
}

