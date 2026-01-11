import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BedDouble, Bath, Users, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, MiniAppCategory } from '@/components/miniapp/MiniAppLayout';
import { ItemCard } from '@/components/miniapp/ItemCard';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
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

  const formatPriceLabel = (period: string) => {
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
      subtitle={language === 'ru' ? `${filteredProperties.length} объектов` : `${filteredProperties.length} properties`}
      fallbackPath="/"
      
      heroIcon={Home}
      heroTitle={language === 'ru' ? 'Найдите идеальное жильё' : 'Find Your Perfect Home'}
      heroSubtitle={language === 'ru' ? 'Виллы, квартиры и кондо на Пхукете' : 'Villas, apartments & condos in Phuket'}
      heroBackgroundImage="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"
      heroGradientFrom="from-emerald-500/20"
      heroGradientVia="via-teal-500/20"
      heroGradientTo="to-primary/20"
      
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
      
      resultsCount={filteredProperties.length}
      resultsLabel={language === 'ru' ? 'Доступные объекты' : 'Available Properties'}
    >
      {/* Active Filters */}
      <ActiveFilters
        config={propertyFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      {/* Results Grid */}
      <div className="grid gap-4">
        {filteredProperties.map((property) => (
          <ItemCard
            key={property.id}
            title={language === 'ru' ? property.titleRu : property.titleEn}
            image={property.image}
            price={property.price}
            priceLabel={formatPriceLabel(property.pricePeriod)}
            rating={property.rating}
            reviewCount={property.reviewCount}
            location={language === 'ru' ? property.locationRu : property.location}
            meta={[
              { icon: BedDouble, value: property.bedrooms },
              { icon: Bath, value: property.bathrooms },
              { icon: Users, value: property.maxGuests },
            ]}
            tags={property.amenities.slice(0, 2)}
            isVerified={property.isVerified}
            isNew={property.isNew}
            isFeatured={property.isFeatured}
            onClick={() => navigate(`/property/${property.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
