/**
 * PropertyIndex — Airbnb-style Discovery Page
 * 
 * Sections:
 * 1. Search bar (rounded, prominent)
 * 2. Category tabs (Rent / Buy)
 * 3. Recently Viewed (horizontal scroll)
 * 4. Featured / Guest Favorites (horizontal scroll)
 * 5. By District sections (horizontal scroll)
 * 6. All listings link → full catalog grid
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Heart, Star, BedDouble, ArrowRight, SlidersHorizontal, MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyCategoryRibbon, PropertyMode } from '@/components/property/PropertyCategoryRibbon';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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

// ── Compact horizontal card ──
function PropertyScrollCard({ property, mode, onClick }: { 
  property: Property; 
  mode: PropertyMode;
  onClick: () => void;
}) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const title = isRu ? property.title_ru : property.title_en;
  const image = property.cover_image || property.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400';

  return (
    <button 
      onClick={onClick}
      className="w-[260px] shrink-0 text-left group"
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <button
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-background/70 hover:bg-background transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="w-4 h-4" />
        </button>
        {property.is_featured && (
          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-background/90 text-[11px] font-semibold">
            {isRu ? 'Выбор гостей' : 'Guest favorite'}
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold line-clamp-1">
          {property.district || 'Phuket'}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {property.bedrooms || 0} {isRu ? 'кроват' : 'bed'}{(property.bedrooms || 0) !== 1 ? (isRu ? 'и' : 's') : (isRu ? 'ь' : '')}
          {property.rating != null && property.rating > 0 && (
            <> · <Star className="w-3 h-3 inline fill-current" /> {property.rating.toFixed(1)}</>
          )}
        </p>
        <p className="text-sm font-semibold">
          {formatPrice(property.price || 0)}
          <span className="font-normal text-muted-foreground text-xs">
            {mode === 'buy' ? '' : `/${isRu ? 'ночь' : 'night'}`}
          </span>
        </p>
      </div>
    </button>
  );
}

// ── Recently Viewed Card (compact) ──
function RecentCard({ item, onClick }: { item: RecentProperty; onClick: () => void }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <button onClick={onClick} className="w-[150px] shrink-0 text-left group">
      <div className="relative aspect-square rounded-xl overflow-hidden mb-1.5">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
        <button
          className="absolute top-2 right-2 p-1 rounded-full bg-background/70 hover:bg-background transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs font-semibold line-clamp-1">{item.district}</p>
      <p className="text-[11px] text-muted-foreground">
        {item.bedrooms} {isRu ? 'кроват' : 'bed'}{item.bedrooms !== 1 ? (isRu ? 'и' : 's') : (isRu ? 'ь' : '')}
        {item.rating != null && item.rating > 0 && (
          <> · <Star className="w-2.5 h-2.5 inline fill-current" /> {item.rating.toFixed(1)}</>
        )}
      </p>
    </button>
  );
}

// ── Section Header ──
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
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

  const { propertyTypes } = usePropertyFilterOptions();

  const { items: recentItems } = useRecentlyViewed<RecentProperty>('myuno_recently_viewed_properties');

  // Fetch properties
  const { data: infiniteData, isLoading } = usePropertiesInfinite({
    listingType: propertyMode === 'buy' ? 'sale' : 'rent',
  });

  const allProperties = useMemo(() => 
    infiniteData?.pages.flatMap(p => p.properties) || [],
    [infiniteData]
  );

  // Featured
  const featured = useMemo(() => 
    allProperties.filter(p => p.is_featured).slice(0, 10),
    [allProperties]
  );

  // Group by district
  const byDistrict = useMemo(() => {
    const grouped: Record<string, Property[]> = {};
    for (const p of allProperties) {
      const d = p.district || 'Phuket';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(p);
    }
    // Sort districts by count, take top 4
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 4)
      .filter(([, items]) => items.length >= 2);
  }, [allProperties]);

  const handlePropertyClick = useCallback((id: string) => {
    navigate(`/property/${id}`);
  }, [navigate]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <BackButton fallbackPath="/" variant="ghost" size="sm" />
            <h1 className="text-lg font-bold">
              {propertyMode === 'buy' 
                ? (isRu ? 'Купить недвижимость' : 'Buy Property')
                : (isRu ? 'Аренда жилья' : 'Vacation Rentals')
              }
            </h1>
          </div>

          {/* Search bar — Airbnb style */}
          <button
            onClick={() => navigate('/property/search')}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-full border border-border shadow-sm hover:shadow-md transition-shadow bg-card"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isRu ? 'Начать поиск' : 'Start your search'}
            </span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="px-4 py-2 border-b border-border/50">
          <PropertyCategoryRibbon
            mode={propertyMode}
            onModeChange={setPropertyMode}
            selectedType="all"
            onTypeChange={() => {}}
            propertyTypes={propertyTypes}
          />
        </div>

        {/* Content */}
        <div className="space-y-6 pt-4">

          {/* Recently Viewed */}
          {recentItems.length > 0 && (
            <section>
              <SectionHeader
                title={isRu ? 'Вы недавно смотрели' : 'Recently viewed'}
              />
              <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
                {recentItems.slice(0, 8).map((item) => (
                  <RecentCard
                    key={item.id}
                    item={item}
                    onClick={() => handlePropertyClick(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Featured / Guest Favorites */}
          {!isLoading && featured.length > 0 && (
            <section>
              <SectionHeader
                title={isRu ? 'Популярное жильё' : 'Guest favorites'}
                onSeeAll={() => navigate('/property/search')}
              />
              <div className="flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-hide">
                {featured.map((property) => (
                  <PropertyScrollCard
                    key={property.id}
                    property={property}
                    mode={propertyMode}
                    onClick={() => handlePropertyClick(property.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* By District */}
          {!isLoading && byDistrict.map(([district, items]) => (
            <section key={district}>
              <SectionHeader
                title={isRu ? `${district}: доступное жильё` : `${district}: available stays`}
                onSeeAll={() => navigate(`/property/search?district=${encodeURIComponent(district)}`)}
              />
              <div className="flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-hide">
                {items.slice(0, 8).map((property) => (
                  <PropertyScrollCard
                    key={property.id}
                    property={property}
                    mode={propertyMode}
                    onClick={() => handlePropertyClick(property.id)}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* All Properties — grid teaser */}
          {!isLoading && allProperties.length > 0 && (
            <section className="px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">
                  {isRu ? 'Все объекты' : 'All listings'}
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/property/map')}>
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline">{isRu ? 'Карта' : 'Map'}</span>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/property/search')}>
                    <SlidersHorizontal className="w-4 h-4" />
                    {isRu ? 'Фильтры' : 'Filters'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {allProperties.slice(0, 8).map((property) => (
                  <PropertyListingCard
                    key={property.id}
                    property={property}
                    mode={propertyMode}
                  />
                ))}
              </div>
              {allProperties.length > 8 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate('/property/search')}
                  >
                    {isRu 
                      ? `Показать все ${allProperties.length} объектов` 
                      : `Show all ${allProperties.length} listings`}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
