/**
 * PropertySearchPage — Full catalog grid with filters
 * All primary filters live inside AirbnbSearchBar; this page reads them from URL.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, SlidersHorizontal, Loader2, Building2, ChevronDown, Map as MapIcon, List } from 'lucide-react';
import { NextStepNudge } from '@/components/hints/NextStepNudge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UniversalFilter, FilterValues } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyCategoryIcons } from '@/components/property/PropertyCategoryIcons';
import { PropertyMode } from '@/components/property/PropertyCategoryRibbon';
import { matchesCategory } from '@/components/property/PropertyCategoryIcons';
import { applyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { normalizeForFilter } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';
import { PropertySortSelect, PropertySortKey } from '@/components/property/PropertySortSelect';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { OffplanCTASection } from '@/components/property/OffplanCTASection';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { differenceInDays } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function PropertySearchPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();
  const isRu = language === 'ru';

  const [propertyMode, setPropertyMode] = useState<PropertyMode>(
    (searchParamsUrl.get('mode') as PropertyMode) || 'rent'
  );

  // Parse all search params from URL (set by AirbnbSearchBar)
  const [searchParams, setSearchParams] = useState<SearchParams>(() => {
    const checkInStr = searchParamsUrl.get('checkIn');
    const checkOutStr = searchParamsUrl.get('checkOut');
    const guestsStr = searchParamsUrl.get('guests');
    const bedroomsStr = searchParamsUrl.get('bedrooms');
    const typesStr = searchParamsUrl.get('types');
    const amenitiesStr = searchParamsUrl.get('amenities');
    const instantStr = searchParamsUrl.get('instant');
    return {
      locations: searchParamsUrl.get('district') ? [searchParamsUrl.get('district')!] : [],
      checkIn: checkInStr ? new Date(checkInStr) : undefined,
      checkOut: checkOutStr ? new Date(checkOutStr) : undefined,
      guests: guestsStr ? parseInt(guestsStr, 10) : 2,
      bedrooms: bedroomsStr ? bedroomsStr.split(',') : [],
      propertyTypes: typesStr ? typesStr.split(',') : [],
      amenities: amenitiesStr ? amenitiesStr.split(',') : [],
      instantBooking: instantStr === '1',
    };
  });

  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [sortKey, setSortKey] = useState<PropertySortKey>('recommended');
  const [showMap, setShowMap] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    searchParamsUrl.get('company') || null
  );

  // Calculate nights from selected dates
  const nights = useMemo(() => {
    if (searchParams.checkIn && searchParams.checkOut) {
      return differenceInDays(searchParams.checkOut, searchParams.checkIn);
    }
    return 0;
  }, [searchParams.checkIn, searchParams.checkOut]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowStickyCTA(window.scrollY > 800);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { filterConfig, propertyTypes } = usePropertyFilterOptions();
  const { data: companies = [] } = useManagementCompanies();

  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePropertiesInfinite({
    listingType: propertyMode === 'buy' ? 'sale' : 'rent',
    propertyType: searchParams.propertyTypes.length === 1 ? searchParams.propertyTypes[0] : undefined,
    managementCompanyId: selectedCompanyId || undefined,
  });

  const companyMap = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    for (const c of companies) {
      map.set(c.id, { name: language === 'ru' ? c.name_ru : c.name_en, slug: c.slug });
    }
    return map;
  }, [companies, language]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const properties = useMemo(() => {
    const allItems = infiniteData?.pages.flatMap(p => p.properties) || [];

    const filtered = allItems.filter(prop => {
      // Category icons filter (Airbnb-style ribbon)
      if (categoryFilters.length > 0) {
        if (!categoryFilters.every(cat => matchesCategory(prop, cat))) return false;
      }

      // Amenities from search bar (category-style AND-logic)
      if (searchParams.amenities.length > 0) {
        if (!searchParams.amenities.every(cat => matchesCategory(prop, cat))) return false;
      }

      // Instant book
      if (searchParams.instantBooking && !prop.instant_booking) return false;

      // Multi-type filter
      if (searchParams.propertyTypes.length > 0) {
        const propType = (prop.property_type || '').toLowerCase();
        if (!searchParams.propertyTypes.some(t => propType.includes(t.toLowerCase()))) return false;
      }

      // Location
      const matchesLocation = searchParams.locations.length === 0 ||
        searchParams.locations.some(loc => prop.district?.toLowerCase().includes(loc.toLowerCase()));

      // Guests
      const matchesGuests = !searchParams.guests || (prop.max_guests || 0) >= searchParams.guests;

      // Bedrooms
      const bedroomsToCheck = searchParams.bedrooms.length > 0
        ? searchParams.bedrooms
        : (filterValues.bedrooms
            ? (Array.isArray(filterValues.bedrooms) ? filterValues.bedrooms as string[] : [filterValues.bedrooms as string])
            : []);

      if (bedroomsToCheck.length > 0) {
        const propBedrooms = prop.bedrooms ?? 0;
        const minBedrooms = Math.max(...bedroomsToCheck.map(f => parseInt(f) || 0));
        if (propBedrooms < minBedrooms) return false;
      }

      // Districts from universal filter
      const districtsFromFilter = filterValues.district
        ? (Array.isArray(filterValues.district) ? filterValues.district as string[] : [filterValues.district as string])
        : [];

      if (districtsFromFilter.length > 0) {
        const normalizedDistricts = districtsFromFilter.map(d => normalizeForFilter(d));
        const propDistrict = normalizeForFilter(prop.district || '');
        const matchesDistrict = normalizedDistricts.some(d => propDistrict.includes(d) || d.includes(propDistrict));
        if (!matchesDistrict) return false;
      }

      // Amenities from universal filter
      const amenitiesFromFilter = filterValues.amenities
        ? (Array.isArray(filterValues.amenities) ? filterValues.amenities as string[] : [filterValues.amenities as string])
        : [];
      if (amenitiesFromFilter.length > 0) {
        const propAmenities = (prop.amenities || []).map(a => a.toLowerCase());
        if (!amenitiesFromFilter.every(f => propAmenities.some(a => a.includes(f.toLowerCase())))) return false;
      }

      return matchesLocation && matchesGuests;
    }) as unknown as Property[];

    const quickFiltered = applyQuickFilters(filtered, quickFilters, null);

    const sorted = [...quickFiltered];
    switch (sortKey) {
      case 'price_asc': sorted.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_desc': sorted.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'rating': sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      default: break;
    }

    return sorted;
  }, [infiniteData, searchParams, filterValues, quickFilters, sortKey, categoryFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([, value]) => {
      if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    count += searchParams.bedrooms.length;
    count += searchParams.propertyTypes.length;
    count += searchParams.amenities.length;
    count += searchParams.locations.length;
    if (searchParams.instantBooking) count++;
    count += quickFilters.length;
    return count;
  }, [filterValues, quickFilters, searchParams]);

  const handleSearchUpdate = (params: SearchParams) => {
    setSearchParams(params);
    // Sync URL
    const qp = new URLSearchParams();
    if (params.locations.length > 0) qp.set('district', params.locations[0]);
    if (params.checkIn) qp.set('checkIn', params.checkIn.toISOString());
    if (params.checkOut) qp.set('checkOut', params.checkOut.toISOString());
    if (params.guests) qp.set('guests', String(params.guests));
    if (params.bedrooms.length > 0) qp.set('bedrooms', params.bedrooms.join(','));
    if (params.propertyTypes.length > 0) qp.set('types', params.propertyTypes.join(','));
    if (params.amenities.length > 0) qp.set('amenities', params.amenities.join(','));
    if (params.instantBooking) qp.set('instant', '1');
    qp.set('mode', propertyMode);
    setSearchParamsUrl(qp, { replace: true });
  };

  const clearAllFilters = () => {
    setFilterValues({});
    setQuickFilters([]);
    setCategoryFilters([]);
    setSelectedCompanyId(null);
    setSearchParams({
      locations: [],
      checkIn: undefined,
      checkOut: undefined,
      guests: 2,
      bedrooms: [],
      propertyTypes: [],
      amenities: [],
      instantBooking: false,
    });
  };

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        {/* Sticky header */}
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <BackButton fallbackPath="/property" variant="ghost" size="sm" className="shrink-0" />
              <div className="flex-1">
                <AirbnbSearchBar onSearch={handleSearchUpdate} />
              </div>
            </div>
          </div>

          {/* Minimal secondary filter row: Company + More Filters */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Company Popover */}
              {companies.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all shrink-0",
                      selectedCompanyId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/40 hover:shadow-sm"
                    )}>
                      <Building2 className="w-3.5 h-3.5" />
                      <span>
                        {selectedCompanyId
                          ? (() => {
                              const c = companies.find(c => c.id === selectedCompanyId);
                              return c ? (isRu ? c.name_ru : c.name_en) : (isRu ? 'УК' : 'Company');
                            })()
                          : (isRu ? 'УК' : 'Company')
                        }
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-popover z-50" align="start" sideOffset={6}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCompanyId(null)}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors", !selectedCompanyId ? "bg-primary/10 text-primary" : "hover:bg-muted")}
                      >
                        <span className="flex-1 text-left">{isRu ? 'Все' : 'All'}</span>
                      </button>
                      {companies.map(c => {
                        const label = isRu ? c.name_ru : c.name_en;
                        return (
                          <button key={c.id} onClick={() => setSelectedCompanyId(c.id === selectedCompanyId ? null : c.id)} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors", selectedCompanyId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                            <span className="flex-1 text-left">{label}</span>
                            {selectedCompanyId === c.id && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* More filters (UniversalFilter) */}
              <UniversalFilter
                config={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              >
                <button className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all shrink-0",
                  Object.keys(filterValues).length > 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/40 hover:shadow-sm"
                )}>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isRu ? 'Фильтры' : 'Filters'}</span>
                  {Object.keys(filterValues).length > 0 && <span className="ml-0.5">({Object.keys(filterValues).length})</span>}
                </button>
              </UniversalFilter>
            </div>
          </div>
        </header>

        {/* Airbnb-style Category Ribbon */}
        <div className="border-b">
          <PropertyCategoryIcons
            selected={categoryFilters}
            onSelect={setCategoryFilters}
          />
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {properties.length} {isRu ? 'объектов найдено' : 'places found'}
            </p>
            <div className="flex items-center gap-2">
              <PropertySortSelect value={sortKey} onChange={setSortKey} />
              {/* Map toggle */}
              <Button
                variant={showMap ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 h-8 rounded-full text-xs"
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? <List className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
                {showMap ? (isRu ? 'Список' : 'List') : (isRu ? 'Карта' : 'Map')}
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAllFilters}>
                  {isRu ? 'Сбросить' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="px-4 mb-4">
            <PropertyMapView
              properties={properties}
              hoveredProperty={hoveredProperty}
              onHover={setHoveredProperty}
              mode={propertyMode}
              nights={nights > 0 ? nights : undefined}
            />
          </div>
        )}

        <main className="px-4 pb-24">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && properties.length > 0 && (
            <>
              <NextStepNudge
                message={isRu ? 'Нажмите на карточку для подробностей' : 'Tap a card for details'}
                direction="down"
                visible={true}
                hintId="property-search-tap-card"
                className="mb-4 w-fit mx-auto"
              />
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {properties.map(property => {
                  const mc = (property as any).management_company_id ? companyMap.get((property as any).management_company_id) : undefined;
                  return (
                    <PropertyListingCard
                      key={property.id}
                      property={property}
                      mode={propertyMode}
                      isHovered={hoveredProperty === property.id}
                      onHover={setHoveredProperty}
                      companyName={mc?.name}
                      companySlug={mc?.slug}
                      nights={nights > 0 ? nights : undefined}
                    />
                  );
                })}
              </div>
            </>
          )}

          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            {!isLoading && !hasNextPage && properties.length > 0 && (
              <p className="text-sm text-muted-foreground">{isRu ? 'Все объекты загружены' : 'All properties loaded'}</p>
            )}
          </div>

          {!isLoading && properties.length === 0 && (
            <div className="text-center py-16">
              <Home className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{isRu ? 'Ничего не найдено' : 'No properties found'}</h3>
              <p className="text-muted-foreground mb-4">{isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}</p>
              <Button variant="outline" onClick={clearAllFilters}>
                {isRu ? 'Сбросить фильтры' : 'Reset filters'}
              </Button>
            </div>
          )}

          <OffplanCTASection className="mt-8" />
          <CrossSellSection currentVertical="property" className="mt-8 px-4" />

          {showStickyCTA && <VerticalCTA vertical="property" variant="sticky" context="list" />}
        </main>
      </div>
    </AppLayout>
  );
}
