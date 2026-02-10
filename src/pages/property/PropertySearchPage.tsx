/**
 * PropertySearchPage — Full catalog grid with filters (the old PropertyIndex layout)
 * Reached via /property/search or when user activates search from discovery
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, SlidersHorizontal, Loader2, ChevronDown, Building2, Zap, Wifi, Droplets, Utensils, Car as CarIcon, Dumbbell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UniversalFilter, FilterValues } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { useManagementCompanies, ManagementCompany } from '@/hooks/useManagementCompanies';
import { Skeleton } from '@/components/ui/skeleton';

import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyMode } from '@/components/property/PropertyCategoryRibbon';
import { PropertyCategoryIcons, matchesCategory } from '@/components/property/PropertyCategoryIcons';
import { applyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { FilterChip } from '@/components/uno/FilterChip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { normalizeForFilter } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';
import { PropertySortSelect, PropertySortKey } from '@/components/property/PropertySortSelect';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { OffplanCTASection } from '@/components/property/OffplanCTASection';
import { Switch } from '@/components/ui/switch';

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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    searchParamsUrl.get('company') || null
  );
  const [instantBookOnly, setInstantBookOnly] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 800);
    };
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
    propertyType: selectedTypes.length === 1 ? selectedTypes[0] : undefined,
    managementCompanyId: selectedCompanyId || undefined,
  });

  // Build company lookup map for card badges
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
      // Category filter
      if (selectedCategory && !matchesCategory(prop, selectedCategory)) return false;

      // Instant book filter
      if (instantBookOnly && !prop.instant_booking) return false;

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
        const minBedrooms = Math.max(...bedroomsToCheck.map(f => parseInt(f) || 0));
        if (propBedrooms < minBedrooms) return false;
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

      // Amenities filter (from chips + universal filter)
      const allAmenityFilters = [
        ...selectedAmenities,
        ...(filterValues.amenities
          ? (Array.isArray(filterValues.amenities) ? filterValues.amenities as string[] : [filterValues.amenities as string])
          : []),
      ];
      if (allAmenityFilters.length > 0) {
        const propAmenities = (prop.amenities || []).map(a => a.toLowerCase());
        const match = allAmenityFilters.every(f => propAmenities.some(a => a.includes(f.toLowerCase())));
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
  }, [infiniteData, searchParams, filterValues, quickFilters, selectedBedrooms, selectedDistricts, selectedTypes, sortKey, instantBookOnly, selectedAmenities, selectedCategory]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([, value]) => {
      if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    count += selectedBedrooms.length;
    count += selectedDistricts.length;
    count += quickFilters.length;
    count += selectedAmenities.length;
    if (instantBookOnly) count++;
    if (selectedCategory) count++;
    return count;
  }, [filterValues, quickFilters, selectedBedrooms, selectedDistricts, selectedAmenities, instantBookOnly, selectedCategory]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        {/* Sticky header — Airbnb style: search bar + categories */}
        <header className="sticky top-0 z-40 bg-background border-b">
          {/* Search bar row */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <BackButton fallbackPath="/property" variant="ghost" size="sm" className="shrink-0" />
              <div className="flex-1">
                <AirbnbSearchBar onSearch={setSearchParams} />
              </div>
            </div>
          </div>

          {/* Unified filter chips row — Airbnb style */}
          <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 touch-pan-y">
              {/* Property type chips: Villa, Condo */}
              {(['villa', 'condo'] as const).map(typeId => {
                const typeOpt = propertyTypes.find(t => t.id.toLowerCase() === typeId);
                if (!typeOpt) return null;
                const label = language === 'ru' ? typeOpt.labelRu : typeOpt.labelEn;
                return (
                  <FilterChip
                    key={typeId}
                    label={label}
                    isActive={selectedTypes.includes(typeOpt.id)}
                    onToggle={() => {
                      setSelectedTypes(prev =>
                        prev.includes(typeOpt.id)
                          ? prev.filter(t => t !== typeOpt.id)
                          : [...prev, typeOpt.id]
                      );
                    }}
                    size="sm"
                  />
                );
              })}

              {/* More types dropdown */}
              {(() => {
                const otherTypes = propertyTypes.filter(
                  t => !['villa', 'condo'].includes(t.id.toLowerCase())
                );
                if (!otherTypes.length) return null;
                const activeOtherCount = otherTypes.filter(t => selectedTypes.includes(t.id)).length;
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium border transition-all shrink-0",
                        activeOtherCount > 0
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                      )}>
                        <span>{language === 'ru' ? 'Тип' : 'Type'}</span>
                        {activeOtherCount > 0 && <span>({activeOtherCount})</span>}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-2" align="start" sideOffset={6}>
                      <div className="space-y-1">
                        {otherTypes.map(type => (
                          <button
                            key={type.id}
                            onClick={() => {
                              setSelectedTypes(prev =>
                                prev.includes(type.id)
                                  ? prev.filter(t => t !== type.id)
                                  : [...prev, type.id]
                              );
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                              selectedTypes.includes(type.id)
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            <span className="flex-1 text-left">
                              {language === 'ru' ? type.labelRu : type.labelEn}
                            </span>
                            {selectedTypes.includes(type.id) && (
                              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })()}

              {/* Divider */}
              <div className="w-px h-5 bg-border shrink-0" />

              {/* Bedroom chips */}
              {[
                { id: '1', label: '1+' },
                { id: '2', label: '2+' },
                { id: '3', label: '3+' },
                { id: '4', label: '4+' },
              ].map(bed => (
                <FilterChip
                  key={bed.id}
                  label={bed.label}
                  isActive={selectedBedrooms.includes(bed.id)}
                  onToggle={() => {
                    setSelectedBedrooms(prev =>
                      prev.includes(bed.id)
                        ? prev.filter(b => b !== bed.id)
                        : [bed.id] // single select for bedrooms (1+ means 1 or more)
                    );
                  }}
                  size="sm"
                />
              ))}

              {/* Company filter dropdown */}
              {companies.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium border transition-all shrink-0",
                      selectedCompanyId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                    )}>
                      <Building2 className="w-3 h-3" />
                      <span>{language === 'ru' ? 'УК' : 'Company'}</span>
                      {selectedCompanyId && <span>✓</span>}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start" sideOffset={6}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCompanyId(null)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          !selectedCompanyId ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        )}
                      >
                        <span className="flex-1 text-left">{language === 'ru' ? 'Все' : 'All'}</span>
                      </button>
                      {companies.map(c => {
                        const label = language === 'ru' ? c.name_ru : c.name_en;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCompanyId(c.id === selectedCompanyId ? null : c.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                              selectedCompanyId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            )}
                          >
                            <span className="flex-1 text-left">{label}</span>
                            {selectedCompanyId === c.id && (
                              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Divider */}
              <div className="w-px h-5 bg-border shrink-0" />

              {/* Instant Book toggle */}
              <button
                onClick={() => setInstantBookOnly(prev => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium border transition-all shrink-0",
                  instantBookOnly
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                )}
              >
                <Zap className="w-3 h-3" />
                <span>{language === 'ru' ? 'Мгновенное' : 'Instant'}</span>
              </button>

              {/* Amenity quick chips */}
              {[
                { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Бассейн' },
                { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
                { id: 'kitchen', icon: Utensils, labelEn: 'Kitchen', labelRu: 'Кухня' },
                { id: 'parking', icon: CarIcon, labelEn: 'Parking', labelRu: 'Парковка' },
                { id: 'gym', icon: Dumbbell, labelEn: 'Gym', labelRu: 'Спортзал' },
              ].map(amenity => (
                <FilterChip
                  key={amenity.id}
                  label={language === 'ru' ? amenity.labelRu : amenity.labelEn}
                  isActive={selectedAmenities.includes(amenity.id)}
                  onToggle={() => {
                    setSelectedAmenities(prev =>
                      prev.includes(amenity.id)
                        ? prev.filter(a => a !== amenity.id)
                        : [...prev, amenity.id]
                    );
                  }}
                  size="sm"
                />
              ))}

              {/* Divider */}
              <div className="w-px h-5 bg-border shrink-0" />

              {/* Full filters button */}
              <UniversalFilter
                config={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              >
                <button className={cn(
                  "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium border transition-all shrink-0",
                  Object.keys(filterValues).length > 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                )}>
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{language === 'ru' ? 'Фильтры' : 'Filters'}</span>
                  {Object.keys(filterValues).length > 0 && (
                    <span>({Object.keys(filterValues).length})</span>
                  )}
                </button>
              </UniversalFilter>
            </div>
          </div>

          {/* Category Icons Ribbon */}
          <PropertyCategoryIcons
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            className="py-2"
          />
        </header>

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
                  setSelectedCompanyId(null);
                  setInstantBookOnly(false);
                  setSelectedAmenities([]);
                  setSelectedCategory(null);
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
                  />
                );
              })}
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
                setSelectedCompanyId(null);
                setInstantBookOnly(false);
                setSelectedAmenities([]);
                setSelectedCategory(null);
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
