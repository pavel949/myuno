import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BedDouble, Bath, Users, SlidersHorizontal, Zap, MapPin, Star, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { propertyFilterConfig } from '@/components/filters/PropertyFilters';
import { useProperties, useInstantBookingProperties, Property } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { AirbnbSearchBar, SearchParams } from '@/components/property/AirbnbSearchBar';
import { cn } from '@/lib/utils';

// Demo properties as fallback when DB is empty
const demoProperties = [
  {
    id: 'prop-1',
    title_en: 'Luxury Ocean View Villa',
    title_ru: 'Роскошная вилла с видом на океан',
    cover_image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600'],
    rating: 4.9,
    review_count: 48,
    district: 'Kamala',
    price: 85000,
    price_period: 'month',
    property_type: 'villa',
    listing_type: 'rent',
    bedrooms: 4,
    bathrooms: 3,
    area_sqm: 350,
    max_guests: 8,
    is_verified: true,
    is_featured: true,
    amenities: ['Pool', 'Sea View', 'Gym', 'Garden'],
  },
  {
    id: 'prop-2',
    title_en: 'Modern Condo in Patong',
    title_ru: 'Современное кондо в Патонге',
    cover_image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'],
    rating: 4.7,
    review_count: 92,
    district: 'Patong',
    price: 25000,
    price_period: 'month',
    property_type: 'condo',
    listing_type: 'rent',
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 85,
    max_guests: 4,
    is_verified: true,
    amenities: ['Pool', 'Gym', 'Parking'],
  },
  {
    id: 'prop-3',
    title_en: 'Cozy Studio near Beach',
    title_ru: 'Уютная студия у пляжа',
    cover_image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'],
    rating: 4.5,
    review_count: 156,
    district: 'Kata',
    price: 1500,
    price_period: 'night',
    property_type: 'studio',
    listing_type: 'rent',
    bedrooms: 0,
    bathrooms: 1,
    area_sqm: 45,
    max_guests: 2,
    is_verified: false,
    amenities: ['AC', 'WiFi', 'Kitchen'],
  },
  {
    id: 'prop-4',
    title_en: 'Beachfront Apartment',
    title_ru: 'Апартаменты на берегу',
    cover_image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'],
    rating: 4.8,
    review_count: 67,
    district: 'Rawai',
    price: 35000,
    price_period: 'month',
    property_type: 'apartment',
    listing_type: 'rent',
    bedrooms: 3,
    bathrooms: 2,
    area_sqm: 120,
    max_guests: 6,
    is_verified: true,
    amenities: ['Pool', 'Beach Access', 'Balcony'],
  },
  {
    id: 'prop-5',
    title_en: 'Traditional Thai House',
    title_ru: 'Традиционный тайский дом',
    cover_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'],
    rating: 4.6,
    review_count: 34,
    district: 'Chalong',
    price: 4500000,
    price_period: 'total',
    property_type: 'house',
    listing_type: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    area_sqm: 180,
    max_guests: 6,
    is_verified: true,
    amenities: ['Garden', 'Parking', 'Traditional Style'],
  },
  {
    id: 'prop-6',
    title_en: 'Penthouse with Panoramic Views',
    title_ru: 'Пентхаус с панорамным видом',
    cover_image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600'],
    rating: 4.95,
    review_count: 23,
    district: 'Surin',
    price: 120000,
    price_period: 'month',
    property_type: 'condo',
    listing_type: 'rent',
    bedrooms: 3,
    bathrooms: 3,
    area_sqm: 200,
    max_guests: 6,
    is_verified: true,
    is_featured: true,
    amenities: ['Pool', 'Sea View', 'Gym', 'Jacuzzi'],
  },
];

const propertyTypes = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🏠' },
  { id: 'villa', labelEn: 'Villas', labelRu: 'Виллы', icon: '🏡' },
  { id: 'apartment', labelEn: 'Apartments', labelRu: 'Апартаменты', icon: '🏢' },
  { id: 'condo', labelEn: 'Condos', labelRu: 'Кондо', icon: '🏬' },
  { id: 'house', labelEn: 'Houses', labelRu: 'Дома', icon: '🏘️' },
  { id: 'studio', labelEn: 'Studios', labelRu: 'Студии', icon: '🛏️' },
];

