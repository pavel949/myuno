import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BedDouble, Bath, Users, SlidersHorizontal, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, MiniAppCategory } from '@/components/miniapp/MiniAppLayout';
import { ItemCard } from '@/components/miniapp/ItemCard';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { propertyFilterConfig } from '@/components/filters/PropertyFilters';
import { useProperties, useInstantBookingProperties, Property } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
// Demo properties as fallback when DB is empty
const demoProperties = [
  {
    id: 'prop-1',
    title_en: 'Luxury Ocean View Villa',
    title_ru: 'Роскошная вилла с видом на океан',
    cover_image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
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
];

const propertyTypes: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🏠' },
  { id: 'villa', labelEn: 'Villa', labelRu: 'Вилла', icon: '🏡' },
  { id: 'apartment', labelEn: 'Apartment', labelRu: 'Апартаменты', icon: '🏢' },
  { id: 'condo', labelEn: 'Condo', labelRu: 'Кондо', icon: '🏬' },
  { id: 'house', labelEn: 'House', labelRu: 'Дом', icon: '🏘️' },
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия', icon: '🛏️' },
];

const listingTypes = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'rent', labelEn: 'Rent', labelRu: 'Аренда' },
  { id: 'sale', labelEn: 'Sale', labelRu: 'Продажа' },
];

export default function PropertyIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedListing, setSelectedListing] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch instant booking properties
  const { data: instantBookingProperties, isLoading: isLoadingInstant } = useInstantBookingProperties(10);

  // Fetch real properties from database
  const { data: dbProperties, isLoading } = useProperties({
    search: debouncedSearch,
    propertyType: selectedType,
    listingType: selectedListing,
    bedrooms: filterValues.bedrooms as string,
  }, 100);

  // Use DB data or fallback to demo
  const properties = useMemo(() => {
    if (dbProperties && dbProperties.length > 0) {
      return dbProperties;
    }
    // Fallback to demo data with client-side filtering
    return demoProperties.filter(prop => {
      const title = language === 'ru' ? prop.title_ru : prop.title_en;
      const matchesSearch = !debouncedSearch || title.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = selectedType === 'all' || prop.property_type === selectedType;
      const matchesListing = selectedListing === 'all' || prop.listing_type === selectedListing;
      
      if (filterValues.bedrooms) {
        const bedroomFilter = filterValues.bedrooms as string;
        if (bedroomFilter === 'studio' && prop.bedrooms !== 0) return false;
        if (bedroomFilter === '4+' && (prop.bedrooms || 0) < 4) return false;
        if (bedroomFilter !== '4+' && bedroomFilter !== 'studio' && prop.bedrooms !== parseInt(bedroomFilter)) return false;
      }
      
      return matchesSearch && matchesType && matchesListing;
    }) as unknown as Property[];
  }, [dbProperties, demoProperties, debouncedSearch, selectedType, selectedListing, filterValues, language]);

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
    <MiniAppLayout
      title={language === 'ru' ? 'Недвижимость' : 'Property'}
      subtitle={language === 'ru' ? `${properties.length} объектов` : `${properties.length} properties`}
      fallbackPath="/"
      
      heroIcon={Home}
      heroTitle={language === 'ru' ? 'Найдите идеальное жильё' : 'Find Your Perfect Home'}
      heroSubtitle={language === 'ru' ? 'Виллы, квартиры и кондо на Пхукете' : 'Villas, apartments & condos in Phuket'}
      heroImage="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"
      heroGradient={{ from: 'from-emerald-500/20', via: 'via-teal-500/20', to: 'to-primary/20' }}
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск недвижимости...' : 'Search properties...'}
      
      categories={propertyTypes}
      selectedCategory={selectedType}
      onCategoryChange={setSelectedType}
      
      filterButton={
        <UniversalFilter
          config={propertyFilterConfig}
          values={filterValues}
          onChange={setFilterValues}
          activeCount={activeFilterCount}
        >
          <Button variant="outline" size="icon" className="relative shrink-0 h-12 w-12">
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </UniversalFilter>
      }
      
      showMapButton
      mapPath="/property/map"
      
      quickActions={
        <FilterChipGroup scrollable>
          {listingTypes.map((type) => (
            <FilterChip
              key={type.id}
              label={language === 'ru' ? type.labelRu : type.labelEn}
              isActive={selectedListing === type.id}
              onToggle={() => setSelectedListing(type.id)}
            />
          ))}
        </FilterChipGroup>
      }
      
      resultsCount={properties.length}
      resultsLabel={language === 'ru' ? 'Доступные объекты' : 'Available Properties'}
    >
      {/* Instant Booking Section */}
      {!isLoadingInstant && instantBookingProperties && instantBookingProperties.length > 0 && !debouncedSearch && selectedType === 'all' && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-lg">
              {language === 'ru' ? 'Мгновенное бронирование' : 'Instant Booking'}
            </h2>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              {instantBookingProperties.length}
            </Badge>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-3">
              {instantBookingProperties.map((property) => (
                <div 
                  key={property.id} 
                  className="min-w-[280px] max-w-[280px] cursor-pointer"
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  <div className="relative rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative h-40">
                      <img 
                        src={property.cover_image || property.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400'} 
                        alt={language === 'ru' ? property.title_ru : property.title_en}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 gap-1">
                        <Zap className="w-3 h-3" />
                        {language === 'ru' ? 'Мгновенно' : 'Instant'}
                      </Badge>
                      {property.is_verified && (
                        <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0 text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-1">
                        {language === 'ru' ? property.title_ru : property.title_en}
                      </h3>
                      <p className="text-xs text-muted-foreground">{property.district}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-primary">
                          ฿{property.price?.toLocaleString()}{formatPriceLabel(property.price_period)}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3" /> {property.bedrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="w-3 h-3" /> {property.bathrooms}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Active Filters */}
      <ActiveFilters
        config={propertyFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-card border">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && (
        <div className="grid gap-4">
          {properties.map((property) => (
            <ItemCard
              key={property.id}
              title={language === 'ru' ? property.title_ru : property.title_en}
              image={property.cover_image || property.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600'}
              price={property.price || 0}
              priceLabel={formatPriceLabel(property.price_period)}
              rating={property.rating || 0}
              reviewCount={property.review_count || 0}
              location={property.district || ''}
              meta={[
                { icon: BedDouble, value: property.bedrooms || 0 },
                { icon: Bath, value: property.bathrooms || 0 },
                { icon: Users, value: property.max_guests || 0 },
              ]}
              tags={property.amenities?.slice(0, 2) || []}
              isVerified={property.is_verified}
              isFeatured={property.is_featured}
              badge={
                property.min_stay_nights === 1 
                  ? { text: language === 'ru' ? '⚡ Мин. 1 ночь' : '⚡ Min 1 night' }
                  : undefined
              }
              onClick={() => navigate(`/property/${property.id}`)}
            />
          ))}
          
          {properties.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {language === 'ru' ? 'Объекты не найдены' : 'No properties found'}
            </div>
          )}
        </div>
      )}
    </MiniAppLayout>
  );
}
