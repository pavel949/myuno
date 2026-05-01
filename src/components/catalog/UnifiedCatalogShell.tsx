/**
 * UnifiedCatalogShell — single shell for ALL mini-app catalogs.
 *
 * Composes:
 *   - MiniAppLayout (existing chrome: hero, search, categories, filter modal)
 *   - useUrlFilterState (search/category/view/filters in URL query params)
 *   - UnifiedCatalogMap (Google map with markers)
 *   - List/Map toggle in header actions
 *   - Universal geo (distance) filter, applied client-side to markers
 *
 * Usage:
 *   <UnifiedCatalogShell
 *     title="Pharmacies"
 *     items={pharmacies}
 *     toMarker={(p) => ({ id: p.id, lat: p.lat, lng: p.lng, title: p.name_en, ... })}
 *     filterConfig={withGeoSection(pharmacyFilterConfig)}
 *     applyFilters={(items, { search, category, filters }) => filtered}
 *     renderItem={(p) => <ItemCard ... />}
 *   />
 */
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { MiniAppLayout, type MiniAppCategory } from '@/components/miniapp';
import { UnifiedCatalogMap, type UnifiedMapMarker } from '@/components/map/UnifiedCatalogMap';
import { useUrlFilterState, type CatalogView } from '@/hooks/useUrlFilterState';
import type { FilterConfig, FilterValues } from '@/components/filters/UniversalFilter';
import { getDefaultCenter, DEFAULT_CITY } from '@/lib/config';

export interface UnifiedCatalogShellProps<T> {
  // Layout
  title: string;
  subtitle?: string;
  fallbackPath?: string;
  showHero?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;

  // Data
  items: T[] | undefined;
  isLoading?: boolean;
  /** Map row → unified marker. Return null if row has no coords. */
  toMarker: (row: T) => UnifiedMapMarker | null;
  /** Pure client-side filtering function. Receives current state. */
  applyFilters?: (items: T[], state: { search: string; category: string; filters: FilterValues }) => T[];

  // Categories (top chips)
  categories?: MiniAppCategory[];
  defaultCategory?: string;

  // Filters (modal)
  filterConfig?: FilterConfig;

  // Search
  showSearch?: boolean;
  searchPlaceholder?: string;

  // List render
  renderItem: (item: T) => ReactNode;
  renderList?: (items: T[]) => ReactNode;
  emptyText?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;

  // Map
  enableMap?: boolean;
  /** Callback when a marker InfoWindow is clicked. */
  onMarkerSelect?: (id: string) => void;
  /** Single-char emoji for marker label. */
  mapIconChar?: string;

  // Misc
  defaultView?: CatalogView;
  contentClassName?: string;
  headerActions?: ReactNode;
}