export default function PropertyIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    locations: [],
    checkIn: undefined,
    checkOut: undefined,
    guests: 2,
  });
  const [selectedType, setSelectedType] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);

  // Fetch instant booking properties
  const { data: instantBookingProperties, isLoading: isLoadingInstant } = useInstantBookingProperties(10);

  // Fetch real properties from database
  const { data: dbProperties, isLoading } = useProperties({
    search: searchParams.locations.length === 1 ? searchParams.locations[0] : undefined,
    propertyType: selectedType,
    listingType: 'rent', // Always show rentals for Airbnb-style
    bedrooms: filterValues.bedrooms as string,
  }, 100);

  // Use DB data or fallback to demo
  const properties = useMemo(() => {
    const sourceData = dbProperties && dbProperties.length > 0 
      ? dbProperties 
      : demoProperties.filter(p => p.listing_type === 'rent');
    
    return sourceData.filter(prop => {
      const matchesLocation = searchParams.locations.length === 0 || 
        searchParams.locations.some(loc => 
          prop.district?.toLowerCase().includes(loc.toLowerCase())
        );
      const matchesType = selectedType === 'all' || prop.property_type === selectedType;
      const matchesGuests = !searchParams.guests || (prop.max_guests || 0) >= searchParams.guests;
      
      if (filterValues.bedrooms) {
        const bedroomFilter = filterValues.bedrooms as string;
        if (bedroomFilter === 'studio' && prop.bedrooms !== 0) return false;
        if (bedroomFilter === '4+' && (prop.bedrooms || 0) < 4) return false;
        if (bedroomFilter !== '4+' && bedroomFilter !== 'studio' && prop.bedrooms !== parseInt(bedroomFilter)) return false;
      }
      
      return matchesLocation && matchesType && matchesGuests;
    }) as unknown as Property[];
  }, [dbProperties, searchParams, selectedType, filterValues]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

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
            <div className="flex items-center gap-4 mb-4">
              <BackButton fallbackPath="/" variant="ghost" size="sm" />
              <h1 className="text-xl font-bold">
                {language === 'ru' ? 'Аренда жилья' : 'Vacation Rentals'}
              </h1>
            </div>
            
            {/* Airbnb-style Search Bar */}
            <AirbnbSearchBar 
              onSearch={setSearchParams}
              className="mb-4"
            />

            {/* Property Type Pills */}
            <div className="flex items-center gap-2">
              <ScrollArea className="flex-1">
                <div className="flex gap-2 pb-2">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all border",
                        selectedType === type.id
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-xs">{language === 'ru' ? type.labelRu : type.labelEn}</span>
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Filter Button */}
              <UniversalFilter
                config={propertyFilterConfig}
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
          </div>
        </header>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="container max-w-7xl mx-auto px-4 py-3">
            <ActiveFilters
              config={propertyFilterConfig}
              values={filterValues}
              onRemove={handleRemoveFilter}
              onClearAll={() => setFilterValues({})}
            />
          </div>
        )}

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
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    <img 
                      src={property.cover_image || property.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600'} 
                      alt={language === 'ru' ? property.title_ru : property.title_en}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-300",
                        hoveredProperty === property.id && "scale-105"
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
                      {property.min_stay_nights === 1 && (
                        <Badge className="bg-amber-500 text-white border-0 text-xs gap-1">
                          <Zap className="w-3 h-3" />
                          {language === 'ru' ? 'Быстрое' : 'Instant'}
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
                      <span className="font-semibold">฿{property.price?.toLocaleString()}</span>
                      <span className="text-muted-foreground">{formatPriceLabel(property.price_period)}</span>
                    </p>
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
                  }}>
                    {language === 'ru' ? 'Сбросить фильтры' : 'Clear all filters'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
