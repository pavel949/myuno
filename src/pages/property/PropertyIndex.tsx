/**
 * PropertyIndex — Airbnb-style Discovery Page
 * Clean search pill + category icons ribbon + card grid
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Star, ArrowRight, MapPin, Loader2, SlidersHorizontal, Map } from 'lucide-react';
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
import { AirbnbCategoryRibbon } from '@/components/property/PropertyCategoryIcons.ribbon';
import { CrossSellSection } from '@/components/crosssell';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  const [propertyMode, setPropertyMode] = useState<PropertyMode>(
    (searchParamsUrl.get('mode') as PropertyMode) || 'rent'
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { items: recentItems } = useRecentlyViewed<RecentProperty>('myuno_recently_viewed_properties');

  const { data: infiniteData, isLoading } = usePropertiesInfinite({
    listingType: propertyMode === 'buy' ? 'sale' : 'rent',
  });

  const allProperties = useMemo(() => {
    return infiniteData?.pages.flatMap(p => p.properties) || [];
  }, [infiniteData]);

  // Filter by selected categories (AND logic — must match ALL selected)
  const filteredProperties = useMemo(() => {
    if (selectedCategories.length === 0) return allProperties;
    return allProperties.filter(p =>
      selectedCategories.every(cat => matchesCategory(p, cat))
    );
  }, [allProperties, selectedCategories]);

  const handlePropertyClick = useCallback((id: string) => {
    navigate(`/property/${id}`);
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
    navigate(`/property/search?${qp.toString()}`);
  }, [navigate, propertyMode]);

  return (
    <AppLayout showHeader={false} showBottomNav showFooter>
      <div className="min-h-screen bg-background pb-24">
        {/* Sticky header: search + categories */}
        <div className="sticky top-0 z-40 bg-background">
          {/* Search pill + mode toggle */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <BackButton fallbackPath="/" variant="ghost" size="sm" className="shrink-0 -ml-1" />
              <div className="flex-1">
                <AirbnbSearchBar onSearch={handleSearch} />
              </div>
              {/* Rent/Buy toggle — compact, desktop-like */}
              <div className="hidden sm:flex p-0.5 bg-muted/60 rounded-lg shrink-0">
                <button
                  onClick={() => setPropertyMode('rent')}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", propertyMode === 'rent' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  {isRu ? 'Аренда' : 'Rent'}
                </button>
                <button
                  onClick={() => setPropertyMode('buy')}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", propertyMode === 'buy' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  {isRu ? 'Покупка' : 'Buy'}
                </button>
              </div>
            </div>

            {/* Mobile: Rent/Buy as subtle text tabs */}
            <div className="sm:hidden flex items-center gap-4 mt-2">
              <button
                onClick={() => setPropertyMode('rent')}
                className={cn(
                  "text-sm font-medium pb-1 border-b-2 transition-all",
                  propertyMode === 'rent'
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
              >
                {isRu ? 'Аренда' : 'Stays'}
              </button>
              <button
                onClick={() => setPropertyMode('buy')}
                className={cn(
                  "text-sm font-medium pb-1 border-b-2 transition-all",
                  propertyMode === 'buy'
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
              >
                {isRu ? 'Покупка' : 'Buy'}
              </button>
            </div>
          </div>

          {/* Category icons ribbon — Airbnb-style with underline */}
          <div className="border-b">
            <div className="px-4 flex items-center gap-2">
              <AirbnbCategoryRibbon 
                selected={selectedCategories} 
                onChange={setSelectedCategories}
                className="flex-1" 
              />
              {/* Filters button */}
              <button
                onClick={() => navigate('/property/search')}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium text-foreground hover:shadow-sm transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isRu ? 'Фильтры' : 'Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* Active category badges */}
        {selectedCategories.length > 0 && (
          <div className="px-4 pt-2 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {filteredProperties.length} {isRu ? 'объектов' : 'places'}
            </p>
            <button
              onClick={() => setSelectedCategories([])}
              className="text-xs text-primary font-medium hover:underline"
            >
              {isRu ? 'Сбросить' : 'Clear'}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="pt-4">
          {/* Recently Viewed — only when no category filters */}
          {recentItems.length > 0 && selectedCategories.length === 0 && (
            <section className="mb-6">
              <h2 className="text-base font-bold px-4 mb-3">
                {isRu ? 'Вы недавно смотрели' : 'Recently viewed'}
              </h2>
              <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
                {recentItems.slice(0, 8).map((item) => (
                  <RecentCard key={item.id} item={item} onClick={() => handlePropertyClick(item.id)} />
                ))}
              </div>
            </section>
          )}

          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Main grid — Airbnb-style 2-col cards */}
          {!isLoading && filteredProperties.length > 0 && (
            <section className="px-4">
              <div className="flex items-center justify-between mb-3">
                {selectedCategories.length === 0 && (
                  <h2 className="text-base font-bold">
                    {isRu ? 'Все объекты' : 'All listings'}
                  </h2>
                )}
                <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => navigate('/property/map')}>
                  <Map className="w-4 h-4" />
                  {isRu ? 'Карта' : 'Map'}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {filteredProperties.slice(0, 20).map((property) => (
                  <PropertyListingCard key={property.id} property={property} mode={propertyMode} />
                ))}
              </div>
              {filteredProperties.length > 20 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" className="gap-2" onClick={() => navigate('/property/search')}>
                    {isRu ? `Показать все ${filteredProperties.length}` : `Show all ${filteredProperties.length}`}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </section>
          )}

          {!isLoading && filteredProperties.length === 0 && allProperties.length > 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-muted-foreground mb-3">
                {isRu ? 'Нет объектов с выбранными фильтрами' : 'No properties match selected filters'}
              </p>
              <Button variant="outline" size="sm" onClick={() => setSelectedCategories([])}>
                {isRu ? 'Сбросить фильтры' : 'Clear filters'}
              </Button>
            </div>
          )}

          <CrossSellSection currentVertical="property" className="px-4 mt-8" title={{ en: 'You may also need', ru: 'Может пригодиться' }} />
        </div>
      </div>
    </AppLayout>
  );
}
