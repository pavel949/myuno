/**
 * PropertySearchPage — Full catalog grid with filters (the old PropertyIndex layout)
 * Reached via /property/search or when user activates search from discovery
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { UniversalFilter, FilterValues } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';

import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { QuickFiltersRibbon } from '@/components/property/QuickFiltersRibbon';
import { PropertyCategoryRibbon, PropertyMode } from '@/components/property/PropertyCategoryRibbon';
import { applyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { normalizeForFilter } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';
import { PropertySortSelect, PropertySortKey } from '@/components/property/PropertySortSelect';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { OffplanCTASection } from '@/components/property/OffplanCTASection';

export default function PropertySearchPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();
  
  const [propertyMode, setPropertyMode] = useState<PropertyMode>(
    (searchParamsUrl.get('mode') as PropertyMode) || 'rent'
  );
  
  const [searchParams, setSearchParams] = useState<SearchParams>({
    locations: searchParamsUrl.get('district') ? [searchParamsUrl.get('district')!] : [],
    checkIn: undefined,
    checkOut: undefined,
    guests: 2,
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    searchParamsUrl.get('district') ? [searchParamsUrl.get('district')!] : []
  );
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [sortKey, setSortKey] = useState<PropertySortKey>('recommended');

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { filterConfig, propertyTypes } = usePropertyFilterOptions();

  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePropertiesInfinite({
    listingType: propertyMode === 'buy' ? 'sale' : 'rent',
    propertyType: selectedTypes.length === 1 ? selectedTypes[0] : undefined,
  });

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const properties = useMemo(() => {
    const allItems = infiniteData?.pages.flatMap(p => p.properties) || [];
    
    const filtered = allItems.filter(prop => {
      // Multi-type filter
      if (selectedTypes.length > 0) {
        const propType = (prop.property_type || '').toLowerCase();
        if (!selectedTypes.some(t => propType.includes(t.toLowerCase()))) return false;
      }

      const matchesLocation = searchParams.locations.length === 0 || 
        searchParams.locations.some(loc => 
          prop.district?.toLowerCase().includes(loc.toLowerCase())
        );
      const matchesGuests = !searchParams.guests || (prop.max_guests || 0) >= searchParams.guests;
      
      const bedroomsToCheck = selectedBedrooms.length > 0 
        ? selectedBedrooms 
        : (filterValues.bedrooms 
            ? (Array.isArray(filterValues.bedrooms) ? filterValues.bedrooms as string[] : [filterValues.bedrooms as string])
            : []);
      
      if (bedroomsToCheck.length > 0) {
        const propBedrooms = prop.bedrooms ?? 0;
        const matchesBedrooms = bedroomsToCheck.some(filter => {
          if (filter === 'studio') return propBedrooms === 0;
          if (filter === '5+' || filter === '4+') return propBedrooms >= parseInt(filter.replace('+', ''));
          return propBedrooms === parseInt(filter);
        });
        if (!matchesBedrooms) return false;
      }

      const districtsToCheck = selectedDistricts.length > 0
        ? selectedDistricts
        : (filterValues.district
            ? (Array.isArray(filterValues.district) ? filterValues.district as string[] : [filterValues.district as string])
            : []);
      
      if (districtsToCheck.length > 0) {
        const normalizedDistricts = districtsToCheck.map(d => normalizeForFilter(d));
        const propDistrict = normalizeForFilter(prop.district || '');
        const matchesDistrict = normalizedDistricts.some(d => 
          propDistrict.includes(d) || d.includes(propDistrict)
        );
        if (!matchesDistrict) return false;
      }

      if (filterValues.amenities) {
        const amenityFilters = Array.isArray(filterValues.amenities)
          ? filterValues.amenities as string[]
          : [filterValues.amenities as string];
        const propAmenities = prop.amenities || [];
        const match = amenityFilters.every(f => propAmenities.some(a => a.toLowerCase().includes(f.toLowerCase())));
        if (!match) return false;
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
  }, [infiniteData, searchParams, filterValues, quickFilters, selectedBedrooms, selectedDistricts, selectedTypes, sortKey]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([, value]) => {
      if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    count += selectedBedrooms.length;
    count += selectedDistricts.length;
    count += quickFilters.length;
    return count;
  }, [filterValues, quickFilters, selectedBedrooms, selectedDistricts]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        {/* Sticky header — Airbnb style: search bar + categories */}
        <header className="sticky top-0 z-40 bg-background border-b">
          {/* Search bar row */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <BackButton fallbackPath="/property" variant="ghost" size="sm" className="shrink-0" />
              <div className="flex-1" onClick={() => {}}>
                <AirbnbSearchBar onSearch={setSearchParams} />
              </div>
              <UniversalFilter
                config={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              >
                <button className="shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center relative hover:shadow-sm transition-shadow">
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </UniversalFilter>
            </div>
          </div>

          {/* Category ribbon — Airbnb style, no buy toggle */}
          <div className="px-4 pb-1">
            <PropertyCategoryRibbon
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
              propertyTypes={propertyTypes}
              showModeToggle={false}
            />
          </div>
        </header>

        {/* Quick filters */}
        <div className="px-4 py-1">
          <QuickFiltersRibbon
            selectedFilters={quickFilters}
            selectedDistricts={selectedDistricts}
            onFilterToggle={(id) => setQuickFilters(prev => 
              prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
            )}
            onDistrictToggle={(id) => setSelectedDistricts(prev =>
              prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
            )}
          />
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {properties.length} {language === 'ru' ? 'объектов найдено' : 'places found'}
            </p>
            <div className="flex items-center gap-2">
              <PropertySortSelect value={sortKey} onChange={setSortKey} />
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                  setFilterValues({});
                  setQuickFilters([]);
                  setSelectedDistricts([]);
                  setSelectedBedrooms([]);
                }}>
                  {language === 'ru' ? 'Сбросить' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        </div>

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

          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map(property => (
                <PropertyListingCard
                  key={property.id}
                  property={property}
                  mode={propertyMode}
                  isHovered={hoveredProperty === property.id}
                  onHover={setHoveredProperty}
                />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            {!isLoading && !hasNextPage && properties.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Все объекты загружены' : 'All properties loaded'}
              </p>
            )}
          </div>

          {!isLoading && properties.length === 0 && (
            <div className="text-center py-16">
              <Home className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ru' ? 'Ничего не найдено' : 'No properties found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'ru' ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
              </p>
              <Button variant="outline" onClick={() => {
                setFilterValues({});
                setQuickFilters([]);
                setSelectedDistricts([]);
                setSelectedBedrooms([]);
                setSelectedTypes([]);
              }}>
                {language === 'ru' ? 'Сбросить фильтры' : 'Reset filters'}
              </Button>
            </div>
          )}

          <OffplanCTASection className="mt-8" />
          <CrossSellSection currentVertical="property" className="mt-8 px-4" />

          {showStickyCTA && (
            <VerticalCTA vertical="property" variant="sticky" context="list" />
          )}
        </main>
      </div>
    </AppLayout>
  );
}
