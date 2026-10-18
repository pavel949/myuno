/**
 * PropertySearchPage — Full catalog grid with filters
 * One shared app-style editor; all criteria are hydrated from the catalogue URL.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, SlidersHorizontal, Loader2, Building2, ChevronDown, Map as MapIcon, List } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UniversalFilter, FilterValues } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/uno/BackButton';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { readPropertySearchQuery } from '@/lib/propertySearchQuery';
import { PROPERTY_FEATURE_MAP } from '@/lib/config/propertyFeatures';
import { serializeFilters } from '@/lib/propertyBrowseFilters';
import '@/styles/cinematic-home.css';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyCategoryIcons, matchesCategory } from '@/components/property/PropertyCategoryIcons';
import { applyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterValuesToPropertyFilters, mergeSearchBarIntoFilterValues } from '@/lib/propertyCatalogServerFilters';
import { comparePropertiesForSort } from '@/lib/propertySortPrice';
import { useMapListSync } from '@/hooks/useMapListSync';
import type { PropertyFilters } from '@/hooks/useProperties';
import { CrossSellSection } from '@/components/crosssell';
import { PropertySortSelect, PropertySortKey } from '@/components/property/PropertySortSelect';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { OffplanCTASection } from '@/components/property/OffplanCTASection';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { differenceInDays } from 'date-fns';

export default function PropertySearchPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();
  const isRu = language === 'ru';

  const queryKey = searchParamsUrl.toString();
  const state = useMemo(() => readPropertySearchQuery(new URLSearchParams(queryKey)), [queryKey]);
  const { mode: propertyMode, search: searchParams, filterValues, categories: categoryFilters } = state;
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);
  const { selectedId: focusedId, select: selectFocused } = useMapListSync();
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [sortKey, setSortKey] = useState<PropertySortKey>('recommended');
  const showMap = searchParamsUrl.get('view') === 'map';
  const selectedCompanyId = searchParamsUrl.get('company');
  const setSelectedCompanyId = (id: string | null) => {
    const params = new URLSearchParams(searchParamsUrl);
    if (id) params.set('company', id); else params.delete('company');
    setSearchParamsUrl(params);
  };
  const setShowMap = (show: boolean) => {
    const params = new URLSearchParams(searchParamsUrl);
    if (show) params.set('view', 'map'); else params.delete('view');
    setSearchParamsUrl(params);
  };
  const updateFilters = (values: FilterValues, categories = categoryFilters) => {
    const params = new URLSearchParams(searchParamsUrl);
    // Preserve legacy core values until explicitly edited in the primary form.
    const editableKeys = new Set(Object.keys(filterValues).map(key => `f.${key}`));
    [...params.keys()].filter(key => key === 'cats' || editableKeys.has(key)).forEach(key => params.delete(key));
    params.delete('bedrooms');
    params.delete('instant');
    params.delete('f.bedrooms');
    params.delete('f.instantBooking');
    params.delete('amenities');
    Object.entries(serializeFilters(values, categories)).forEach(([key, value]) => params.set(key, value));
    setSearchParamsUrl(params);
  };
  const setFilterValues = (values: FilterValues) => updateFilters(values);
  const setCategoryFilters = (categories: string[]) => updateFilters(filterValues, categories);

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
  // Core criteria have one editor (the search bar). Avoid a second conflicting
  // property type/district/party selection inside the advanced filter sheet.
  const advancedFilterConfig = useMemo(() => ({
    sections: filterConfig.sections.filter(section => !['propertyType', 'district', 'listingType', 'guestsAtLeast', ...(propertyMode === 'buy' ? ['instantBooking'] : [])].includes(section.id)),
  }), [filterConfig, propertyMode]);
  const { data: companies = [] } = useManagementCompanies();

  const listingCatalogType = propertyMode === 'buy' ? 'sale' : 'rent';
  const rentTenancy = state.tenancy;

  const mergedFilterValues = useMemo(
    () => mergeSearchBarIntoFilterValues(filterValues, searchParams),
    [filterValues, searchParams]
  );

  const serverFilters = useMemo((): PropertyFilters => {
    const eligibleValues = { ...mergedFilterValues };
    if (listingCatalogType === 'sale') delete eligibleValues.instantBooking;
    const base = filterValuesToPropertyFilters(eligibleValues, {
      listingType: listingCatalogType,
      minGuestsFromSearch: listingCatalogType === 'rent' && state.hasGuestFilter ? searchParams.guests : undefined,
      instantBookingFromSearch: listingCatalogType === 'rent' && searchParams.instantBooking,
      saleIntent: state.saleIntent,
      isQuickSale: listingCatalogType === 'sale' && state.isQuickSale,
      rentTenancy: listingCatalogType === 'rent' ? rentTenancy : undefined,
    });
    return {
      ...base,
      managementCompanyId: selectedCompanyId || undefined,
    };
  }, [
    mergedFilterValues,
    listingCatalogType,
    searchParams.guests,
    searchParams.instantBooking,
    selectedCompanyId,
    rentTenancy,
    state.hasGuestFilter,
    state.saleIntent,
    state.isQuickSale,
  ]);

  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = usePropertiesInfinite(serverFilters);

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
    const allItems = infiniteData?.pages.flatMap((p) => p.properties) || [];

    const filtered = allItems.filter((prop) => {
      if (categoryFilters.length > 0) {
        if (!categoryFilters.every((cat) => matchesCategory(prop, cat))) return false;
      }

      return true;
    }) as unknown as Property[];

    const quickFiltered = applyQuickFilters(filtered, quickFilters, null);

    const sortMode = propertyMode === 'buy' ? 'buy' : 'rent';
    const sorted = [...quickFiltered];
    sorted.sort((a, b) => comparePropertiesForSort(a, b, sortKey, sortMode));

    return sorted;
  }, [infiniteData, quickFilters, sortKey, categoryFilters, propertyMode]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([, value]) => {
      if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    count += searchParams.bedrooms.length;
    count += searchParams.propertyTypes.length;
    count += categoryFilters.length;
    count += searchParams.locations.length;
    if (searchParams.instantBooking) count++;
    count += quickFilters.length;
    return count;
  }, [filterValues, quickFilters, searchParams, categoryFilters]);

  const clearAllFilters = () => {
    setQuickFilters([]);
    const resetUrl = new URLSearchParams({ mode: propertyMode });
    if (propertyMode === 'rent') resetUrl.set('tenancy', rentTenancy);
    setSearchParamsUrl(resetUrl);
  };

  return (
    <div className="min-h-screen bg-background">
        {/* Sticky header */}
        <header className="bg-background border-b">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-start gap-2">
              <BackButton fallbackPath="/property" variant="ghost" size="sm" className="shrink-0" />
              <div className="flex-1 min-w-0 journey-primary property-search-editor">
                <HomeDiscoverySearch key={queryKey} initialParams={searchParamsUrl} onSearch={params => setSearchParamsUrl(params)} />
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
                      "inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-none text-xs font-medium border transition-all shrink-0",
                      selectedCompanyId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/40 hover:shadow-sm"
                    )}>
                      <Building2 className="w-3.5 h-3.5" />
                      <span>
                        {selectedCompanyId
                          ? (() => {
                              const c = companies.find(c => c.id === selectedCompanyId);
                              return c ? (isRu ? c.name_ru : c.name_en) : (isRu ? 'Все компании' : 'All companies');
                            })()
                          : (isRu ? 'Все компании' : 'All companies')
                        }
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-popover z-50" align="start" sideOffset={6}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCompanyId(null)}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-none text-sm transition-colors", !selectedCompanyId ? "bg-primary/10 text-primary" : "hover:bg-muted")}
                      >
                        <span className="flex-1 text-left">{isRu ? 'Все' : 'All'}</span>
                      </button>
                      {companies.map(c => {
                        const label = isRu ? c.name_ru : c.name_en;
                        return (
                          <button key={c.id} onClick={() => setSelectedCompanyId(c.id === selectedCompanyId ? null : c.id)} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-none text-sm transition-colors", selectedCompanyId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                            <span className="flex-1 text-left">{label}</span>
                            {selectedCompanyId === c.id && <span className="w-4 h-4 rounded-none bg-primary text-primary-foreground text-[10px] flex items-center justify-center">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* More filters (UniversalFilter) */}
              <UniversalFilter
                config={advancedFilterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              >
                <button className={cn(
                  "inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-none text-xs font-medium border transition-all shrink-0",
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

        {categoryFilters.length > 0 && <div className="flex flex-wrap gap-2 px-4 py-2" aria-label={isRu ? 'Выбранные особенности' : 'Selected features'}>
          {categoryFilters.map(id => {
            const feature = PROPERTY_FEATURE_MAP.get(id);
            const label = feature ? (isRu ? feature.labelRu : feature.labelEn) : id;
            return <button type="button" key={id} className="min-h-11 border px-3 text-sm" aria-label={`${isRu ? 'Убрать' : 'Remove'} ${label}`} onClick={() => setCategoryFilters(categoryFilters.filter(value => value !== id))}>{label} ×</button>;
          })}
        </div>}
        {/* Canonical feature controls, including legacy amenities bookmarks. */}
        <div className="border-b">
          <PropertyCategoryIcons
            selected={categoryFilters}
            onSelect={setCategoryFilters}
          />
        </div>

        <div className="px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground basis-full sm:basis-auto">
              {isLoading ? (isRu ? 'Ищем жильё…' : 'Finding homes…') : isError ? (isRu ? 'Каталог недоступен' : 'Catalogue unavailable') : <>{properties.length} {isRu ? 'объектов найдено' : 'places found'}</>}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <PropertySortSelect value={sortKey} onChange={setSortKey} />
              {/* Map toggle */}
              <Button
                variant={showMap ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 h-8 rounded-none text-xs"
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
              selectedId={focusedId}
              onSelect={selectFocused}
              mode={propertyMode}
              nights={nights > 0 ? nights : undefined}
            />
          </div>
        )}


        <section aria-label={isRu ? 'Результаты поиска жилья' : 'Home search results'} className="px-4 pb-24">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-none" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !isError && properties.length > 0 && (
            <>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(property => {
                  const mc = (property as any).management_company_id ? companyMap.get((property as any).management_company_id) : undefined;
                  return (
                    <PropertyListingCard
                      key={property.id}
                      property={property}
                      mode={propertyMode}
                      isHovered={hoveredProperty === property.id}
                      onHover={setHoveredProperty}
                      isSelected={focusedId === property.id}
                      onSelect={showMap ? selectFocused : undefined}
                      companyName={mc?.name}
                      companySlug={mc?.slug}
                      nights={nights > 0 ? nights : undefined}
                    />
                  );
                })}

              </div>
            </>
          )}

          <div ref={loadMoreRef} className={cn("flex justify-center", properties.length > 0 && "py-8")}>
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            {!isLoading && !hasNextPage && properties.length > 0 && (
              <p className="text-sm text-muted-foreground">{isRu ? 'Все объекты загружены' : 'All properties loaded'}</p>
            )}
          </div>

          {isError && <div role="alert" className="py-16 text-center">
            <h2 className="mb-3">{isRu ? 'Не удалось загрузить жильё' : 'Homes could not be loaded'}</h2>
            <p className="mb-5 text-muted-foreground">{isRu ? 'Параметры поиска сохранены. Попробуйте ещё раз.' : 'Your search is kept. Please try again.'}</p>
            <Button variant="outline" onClick={() => refetch()}>{isRu ? 'Повторить' : 'Try again'}</Button>
          </div>}
          {!isLoading && !isError && properties.length === 0 && (
            <div className="text-center py-8">
              <Home className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{isRu ? 'Ничего не найдено' : 'No properties found'}</h3>
              <p className="text-muted-foreground mb-4">{isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}</p>
              <Button variant="outline" onClick={clearAllFilters}>
                {isRu ? 'Сбросить фильтры' : 'Reset filters'}
              </Button>
            </div>
          )}

          {propertyMode === 'buy' && !isError && <OffplanCTASection className="mt-8" />}
          {properties.length > 0 && !isError && <CrossSellSection currentVertical="property" className="mt-8 px-4" />}

          {showStickyCTA && <VerticalCTA vertical="property" variant="sticky" context="list" />}
        </section>
      </div>
  );
}
