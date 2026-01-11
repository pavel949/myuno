import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Building2, Hotel, MapPin, BedDouble, Bath, Users, ArrowRight, Map, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnifiedCard } from '@/components/uno/UnifiedCard';
import { BackButton } from '@/components/uno/BackButton';
import { FilterChip } from '@/components/uno/FilterChip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { propertyFilterConfig } from '@/components/filters/PropertyFilters';

// Demo properties data
const demoProperties = [
  {
    id: 'prop-1',
    titleEn: 'Luxury Ocean View Villa',
    titleRu: 'Роскошная вилла с видом на океан',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
    rating: 4.9,
    reviewCount: 48,
    location: 'Kamala',
    locationRu: 'Камала',
    price: 85000,
    pricePeriod: 'month',
    propertyType: 'villa',
    listingType: 'rent',
    bedrooms: 4,
    bathrooms: 3,
    area: 350,
    maxGuests: 8,
    isVerified: true,
    isFeatured: true,
    amenities: ['Pool', 'Sea View', 'Gym', 'Garden'],
  },
  {
    id: 'prop-2',
    titleEn: 'Modern Condo in Patong',
    titleRu: 'Современное кондо в Патонге',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
    rating: 4.7,
    reviewCount: 92,
    location: 'Patong',
    locationRu: 'Патонг',
    price: 25000,
    pricePeriod: 'month',
    propertyType: 'condo',
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    maxGuests: 4,
    isVerified: true,
    isNew: true,
    amenities: ['Pool', 'Gym', 'Parking'],
  },
  {
    id: 'prop-3',
    titleEn: 'Cozy Studio near Beach',
    titleRu: 'Уютная студия у пляжа',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
    rating: 4.5,
    reviewCount: 156,
    location: 'Kata',
    locationRu: 'Ката',
    price: 1500,
    pricePeriod: 'night',
    propertyType: 'studio',
    listingType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    maxGuests: 2,
    isVerified: false,
    amenities: ['AC', 'WiFi', 'Kitchen'],
  },
  {
    id: 'prop-4',
    titleEn: 'Beachfront Apartment',
    titleRu: 'Апартаменты на берегу',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
    rating: 4.8,
    reviewCount: 67,
    location: 'Rawai',
    locationRu: 'Равай',
    price: 35000,
    pricePeriod: 'month',
    propertyType: 'apartment',
    listingType: 'rent',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    maxGuests: 6,
    isVerified: true,
    amenities: ['Pool', 'Beach Access', 'Balcony'],
  },
  {
    id: 'prop-5',
    titleEn: 'Traditional Thai House',
    titleRu: 'Традиционный тайский дом',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
    rating: 4.6,
    reviewCount: 34,
    location: 'Chalong',
    locationRu: 'Чалонг',
    price: 4500000,
    pricePeriod: 'total',
    propertyType: 'house',
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    maxGuests: 6,
    isVerified: true,
    amenities: ['Garden', 'Parking', 'Traditional Style'],
  },
];

