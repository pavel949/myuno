import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, BedDouble, Bath, Users, SlidersHorizontal, Zap, MapPin, Star, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { useProperties, useInstantBookingProperties, Property } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { cn } from '@/lib/utils';
import { ConsultationCTA } from '@/components/property/ConsultationCTA';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { QuickFiltersRibbon } from '@/components/property/QuickFiltersRibbon';
import { PropertyTypeSelector } from '@/components/property/PropertyTypeSelector';
import { BedroomChips } from '@/components/property/BedroomChips';
import { ProjectPromoSection } from '@/components/property/ProjectPromoSection';
import { PropertyModeToggle, PropertyMode } from '@/components/property/PropertyModeToggle';
import { applyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { matchesFilter, matchesSingleFilter, normalizeForFilter } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';

// Demo properties loaded from JSON for better maintainability
import demoPropertiesData from '@/data/demo/properties.json';
const demoProperties = demoPropertiesData;

// Removed static propertyTypes - now loaded dynamically from usePropertyFilterOptions

export default function PropertyIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();
  
  // Property mode: rent or buy
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
  // Quick filters state (Agoda/Airbnb style)
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const { formatPrice } = useCurrency();

  // Update URL when mode changes
  useEffect(() => {
    if (propertyMode === 'buy') {
      setSearchParamsUrl({ mode: 'buy' });
    } else {
      searchParamsUrl.delete('mode');
      setSearchParamsUrl(searchParamsUrl);
    }
  }, [propertyMode, setSearchParamsUrl]);

  // Show sticky CTA after scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyCTA(scrollY > 800);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dynamic filter options from lookup_values (editable in admin)
  const { filterConfig, propertyTypes } = usePropertyFilterOptions();
  
  // Add "All" option to property types for the pills
  const propertyTypePills = useMemo(() => [
    { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🏠' },
    ...propertyTypes
  ], [propertyTypes]);

  // Fetch instant booking properties
  const { data: instantBookingProperties, isLoading: isLoadingInstant } = useInstantBookingProperties(10);

  // Fetch all rental properties from database (filtering done client-side for demo fallback consistency)
  const { data: dbProperties, isLoading } = useProperties({
    listingType: propertyMode === 'buy' ? 'sale' : 'rent',
  }, 200);

  // Use DB data or fallback to demo, then apply all filters
  const properties = useMemo(() => {
    const targetListingType = propertyMode === 'buy' ? 'sale' : 'rent';
    const sourceData = dbProperties && dbProperties.length > 0 
      ? dbProperties 
      : demoProperties.filter(p => p.listing_type === targetListingType);
    
    // First apply standard filters
    const standardFiltered = sourceData.filter(prop => {
      const matchesLocation = searchParams.locations.length === 0 || 
        searchParams.locations.some(loc => 
          prop.district?.toLowerCase().includes(loc.toLowerCase())
        );
      const matchesType = selectedType === 'all' || prop.property_type === selectedType;
      const matchesGuests = !searchParams.guests || (prop.max_guests || 0) >= searchParams.guests;
      
      // Bedroom filter - from inline chips (priority) or modal filter
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

      // District filter - from chips (priority) or modal filter
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

      // Amenities filter - multi-select (must have ALL selected)
      if (filterValues.amenities) {
        const amenityFilters = Array.isArray(filterValues.amenities)
          ? filterValues.amenities as string[]
          : [filterValues.amenities as string];
        if (!matchesFilter(prop.amenities, amenityFilters)) return false;
      }
      
      return matchesLocation && matchesType && matchesGuests;
    }) as unknown as Property[];

    // Then apply quick filters (Agoda/Airbnb style)
    return applyQuickFilters(standardFiltered, quickFilters, selectedProjectId);
  }, [dbProperties, searchParams, selectedType, filterValues, quickFilters, selectedProjectId, selectedBedrooms, selectedDistricts, propertyMode]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    // Count inline chips
    count += selectedBedrooms.length;
    count += selectedDistricts.length;
    // Also count quick filters
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
        {/* Sticky Header with Search */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <BackButton fallbackPath="/" variant="ghost" size="sm" />
                <h1 className="text-xl font-bold">
                  {propertyMode === 'buy' 
                    ? (language === 'ru' ? 'Купить недвижимость' : 'Buy Property')
                    : (language === 'ru' ? 'Аренда жилья' : 'Vacation Rentals')
                  }
                </h1>
              </div>
              {/* Rent/Buy Toggle */}
              <PropertyModeToggle 
                value={propertyMode} 
                onChange={setPropertyMode}
                className="w-48"
              />
            </div>
            
            {/* Airbnb-style Search Bar */}
            <AirbnbSearchBar 
              onSearch={setSearchParams}
              className="mb-4"
            />

            {/* Property Type Selector - Priority types + dropdown */}
            <div className="flex items-center gap-2">
              <PropertyTypeSelector
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                propertyTypes={propertyTypes}
                className="flex-1"
              />

              {/* Filter Button */}
              <UniversalFilter
                config={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              >
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                  {language === 'ru' ? 'Фильтры' : 'Filters'}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </UniversalFilter>
            </div>

            {/* Bedroom Chips - Inline filter */}
            <BedroomChips
              selectedBedrooms={selectedBedrooms}
              onBedroomsChange={setSelectedBedrooms}
              className="mt-3"
            />
          </div>
        </header>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="container max-w-7xl mx-auto px-4 py-3">
            <ActiveFilters
              config={filterConfig}
              values={filterValues}
              onRemove={handleRemoveFilter}
              onClearAll={() => setFilterValues({})}
            />
          </div>
        )}

        {/* Consultation CTA - Context-aware based on mode */}
        <div className="container max-w-7xl mx-auto px-4 py-2">
          <ConsultationCTA context={propertyMode === 'buy' ? 'purchase' : 'rental'} />
        </div>

        {/* Project Promo Section - Visual carousel of complexes */}
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <ProjectPromoSection />
        </div>

        {/* Quick Filters Ribbon (Agoda/Airbnb style) */}
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <QuickFiltersRibbon 
            selectedFilters={quickFilters}
            selectedDistricts={selectedDistricts}
            onFilterToggle={(id) => {
              setQuickFilters(prev => 
                prev.includes(id) 
                  ? prev.filter(f => f !== id)
                  : [...prev, id]
              );
            }}
            onDistrictToggle={(id) => {
              setSelectedDistricts(prev =>
                prev.includes(id)
                  ? prev.filter(d => d !== id)
                  : [...prev, id]
              );
            }}
          />
        </div>

        {/* Results Count */}
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {properties.length} {language === 'ru' ? 'объектов найдено' : 'places found'}
          </p>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/property/map')}>
            <MapPin className="w-4 h-4" />
            {language === 'ru' ? 'На карте' : 'Show map'}
          </Button>
        </div>

        {/* Property Grid - Airbnb Style */}
        <main className="container max-w-7xl mx-auto px-4 pb-24">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Property Cards - Airbnb Style */}
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
                    />
                    
                    {/* Favorite Button */}
                    <button 
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle favorite toggle
                      }}
                    >
                      <Heart className="w-5 h-5" />
                    </button>

                    {/* Badges */}
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
                    {/* Location & Rating */}
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

                    {/* Title */}
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {language === 'ru' ? property.title_ru : property.title_en}
                    </p>

                    {/* Specs */}
                    <p className="text-sm text-muted-foreground">
                      {property.bedrooms || 0} {language === 'ru' ? 'спален' : 'beds'} · {property.bathrooms || 0} {language === 'ru' ? 'ванных' : 'baths'} · {property.max_guests || 0} {language === 'ru' ? 'гостей' : 'guests'}
                    </p>

                    {/* Price */}
                    <p className="pt-1">
                      <span className="font-semibold">{formatPrice(property.price || 0)}</span>
                      <span className="text-muted-foreground">{formatPriceLabel(property.price_period)}</span>
                    </p>
                    
                    {/* Instant booking CTA hint */}
                    {property.instant_booking && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3" />
                        {language === 'ru' ? 'Забронировать сейчас' : 'Book now'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {properties.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Home className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {language === 'ru' ? 'Объекты не найдены' : 'No places found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {language === 'ru' 
                      ? 'Попробуйте изменить параметры поиска' 
                      : 'Try adjusting your search criteria'}
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchParams({ locations: [], checkIn: undefined, checkOut: undefined, guests: 2 });
                    setSelectedType('all');
                    setFilterValues({});
                    setQuickFilters([]);
                    setSelectedProjectId(null);
                    setSelectedBedrooms([]);
                    setSelectedDistricts([]);
                  }}>
                    {language === 'ru' ? 'Сбросить фильтры' : 'Clear all filters'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <CrossSellSection currentVertical="property" className="mt-8 px-4" />

          {/* Sticky Expert CTA */}
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
