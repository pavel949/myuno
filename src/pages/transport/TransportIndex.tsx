import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, Fuel, Settings2, SlidersHorizontal, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, transportFilterConfig, FilterValues } from '@/components/filters';

const VEHICLE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🚗' },
  { id: 'car', labelEn: 'Cars', labelRu: 'Авто', icon: '🚙' },
  { id: 'motorbike', labelEn: 'Bikes', labelRu: 'Мото', icon: '🏍️' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник', icon: '🚐' },
];

const demoVehicles = [
  {
    id: 'car-1',
    type: 'car',
    nameEn: 'Toyota Camry',
    nameRu: 'Тойота Камри',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600',
    pricePerDay: 1500,
    rating: 4.8,
    reviewCount: 89,
    location: 'Patong',
    locationRu: 'Патонг',
    seats: 5,
    transmission: 'Auto',
    fuel: 'Petrol',
    isAvailable: true,
    isFeatured: true,
  },
  {
    id: 'car-2',
    type: 'car',
    nameEn: 'Honda City',
    nameRu: 'Хонда Сити',
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600',
    pricePerDay: 1200,
    rating: 4.6,
    reviewCount: 156,
    location: 'Kata',
    locationRu: 'Ката',
    seats: 5,
    transmission: 'Auto',
    fuel: 'Petrol',
    isAvailable: true,
  },
  {
    id: 'bike-1',
    type: 'motorbike',
    nameEn: 'Honda PCX 160',
    nameRu: 'Хонда PCX 160',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    pricePerDay: 300,
    rating: 4.9,
    reviewCount: 234,
    location: 'Rawai',
    locationRu: 'Равай',
    seats: 2,
    transmission: 'Auto',
    fuel: 'Petrol',
    isAvailable: true,
    isNew: true,
  },
  {
    id: 'car-3',
    type: 'suv',
    nameEn: 'Toyota Fortuner',
    nameRu: 'Тойота Фортунер',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600',
    pricePerDay: 2500,
    rating: 4.7,
    reviewCount: 67,
    location: 'Airport',
    locationRu: 'Аэропорт',
    seats: 7,
    transmission: 'Auto',
    fuel: 'Diesel',
    isAvailable: true,
  },
  {
    id: 'bike-2',
    type: 'motorbike',
    nameEn: 'Yamaha NMAX',
    nameRu: 'Ямаха NMAX',
    image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600',
    pricePerDay: 350,
    rating: 4.5,
    reviewCount: 178,
    location: 'Kamala',
    locationRu: 'Камала',
    seats: 2,
    transmission: 'Auto',
    fuel: 'Petrol',
    isAvailable: false,
  },
];

const quickServices = [
  { icon: '🚗', label: 'Rental', labelRu: 'Аренда', path: '#vehicles' },
  { icon: '🚕', label: 'Taxi', labelRu: 'Такси', path: '/transport/taxi' },
  { icon: '✈️', label: 'Airport', labelRu: 'Аэропорт', path: '/transport/airport-transfer' },
  { icon: '🚤', label: 'Boats', labelRu: 'Катера', path: '/yachts' },
];

export default function TransportIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const activeFilterCount = useMemo(() => {
    return Object.values(filterValues).filter(v => 
      Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null
    ).length;
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

  const filteredVehicles = useMemo(() => {
    return demoVehicles.filter(v => {
      if (selectedCategory !== 'all' && v.type !== selectedCategory) return false;
      
      if (searchQuery) {
        const name = language === 'ru' ? v.nameRu : v.nameEn;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      if (filterValues.passengers) {
        const passMap: Record<string, number[]> = {
          '1-2': [1, 2],
          '3-4': [3, 4],
          '5-7': [5, 6, 7],
          '8+': [8, 9, 10, 11, 12]
        };
        const allowedSeats = passMap[filterValues.passengers as string] || [];
        if (!allowedSeats.includes(v.seats)) return false;
      }
      
      return true;
    });
  }, [demoVehicles, selectedCategory, searchQuery, filterValues, language]);

  const availableCount = filteredVehicles.filter(v => v.isAvailable).length;

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Транспорт' : 'Transport'}
      subtitle={language === 'ru' ? 'Аренда и трансферы' : 'Rentals & Transfers'}
      fallbackPath="/"
      
      heroIcon={Car}
      heroTitle={language === 'ru' ? 'Авто, мотобайки и трансферы' : 'Cars, bikes and transfers'}
      heroSubtitle={language === 'ru' ? `${availableCount} машин доступно` : `${availableCount} vehicles available`}
      heroBackgroundImage="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800"
      heroGradientFrom="from-indigo-500/20"
      heroGradientVia="via-blue-500/20"
      heroGradientTo="to-primary/20"
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск транспорта...' : 'Search vehicles...'}
      
      categories={VEHICLE_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
      filterButton={
        <UniversalFilter
          config={transportFilterConfig}
          values={filterValues}
          onChange={setFilterValues}
          activeCount={activeFilterCount}
        >
          <Button variant="outline" size="icon" className="relative shrink-0 h-10 w-10">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </UniversalFilter>
      }
      
      quickActions={
        <>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {language === 'ru' ? 'Быстрые услуги' : 'Quick Services'}
          </h3>
          <MiniAppQuickGrid 
            items={quickServices.map(s => ({
              ...s,
              label: language === 'ru' ? s.labelRu : s.label
            }))} 
            columns={4} 
          />
        </>
      }
      
      resultsCount={filteredVehicles.length}
      resultsLabel={language === 'ru' ? 'Доступно для аренды' : 'Available for Rent'}
    >
      {/* Active Filters */}
      <ActiveFilters
        config={transportFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => (
          <ItemCard
            key={vehicle.id}
            title={language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
            image={vehicle.image}
            price={vehicle.pricePerDay}
            priceLabel={`/${language === 'ru' ? 'день' : 'day'}`}
            rating={vehicle.rating}
            reviewCount={vehicle.reviewCount}
            location={language === 'ru' ? vehicle.locationRu : vehicle.location}
            meta={[
              { icon: Users, value: vehicle.seats },
              { icon: Settings2, value: vehicle.transmission },
              { icon: Fuel, value: vehicle.fuel },
            ]}
            isNew={vehicle.isNew}
            isFeatured={vehicle.isFeatured}
            isAvailable={vehicle.isAvailable}
            onClick={() => navigate(`/transport/vehicle/${vehicle.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