const propertyTypes = [
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
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedListing, setSelectedListing] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

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

  const handleClearAllFilters = () => setFilterValues({});

  const filteredProperties = useMemo(() => {
    return demoProperties.filter(prop => {
      const title = language === 'ru' ? prop.titleRu : prop.titleEn;
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || prop.propertyType === selectedType;
      const matchesListing = selectedListing === 'all' || prop.listingType === selectedListing;
      
      // Bedrooms filter
      if (filterValues.bedrooms) {
        const bedroomFilter = filterValues.bedrooms as string;
        if (bedroomFilter === '4+' && prop.bedrooms < 4) return false;
        else if (bedroomFilter !== '4+' && prop.bedrooms !== parseInt(bedroomFilter)) return false;
      }
      
      return matchesSearch && matchesType && matchesListing;
    });
  }, [demoProperties, searchQuery, selectedType, selectedListing, filterValues, language]);

  const formatPrice = (price: number, period: string) => {
    const formatted = price >= 1000000 
      ? `${(price / 1000000).toFixed(1)}M` 
      : price >= 1000 
        ? `${(price / 1000).toFixed(0)}K`
        : price.toString();
    
    const periodLabels: Record<string, { en: string; ru: string }> = {
      night: { en: '/night', ru: '/ночь' },
      week: { en: '/week', ru: '/нед' },
      month: { en: '/mo', ru: '/мес' },
      year: { en: '/year', ru: '/год' },
      total: { en: '', ru: '' },
    };
    
    return `฿${formatted}${periodLabels[period]?.[language] || ''}`;
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Back Button */}
        <BackButton fallbackPath="/" />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-primary/20 p-6">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800')] bg-cover bg-center opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">
                {language === 'ru' ? 'Недвижимость' : 'Property'}
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {language === 'ru' 
                ? 'Найдите идеальное жильё' 
                : 'Find Your Perfect Home'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ru'
                ? 'Виллы, квартиры и кондо на Пхукете'
                : 'Villas, apartments & condos in Phuket'}
            </p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={language === 'ru' ? 'Поиск недвижимости...' : 'Search properties...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border/50"
            />
          </div>
          <UniversalFilter
            config={propertyFilterConfig}
            values={filterValues}
            onChange={setFilterValues}
          >
            <Button variant="outline" size="icon" className="h-12 w-12 relative">
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </UniversalFilter>
        </div>

        {/* Active Filters */}
        <ActiveFilters
          config={propertyFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Listing type toggle */}
        <div className="flex gap-2">
          {listingTypes.map((type) => (
            <FilterChip
              key={type.id}
              label={language === 'ru' ? type.labelRu : type.labelEn}
              isActive={selectedListing === type.id}
              onToggle={() => setSelectedListing(type.id)}
            />
          ))}
        </div>

        {/* Property type filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {propertyTypes.map((type) => (
            <FilterChip
              key={type.id}
              label={`${type.icon} ${language === 'ru' ? type.labelRu : type.labelEn}`}
              isActive={selectedType === type.id}
              onToggle={() => setSelectedType(type.id)}
            />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🏡', count: '150+', label: language === 'ru' ? 'Виллы' : 'Villas' },
            { icon: '🏢', count: '280+', label: language === 'ru' ? 'Квартиры' : 'Apartments' },
            { icon: '🏬', count: '120+', label: language === 'ru' ? 'Кондо' : 'Condos' },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-4 rounded-xl bg-card border border-border/50"
            >
              <span className="text-2xl mb-1">{stat.icon}</span>
              <span className="text-lg font-bold text-primary">{stat.count}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Properties List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {language === 'ru' ? 'Доступные объекты' : 'Available Properties'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/property/map')}
              className="flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              {language === 'ru' ? 'На карте' : 'Map'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredProperties.length} {language === 'ru' ? 'найдено' : 'found'}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                onClick={(e) => {
                  triggerRipple(e);
                  navigate(`/property/${property.id}`);
                }}
                className="relative overflow-hidden group cursor-pointer rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg active:scale-[0.98]"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={property.image}
                    alt={language === 'ru' ? property.titleRu : property.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Price badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {formatPrice(property.price, property.pricePeriod)}
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {property.isFeatured && (
                      <span className="px-2 py-1 rounded-full bg-gold/90 text-black text-xs font-medium">
                        ⭐ Featured
                      </span>
                    )}
                    {property.isNew && (
                      <span className="px-2 py-1 rounded-full bg-success/90 text-white text-xs font-medium">
                        New
                      </span>
                    )}
                  </div>
                  {/* Type badge */}
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
                    {language === 'ru' 
                      ? propertyTypes.find(t => t.id === property.propertyType)?.labelRu
                      : propertyTypes.find(t => t.id === property.propertyType)?.labelEn}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                    {language === 'ru' ? property.titleRu : property.titleEn}
                  </h3>
                  
                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{language === 'ru' ? property.locationRu : property.location}</span>
                  </div>
                  
                  {/* Specs */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-4 h-4" />
                      <span>{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      <span>{property.bathrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{property.area} м²</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{property.maxGuests}</span>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  {property.rating > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-sm">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{property.rating}</span>
                      <span className="text-muted-foreground">({property.reviewCount})</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
