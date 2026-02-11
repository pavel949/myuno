/**
 * PropertyIndex — Airbnb-style Discovery Page
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Star, ArrowRight, MapPin, Loader2, Home, ChevronDown, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyMode } from '@/components/property/PropertyCategoryRibbon';
import { PropertyCategoryIcons, matchesCategory } from '@/components/property/PropertyCategoryIcons';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { CrossSellSection } from '@/components/crosssell';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
      className="w-[300px] shrink-0 text-left group"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold line-clamp-1">
            {property.district || 'Phuket'}
          </h3>
          {property.rating != null && property.rating > 0 && (
            <span className="flex items-center gap-1 text-sm shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              {property.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>
        <p className="text-sm font-semibold pt-0.5">
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Inline filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);
  const [instantBookOnly, setInstantBookOnly] = useState(false);

  const { propertyTypes } = usePropertyFilterOptions();

  const BEDROOM_OPTIONS = [
    { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
    { id: '1', labelEn: '1+', labelRu: '1+' },
    { id: '2', labelEn: '2+', labelRu: '2+' },
    { id: '3', labelEn: '3+', labelRu: '3+' },
    { id: '4', labelEn: '4+', labelRu: '4+' },
    { id: '5', labelEn: '5+', labelRu: '5+' },
    { id: '6', labelEn: '6+', labelRu: '6+' },
    { id: '8', labelEn: '8+', labelRu: '8+' },
    { id: '10', labelEn: '10+', labelRu: '10+' },
    { id: '12', labelEn: '12+', labelRu: '12+' },
  ];

  const { items: recentItems } = useRecentlyViewed<RecentProperty>('myuno_recently_viewed_properties');

  // Fetch properties
  const { data: infiniteData, isLoading } = usePropertiesInfinite({
    listingType: propertyMode === 'buy' ? 'sale' : 'rent',
  });

  const allProperties = useMemo(() => {
    const items = infiniteData?.pages.flatMap(p => p.properties) || [];
    return items.filter(p => {
      // Category filter (AND-logic: must match ALL selected categories)
      if (selectedCategories.length > 0) {
        const passesAll = selectedCategories.every(cat => matchesCategory(p, cat));
        if (!passesAll) return false;
      }
      // Type filter
      if (selectedTypes.length > 0) {
        const propType = (p.property_type || '').toLowerCase();
        if (!selectedTypes.some(t => propType.includes(t.toLowerCase()))) return false;
      }
      // Bedroom filter (N+ logic)
      if (selectedBedrooms.length > 0) {
        const propBedrooms = p.bedrooms ?? 0;
        const hasStudio = selectedBedrooms.includes('studio');
        const numericBedrooms = selectedBedrooms.filter(b => b !== 'studio').map(b => parseInt(b) || 0);
        if (hasStudio && propBedrooms === 0) return true;
        if (numericBedrooms.length > 0) {
          const minBed = Math.min(...numericBedrooms);
          if (propBedrooms >= minBed) return true;
          if (hasStudio && propBedrooms === 0) return true;
          return false;
        }
        if (hasStudio && propBedrooms !== 0) return false;
      }
      // Instant booking filter
      if (instantBookOnly && !p.instant_booking) return false;
      return true;
    });
  }, [infiniteData, selectedCategories, selectedTypes, selectedBedrooms, instantBookOnly]);

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
            <h1 className="text-lg font-bold flex-1">
              {isRu ? 'Жильё' : 'Stays'}
            </h1>
            {/* Compact Rent/Buy toggle */}
            <div className="flex p-0.5 bg-muted/60 rounded-lg">
              <button
                onClick={() => setPropertyMode('rent')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  propertyMode === 'rent'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isRu ? 'Аренда' : 'Rent'}
              </button>
              <button
                onClick={() => setPropertyMode('buy')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  propertyMode === 'buy'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isRu ? 'Покупка' : 'Buy'}
              </button>
            </div>
          </div>

          {/* Search bar — Airbnb style (functional inline) */}
          <AirbnbSearchBar
            onSearch={(params: SearchParams) => {
              const qp = new URLSearchParams();
              if (params.locations.length > 0) qp.set('district', params.locations[0]);
              if (params.checkIn) qp.set('checkIn', params.checkIn.toISOString());
              if (params.checkOut) qp.set('checkOut', params.checkOut.toISOString());
              if (params.guests) qp.set('guests', String(params.guests));
              if (params.bedrooms.length > 0) qp.set('bedrooms', params.bedrooms.join(','));
              if (selectedTypes.length > 0) qp.set('types', selectedTypes.join(','));
              if (instantBookOnly) qp.set('instant', '1');
              qp.set('mode', propertyMode);
              navigate(`/property/search?${qp.toString()}`);
            }}
          />
        </div>

        {/* Category Icons Ribbon — Airbnb style */}
        <PropertyCategoryIcons
          selected={selectedCategories}
          onSelect={setSelectedCategories}
          className="border-b border-border/40 py-2"
        />

        {/* Inline Filter Bar */}
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          {/* Property Type Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all shrink-0",
                selectedTypes.length > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              )}>
                <Home className="w-3.5 h-3.5" />
                <span>
                  {selectedTypes.length > 0
                    ? selectedTypes.slice(0, 2).map(t => {
                        const opt = propertyTypes.find(p => p.id === t);
                        return opt ? (isRu ? opt.labelRu : opt.labelEn) : t;
                      }).join(', ')
                    : (isRu ? 'Тип жилья' : 'Type')
                  }
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start" sideOffset={6}>
              <div className="grid grid-cols-2 gap-1.5">
                {propertyTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypes(prev =>
                      prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                    )}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      selectedTypes.includes(type.id)
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    )}
                  >
                    {isRu ? type.labelRu : type.labelEn}
                  </button>
                ))}
              </div>
              {selectedTypes.length > 0 && (
                <button onClick={() => setSelectedTypes([])} className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-center py-1">
                  {isRu ? 'Сбросить' : 'Clear'}
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* Bedrooms Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all shrink-0",
                selectedBedrooms.length > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              )}>
                <span>
                  {selectedBedrooms.length > 0
                    ? (selectedBedrooms.length === 1
                        ? (selectedBedrooms[0] === 'studio' ? (isRu ? 'Студия' : 'Studio') : `${selectedBedrooms[0]}+ ${isRu ? 'сп.' : 'beds'}`)
                        : `${selectedBedrooms.length} ${isRu ? 'выбр.' : 'sel.'}`)
                    : (isRu ? 'Спальни' : 'Beds')
                  }
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start" sideOffset={6}>
              <div className="grid grid-cols-4 gap-1.5">
                {BEDROOM_OPTIONS.map(bed => (
                  <button
                    key={bed.id}
                    onClick={() => setSelectedBedrooms(prev =>
                      prev.includes(bed.id) ? prev.filter(b => b !== bed.id) : [...prev, bed.id]
                    )}
                    className={cn(
                      "py-2 px-1 rounded-lg text-sm font-medium transition-colors text-center",
                      selectedBedrooms.includes(bed.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                    )}
                  >
                    {isRu ? bed.labelRu : bed.labelEn}
                  </button>
                ))}
              </div>
              {selectedBedrooms.length > 0 && (
                <button onClick={() => setSelectedBedrooms([])} className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-center py-1">
                  {isRu ? 'Сбросить' : 'Clear'}
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* Instant Book Toggle */}
          <button
            onClick={() => setInstantBookOnly(prev => !prev)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all shrink-0",
              instantBookOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isRu ? 'Мгновенное' : 'Instant'}</span>
          </button>

          {/* Clear all filters */}
          {(selectedTypes.length > 0 || selectedBedrooms.length > 0 || instantBookOnly) && (
            <button
              onClick={() => { setSelectedTypes([]); setSelectedBedrooms([]); setInstantBookOnly(false); }}
              className="text-xs text-primary hover:underline shrink-0 ml-1"
            >
              {isRu ? 'Сброс' : 'Clear'}
            </button>
          )}
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
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/property/map')}>
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">{isRu ? 'Карта' : 'Map'}</span>
                </Button>
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

          {/* Cross-sell: May also need */}
          <CrossSellSection
            currentVertical="property"
            className="px-4"
            title={{
              en: 'You may also need',
              ru: 'Может пригодиться',
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
