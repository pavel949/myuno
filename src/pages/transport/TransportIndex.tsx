import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, Fuel, Settings2, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, transportFilterConfig, FilterValues } from '@/components/filters';
import { useVehicles } from '@/hooks/useVehicles';

const VEHICLE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🚗' },
  { id: 'car', labelEn: 'Cars', labelRu: 'Авто', icon: '🚙' },
  { id: 'motorbike', labelEn: 'Bikes', labelRu: 'Мото', icon: '🏍️' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник', icon: '🚐' },
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
  const { vehicles, isLoading } = useVehicles();
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
    return vehicles.filter(v => {
      if (selectedCategory !== 'all' && v.vehicle_type !== selectedCategory) return false;
      
      if (searchQuery) {
        const name = language === 'ru' ? v.name_ru : v.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      if (filterValues.passengers) {
        const cap = v.capacity || 0;
        const passMap: Record<string, number[]> = {
          '1-2': [1, 2],
          '3-4': [3, 4],
          '5-7': [5, 6, 7],
          '8+': [8, 9, 10, 11, 12]
        };
        const allowedSeats = passMap[filterValues.passengers as string] || [];
        if (!allowedSeats.includes(cap)) return false;
      }
      
      return true;
    });
  }, [vehicles, selectedCategory, searchQuery, filterValues, language]);

  const availableCount = filteredVehicles.filter(v => v.is_available).length;

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
      
      isLoading={isLoading}
      isEmpty={filteredVehicles.length === 0}
      emptyIcon={Car}
      emptyText={language === 'ru' ? 'Транспорт не найден' : 'No vehicles found'}
      
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
      <ActiveFilters
        config={transportFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => (
          <ItemCard
            key={vehicle.id}
            title={language === 'ru' ? vehicle.name_ru : vehicle.name_en}
            image={vehicle.cover_image || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600'}
            price={vehicle.price_per_day || 0}
            priceLabel={`/${language === 'ru' ? 'день' : 'day'}`}
            rating={vehicle.rating}
            reviewCount={vehicle.review_count}
            meta={[
              { icon: Users, value: vehicle.capacity || 0 },
              { icon: Settings2, value: 'Auto' },
              { icon: Fuel, value: 'Petrol' },
            ]}
            tags={vehicle.features?.slice(0, 2) || []}
            isVerified={vehicle.is_verified}
            isAvailable={vehicle.is_available}
            onClick={() => navigate(`/transport/vehicle/${vehicle.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