export function UnifiedCatalogShell<T extends { id: string }>(
  props: UnifiedCatalogShellProps<T>,
) {
  const {
    title,
    subtitle,
    fallbackPath = '/discover',
    showHero = false,
    heroTitle,
    heroSubtitle,
    items,
    isLoading,
    toMarker,
    applyFilters,
    categories,
    defaultCategory = 'all',
    filterConfig,
    showSearch = true,
    searchPlaceholder,
    renderItem,
    renderList,
    emptyText,
    emptyIcon,
    enableMap = true,
    onMarkerSelect,
    mapIconChar,
    defaultView = 'list',
    contentClassName,
    headerActions,
  } = props;

  const { language } = useLanguage();
  const isRu = language === 'ru';

  const {
    search,
    category,
    view,
    filters,
    setSearch,
    setCategory,
    setView,
    setFilters,
    activeFilterCount,
  } = useUrlFilterState({ defaultCategory, defaultView });

  // Geolocation for distance filter & map
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!enableMap || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(getDefaultCenter(DEFAULT_CITY)),
      { timeout: 5000 },
    );
  }, [enableMap]);

  // Apply filters
  const filteredItems = useMemo(() => {
    const base = items ?? [];
    if (!applyFilters) return base;
    return applyFilters(base, { search, category, filters });
  }, [items, applyFilters, search, category, filters]);

  // Markers for map
  const markers = useMemo(() => {
    return filteredItems
      .map(toMarker)
      .filter((m): m is UnifiedMapMarker => m !== null);
  }, [filteredItems, toMarker]);

  // Distance filter (client-side, applied via UnifiedCatalogMap; for list view filter here too)
  const distanceKm = useMemo(() => {
    const v = filters.distance;
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [filters.distance]);

  const filteredForList = useMemo(() => {
    if (!distanceKm || !userLocation) return filteredItems;
    const within = new Set(
      markers
        .filter((m) => {
          const R = 6371;
          const dLat = ((m.lat - userLocation.lat) * Math.PI) / 180;
          const dLng = ((m.lng - userLocation.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((userLocation.lat * Math.PI) / 180) *
              Math.cos((m.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= distanceKm;
        })
        .map((m) => m.id),
    );
    return filteredItems.filter((i) => within.has(i.id));
  }, [filteredItems, markers, distanceKm, userLocation]);

  // View toggle in header
  const viewToggle = enableMap ? (
    <div className="flex items-center bg-muted">
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        className={cn('h-8 px-2 rounded-none', view === 'list' && 'shadow-sm')}
        onClick={() => setView('list')}
        aria-label={isRu ? 'Список' : 'List'}
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant={view === 'map' ? 'default' : 'ghost'}
        size="sm"
        className={cn('h-8 px-2 rounded-none', view === 'map' && 'shadow-sm')}
        onClick={() => setView('map')}
        aria-label={isRu ? 'Карта' : 'Map'}
      >
        <MapPin className="w-4 h-4" />
      </Button>
    </div>
  ) : null;

  const combinedHeaderActions = (
    <div className="flex items-center gap-2">
      {viewToggle}
      {headerActions}
    </div>
  );

  // Map view: render full-bleed map instead of list children
  if (view === 'map' && enableMap) {
    return (
      <MiniAppLayout
        title={title}
        subtitle={subtitle ?? `${markers.length} ${isRu ? 'на карте' : 'on map'}`}
        fallbackPath={fallbackPath}
        showHero={false}
        showSearch={showSearch}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        categories={categories}
        selectedCategory={category}
        onCategoryChange={setCategory}
        filterConfig={filterConfig}
        filterValues={filters}
        onFilterChange={setFilters}
        filterActiveCount={activeFilterCount}
        showFilter={!!filterConfig}
        headerActions={combinedHeaderActions}
        contentClassName="!p-0"
      >
        <UnifiedCatalogMap
          markers={markers}
          userLocation={userLocation}
          distanceKm={distanceKm}
          onSelect={onMarkerSelect}
          iconChar={mapIconChar}
          className="h-[calc(100vh-260px)] min-h-[400px] w-full"
          emptyMessage={
            markers.length === 0
              ? isRu
                ? 'Нет объектов с координатами'
                : 'No items with coordinates'
              : undefined
          }
        />
      </MiniAppLayout>
    );
  }

  // List view
  return (
    <MiniAppLayout
      title={title}
      subtitle={subtitle ?? `${filteredForList.length} ${isRu ? 'найдено' : 'found'}`}
      fallbackPath={fallbackPath}
      showHero={showHero}
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      showSearch={showSearch}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder}
      categories={categories}
      selectedCategory={category}
      onCategoryChange={setCategory}
      filterConfig={filterConfig}
      filterValues={filters}
      onFilterChange={setFilters}
      filterActiveCount={activeFilterCount}
      showFilter={!!filterConfig}
      headerActions={combinedHeaderActions}
      isLoading={isLoading}
      isEmpty={!isLoading && filteredForList.length === 0}
      emptyText={emptyText}
      emptyIcon={emptyIcon}
      contentClassName={contentClassName}
    >
      {renderList ? renderList(filteredForList) : (
        <div className="grid gap-4">
          {filteredForList.map((item) => (
            <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}

export default UnifiedCatalogShell;
