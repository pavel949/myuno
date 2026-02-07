import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, BedDouble, Bath, Users, SlidersHorizontal, Zap, MapPin, Star, Heart, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { cn } from '@/lib/utils';
import { ConsultationCTA } from '@/components/property/ConsultationCTA';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { QuickFiltersRibbon } from '@/components/property/QuickFiltersRibbon';
import { PropertyCategoryRibbon, PropertyMode } from '@/components/property/PropertyCategoryRibbon';
import { ProjectPromoSection } from '@/components/property/ProjectPromoSection';
import { OffplanCTASection } from '@/components/property/OffplanCTASection';
import { applyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { matchesFilter, matchesSingleFilter, normalizeForFilter } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';
import { PropertySortSelect, PropertySortKey } from '@/components/property/PropertySortSelect';

export default function PropertyIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();
  
  const [propertyMode, setPropertyMode] = useState<PropertyMode>(
    (searchParamsUrl.get('mode') as PropertyMode) || 'rent'
  );
  
  const [searchParams, setSearchParams] = useState<SearchParams>({
    locations: [],
    checkIn: undefined,
    checkOut: undefined,
    guests: 2,
  });
  const [selectedType, setSelectedType] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [sortKey, setSortKey] = useState<PropertySortKey>('recommended');
  const { formatPrice } = useCurrency();

  // Infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propertyMode === 'buy') {
      setSearchParamsUrl({ mode: 'buy' });
    } else {
      searchParamsUrl.delete('mode');
      setSearchParamsUrl(searchParamsUrl);
    }
  }, [propertyMode, setSearchParamsUrl]);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { filterConfig, propertyTypes } = usePropertyFilterOptions();
  
  const propertyTypePills = useMemo(() => [
    { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🏠' },
    ...propertyTypes
  ], [propertyTypes]);

  // Infinite query with server-side filters
  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePropertiesInfinite({
    listingType: propertyMode === 'buy' ? 'sale' : 'rent',
    propertyType: selectedType !== 'all' ? selectedType : undefined,
  });

  // Infinite scroll observer
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

  // Flatten pages + apply client-side filters + sort
  const properties = useMemo(() => {
    const allItems = infiniteData?.pages.flatMap(p => p.properties) || [];
    
    // Client-side filters
    const filtered = allItems.filter(prop => {
      const matchesLocation = searchParams.locations.length === 0 || 
        searchParams.locations.some(loc => 
          prop.district?.toLowerCase().includes(loc.toLowerCase())
        );
      const matchesGuests = !searchParams.guests || (prop.max_guests || 0) >= searchParams.guests;
      
      // Bedroom filter
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

      // District filter
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

      // Amenities filter
      if (filterValues.amenities) {
        const amenityFilters = Array.isArray(filterValues.amenities)
          ? filterValues.amenities as string[]
          : [filterValues.amenities as string];
        if (!matchesFilter(prop.amenities, amenityFilters)) return false;
      }
      
      return matchesLocation && matchesGuests;
    }) as unknown as Property[];

    // Quick filters
    const quickFiltered = applyQuickFilters(filtered, quickFilters, selectedProjectId);

    // Sort
    const sorted = [...quickFiltered];
    switch (sortKey) {
      case 'price_asc':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default: // 'recommended' — featured first, already from server
        break;
    }

    return sorted;
  }, [infiniteData, searchParams, filterValues, quickFilters, selectedProjectId, selectedBedrooms, selectedDistricts, sortKey]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    count += selectedBedrooms.length;
    count += selectedDistricts.length;
    count += quickFilters.length;
    if (selectedProjectId) count++;
    return count;
  }, [filterValues, quickFilters, selectedProjectId, selectedBedrooms, selectedDistricts]);

  const handleRemoveFilter = (sectionId: string, optionId?: string) => {
    setFilterValues(prev => {
      const newValues = { ...prev };
      if (optionId && Array.isArray(newValues[sectionId])) {
        newValues[sectionId] = (newValues[sectionId] as string[]).filter(id => id !== optionId);
        if ((newValues[sectionId] as string[]).length === 0) delete newValues[sectionId];
      } else {
        delete newValues[sectionId];
      }
      return newValues;
    });
  };

  const formatPriceLabel = (period?: string) => {
    if (!period) return '';
    const periodLabels: Record<string, { en: string; ru: string }> = {
      night: { en: '/night', ru: '/ночь' },
      week: { en: '/week', ru: '/нед' },
      month: { en: '/mo', ru: '/мес' },
      year: { en: '/year', ru: '/год' },
      total: { en: '', ru: '' },
    };
    return periodLabels[period]?.[language] || '';
  };

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="min-h-screen bg-background">
        {/* Compact Sticky Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b space-y-3 pb-3">
          <div className="container max-w-7xl mx-auto px-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BackButton fallbackPath="/" variant="ghost" size="sm" />
                <h1 className="text-lg font-bold truncate">
                  {propertyMode === 'buy' 
                    ? (language === 'ru' ? 'Купить недвижимость' : 'Buy Property')
                    : (language === 'ru' ? 'Аренда жилья' : 'Vacation Rentals')
                  }
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/property/map')}>
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'ru' ? 'Карта' : 'Map'}</span>
                </Button>
                
                <UniversalFilter
                  config={filterConfig}
                  values={filterValues}
                  onChange={setFilterValues}
                  activeCount={activeFilterCount}
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <SlidersHorizontal className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </UniversalFilter>
              </div>
            </div>
          </div>
            
          <div className="container max-w-7xl mx-auto px-4">
            <AirbnbSearchBar onSearch={setSearchParams} />
          </div>

          <div className="container max-w-7xl mx-auto px-4">
            <PropertyCategoryRibbon
              mode={propertyMode}
              onModeChange={setPropertyMode}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              propertyTypes={propertyTypes}
            />
          </div>
        </header>

        {/* Project Promo Section */}
        <div className="container max-w-7xl mx-auto px-4 pt-3 pb-2">
          <ProjectPromoSection mode={propertyMode} />
        </div>

        {/* Quick Filter Tags */}
        <div className="container max-w-7xl mx-auto px-4 py-1">
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

        {/* Results Count + Sort */}
        <div className="container max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {properties.length} {language === 'ru' ? 'объектов найдено' : 'places found'}
            </p>
            <div className="flex items-center gap-2">
              <PropertySortSelect value={sortKey} onChange={setSortKey} />
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => {
                    setFilterValues({});
                    setQuickFilters([]);
                    setSelectedDistricts([]);
                    setSelectedBedrooms([]);
                  }}
                >
                  {language === 'ru' ? 'Сбросить' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Property Grid */}
        <main className="container max-w-7xl mx-auto px-4 pb-24">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Property Cards */}
          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <div 
                  key={property.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/property/${property.id}`)}
                  onMouseEnter={() => setHoveredProperty(property.id)}
                  onMouseLeave={() => setHoveredProperty(null)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                    <img 
                      src={property.cover_image || property.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600'} 
                      alt={language === 'ru' ? property.title_ru : property.title_en}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-300",
                        hoveredProperty === property.id && "scale-[1.03]"
                      )}
                      loading="lazy"
                    />
                    
                    <button 
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Heart className="w-5 h-5" />
                    </button>

                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {property.is_featured && (
                        <Badge className="bg-background text-foreground border-0 shadow-sm text-xs">
                          {language === 'ru' ? 'Популярное' : 'Guest favorite'}
                        </Badge>
                      )}
                      {property.instant_booking && (
                        <Badge className="bg-amber-500 text-white border-0 text-xs gap-1">
                          <Zap className="w-3 h-3" />
                          {language === 'ru' ? 'Мгновенное' : 'Instant'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {property.district || 'Phuket'}
                      </h3>
                      {property.rating && property.rating > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-sm">{property.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {language === 'ru' ? property.title_ru : property.title_en}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5" />
                        {property.bedrooms || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" />
                        {property.bathrooms || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {property.max_guests || 2}
                      </span>
                    </div>

                    <p className="text-sm font-semibold pt-1">
                      {propertyMode === 'buy' 
                        ? formatPrice((property as any).sale_price || property.price || 0)
                        : (
                          <>
                            {formatPrice(property.price || 0)}
                            <span className="font-normal text-muted-foreground">
                              {formatPriceLabel(property.price_period || 'night')}
                            </span>
                          </>
                        )
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            )}
            {!isLoading && !hasNextPage && properties.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Все объекты загружены' : 'All properties loaded'}
              </p>
            )}
          </div>

          {/* Empty State */}
          {!isLoading && properties.length === 0 && (
            <div className="text-center py-16">
              <Home className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ru' ? 'Ничего не найдено' : 'No properties found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'ru' 
                  ? 'Попробуйте изменить фильтры' 
                  : 'Try adjusting your filters'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterValues({});
                  setQuickFilters([]);
                  setSelectedDistricts([]);
                  setSelectedBedrooms([]);
                  setSelectedType('all');
                }}
              >
                {language === 'ru' ? 'Сбросить фильтры' : 'Reset filters'}
              </Button>
            </div>
          )}

          <OffplanCTASection className="mt-8" />
          <CrossSellSection currentVertical="property" className="mt-8 px-4" />

          {showStickyCTA && (
            <VerticalCTA
              vertical="property"
              variant="sticky"
              context="list"
            />
          )}
        </main>
      </div>
    </AppLayout>
  );
}
