/**
 * PropertyIndex — Airbnb-style Discovery Page
 * Clean search pill + category icons ribbon + card grid
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Star, ArrowRight, MapPin, SlidersHorizontal, Map } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyMode } from '@/components/property/PropertyCategoryRibbon';
import { matchesCategory } from '@/components/property/PropertyCategoryIcons';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { PropertyHubTabs } from './PropertyHub';
import { AirbnbCategoryRibbon } from '@/components/property/PropertyCategoryIcons.ribbon';
import { CrossSellSection } from '@/components/crosssell';
import { VerticalContextBanner } from '@/components/vertical/VerticalContextBanner';
import { VerticalInsightPanel } from '@/components/vertical/VerticalInsightPanel';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UniversalFilter, FilterValues } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { filterValuesToPropertyFilters } from '@/lib/propertyCatalogServerFilters';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

// ── Recently Viewed Property Shape ──
interface RecentProperty {
  id: string;
  title: string;
  image: string;
  district: string;
  bedrooms: number;
  rating: number | null;
  price: number;
  currency: string;
  pricePeriod: string;
}

// ── Recently Viewed Card ──
function RecentCard({ item, onClick }: { item: RecentProperty; onClick: () => void }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <button onClick={onClick} className="w-[150px] shrink-0 text-left group">
      <div className="relative aspect-square rounded-xl overflow-hidden mb-1.5">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
      </div>
      <p className="text-xs font-semibold line-clamp-1">{item.district}</p>
      <p className="text-[11px] text-muted-foreground">
        {item.bedrooms} {isRu ? 'кроват' : 'bed'}{item.bedrooms !== 1 ? (isRu ? 'и' : 's') : (isRu ? 'ь' : '')}
        {item.rating != null && item.rating > 0 && (<> · <Star className="w-2.5 h-2.5 inline fill-current" /> {item.rating.toFixed(1)}</>)}
      </p>
    </button>
  );
}

export default function PropertyIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParamsUrl] = useSearchParams();
  const isRu = language === 'ru';

  // UniversalFilter state
  const { filterConfig } = usePropertyFilterOptions();
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(filterValues).forEach(v => {
      if (Array.isArray(v)) count += v.length;
      else if (v) count += 1;
    });
    return count;
  }, [filterValues]);

  const [propertyMode, setPropertyMode] = useState<PropertyMode>(() =>
    searchParamsUrl.get('mode') === 'buy' ? 'buy' : 'rent'
  );

  const rentTenancy = searchParamsUrl.get('tenancy') === 'long' ? 'long' : 'short';

  useEffect(() => {
    const m = searchParamsUrl.get('mode');
    setPropertyMode(m === 'buy' ? 'buy' : 'rent');
  }, [searchParamsUrl]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { items: recentItems } = useRecentlyViewed<RecentProperty>('myuno_recently_viewed_properties');

  const serverFilters = useMemo(
    () =>
      filterValuesToPropertyFilters(filterValues, {
        listingType: propertyMode === 'buy' ? 'sale' : 'rent',
        rentTenancy: propertyMode === 'rent' ? rentTenancy : undefined,
      }),
    [filterValues, propertyMode, rentTenancy]
  );

  const { data: infiniteData, isLoading } = usePropertiesInfinite(serverFilters);

  const allProperties = useMemo(() => {
    return infiniteData?.pages.flatMap(p => p.properties) || [];
  }, [infiniteData]);

  // Category ribbon only — DB filters handled server-side
  const filteredProperties = useMemo(() => {
    let result = allProperties;

    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        selectedCategories.every((cat) => matchesCategory(p, cat))
      );
    }

    return result;
  }, [allProperties, selectedCategories]);

  const handlePropertyClick = useCallback((id: string) => {
    navigate(APP_ROUTES.PROPERTY_DETAIL(id));
  }, [navigate]);

  const handleSearch = useCallback((params: SearchParams) => {
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
    if (propertyMode === 'rent') {
      qp.set('tenancy', rentTenancy);
    }
    navigate(`${APP_ROUTES.PROPERTY_SEARCH}?${qp.toString()}`);
  }, [navigate, propertyMode, rentTenancy]);

  return (
    <AppLayout showHeader={false} showBottomNav showFooter>
      <SEOHead
        title={
          propertyMode === 'buy'
            ? isRu
              ? 'Покупка недвижимости на Пхукете'
              : 'Property for sale in Phuket'
            : isRu
              ? rentTenancy === 'long'
                ? 'Долгосрочная аренда на Пхукете'
                : 'Посуточная аренда на Пхукете'
              : rentTenancy === 'long'
                ? 'Long-term rent in Phuket'
                : 'Nightly rentals in Phuket'
        }
        description={
          propertyMode === 'buy'
            ? isRu
              ? 'Вторичка и новостройки — виллы, кондо и апартаменты на Пхукете.'
              : 'Resale and new builds — villas, condos, and apartments in Phuket.'
            : isRu
              ? rentTenancy === 'long'
                ? 'Долгосрочная аренда на Пхукете — месячные ставки, виллы и кондо.'
                : 'Посуточная аренда на Пхукете — виллы, кондо и апартаменты.'
              : rentTenancy === 'long'
                ? 'Long-term rentals in Phuket — monthly rates, villas and condos.'
                : 'Nightly stays in Phuket — villas, condos, and apartments.'
        }
      />
      <div className="pb-24">
        {/* Sticky header: tabs + search + categories */}
        <div className="sticky top-0 z-40 bg-background">
          {/* Property type tabs (Аренда / Купить / Новостройки …) */}
          <PropertyHubTabs />
          {/* Search pill + mode toggle */}
          <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "pt-3 pb-2")}>
            <div className="flex items-center gap-2">
              <BackButton fallbackPath={APP_ROUTES.PROPERTY} variant="ghost" size="sm" className="shrink-0 -ml-1" />
              <div className="flex-1">
                <AirbnbSearchBar onSearch={handleSearch} />
              </div>
              {/* Rent/Buy toggle removed — handled by PropertyHub tabs */}
            </div>
          </div>

          {/* Category icons ribbon — Airbnb-style with underline */}
          <div className="border-b">
            <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "flex items-center gap-2")}>
              <AirbnbCategoryRibbon 
                selected={selectedCategories} 
                onChange={setSelectedCategories}
                className="flex-1" 
              />
              {/* Filters button — opens UniversalFilter sheet */}
              <UniversalFilter
                config={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              >
                <button
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium text-foreground hover:shadow-sm transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {isRu ? 'Фильтры' : 'Filters'}
                  {activeFilterCount > 0 && (
                    <Badge className="ml-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </button>
              </UniversalFilter>
            </div>
          </div>
        </div>

        {/* Active filter badges */}
        {(selectedCategories.length > 0 || activeFilterCount > 0) && (
          <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "pt-2 flex items-center gap-2")}>
            <p className="text-xs text-muted-foreground">
              {filteredProperties.length} {isRu ? 'объектов' : 'places'}
            </p>
            <button
              onClick={() => {
                setSelectedCategories([]);
                setFilterValues({});
              }}
              className="text-xs text-primary font-medium hover:underline"
            >
              {isRu ? 'Сбросить' : 'Clear'}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="pt-4">
          <div className={ECOSYSTEM_PAGE_CONTAINER}>
            <VerticalContextBanner verticalId="property" />
          </div>
          {/* Recently Viewed — only when no category filters */}
          {recentItems.length > 0 && selectedCategories.length === 0 && (
            <section className={cn(ECOSYSTEM_PAGE_CONTAINER, "mb-6 px-0")}>
              <h2 className="text-base font-bold mb-3">
                {isRu ? 'Вы недавно смотрели' : 'Recently viewed'}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {recentItems.slice(0, 8).map((item) => (
                  <RecentCard key={item.id} item={item} onClick={() => handlePropertyClick(item.id)} />
                ))}
              </div>
            </section>
          )}

          {isLoading && (
            <section className={cn(ECOSYSTEM_PAGE_CONTAINER, "px-0")}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[4/5] sm:aspect-square rounded-lg sm:rounded-xl bg-muted animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main grid — Airbnb-style 2-col cards */}
          {!isLoading && filteredProperties.length > 0 && (
            <section className={cn(ECOSYSTEM_PAGE_CONTAINER, "px-0")}>
              <div className="flex items-center justify-between mb-3">
                {selectedCategories.length === 0 && (
                  <h2 className="text-base font-bold">
                    {isRu ? 'Все объекты' : 'All listings'}
                  </h2>
                )}
                <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => navigate(APP_ROUTES.PROPERTY_MAP)}>
                  <Map className="w-4 h-4" />
                  {isRu ? 'Карта' : 'Map'}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {filteredProperties.slice(0, 20).map((property) => (
                  <PropertyListingCard key={property.id} property={property} mode={propertyMode} />
                ))}
              </div>
              {filteredProperties.length > 20 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" className="gap-2" onClick={() => navigate(APP_ROUTES.PROPERTY_SEARCH)}>
                    {isRu ? `Показать все ${filteredProperties.length}` : `Show all ${filteredProperties.length}`}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </section>
          )}

          {!isLoading && filteredProperties.length === 0 && allProperties.length > 0 && (
            <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "text-center py-16")}>
              <p className="text-muted-foreground mb-3">
                {isRu ? 'Нет объектов с выбранными фильтрами' : 'No properties match selected filters'}
              </p>
              <Button variant="outline" size="sm" onClick={() => setSelectedCategories([])}>
                {isRu ? 'Сбросить фильтры' : 'Clear filters'}
              </Button>
            </div>
          )}

          <VerticalInsightPanel verticalId="property" className={ECOSYSTEM_PAGE_CONTAINER} />
          <CrossSellSection currentVertical="property" className={cn(ECOSYSTEM_PAGE_CONTAINER, "px-0 mt-8")} title={{ en: 'You may also need', ru: 'Может пригодиться' }} />
        </div>
      </div>
    </AppLayout>
  );
}
