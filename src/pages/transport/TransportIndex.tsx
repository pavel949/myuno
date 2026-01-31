import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, Clock, Gauge } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { transportFilterConfig, FilterValues } from '@/components/filters';
import { useVehicles } from '@/hooks/useVehicles';
import { matchesFilter, matchesPriceLevel } from '@/lib/filterUtils';

const VEHICLE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'car', labelEn: 'Cars', labelRu: 'Авто' },
  { id: 'motorbike', labelEn: 'Bikes', labelRu: 'Мото' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник' },
];

export default function TransportIndex() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const { vehicles, isLoading } = useVehicles();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (selectedCategory !== 'all' && v.vehicle_type !== selectedCategory) return false;
      
      if (searchQuery) {
        const name = language === 'ru' ? v.name_ru : v.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      // Passengers filter
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
      
      // Price level filter
      const priceLevel = filterValues.priceLevel as string | undefined;
      if (priceLevel && !matchesPriceLevel(v.price_per_day, priceLevel)) return false;
      
      // Vehicle type filter from modal
      const vehicleTypeFilter = filterValues.vehicleType as string[] | undefined;
      if (vehicleTypeFilter?.length) {
        if (!matchesFilter([v.vehicle_type || ''], vehicleTypeFilter)) return false;
      }
      
      // Features filter
      const featuresFilter = filterValues.features as string[] | undefined;
      if (featuresFilter?.length) {
        if (!matchesFilter(v.features || [], featuresFilter)) return false;
      }
      
      // Transmission filter
      const transmissionFilter = filterValues.transmission as string | undefined;
      if (transmissionFilter) {
        if (v.transmission?.toLowerCase() !== transmissionFilter.toLowerCase()) return false;
      }
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((v.rating || 0) < minRating) return false;
      }
      
      // Verified filter
      if (filterValues.verified && !v.is_verified) return false;
      
      return true;
    });
  }, [vehicles, selectedCategory, searchQuery, filterValues, language]);

  const quickItems: QuickGridItem[] = [
    { icon: '🚗', label: language === 'ru' ? 'Аренда' : 'Rental', onClick: () => setSelectedCategory('all') },
    { icon: '🚕', label: language === 'ru' ? 'Такси' : 'Taxi', path: '/transport/taxi' },
    { icon: '✈️', label: language === 'ru' ? 'Аэропорт' : 'Airport', path: '/transport/airport-transfer' },
    { icon: '🚤', label: language === 'ru' ? 'Катера' : 'Boats', path: '/yachts' },
  ];

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Транспорт' : 'Transport'}
      subtitle={language === 'ru' ? `${filteredVehicles.length} вариантов` : `${filteredVehicles.length} options`}
      heroIcon={Car}
      heroTitle={language === 'ru' ? 'Авто, мото и трансферы' : 'Cars, bikes & transfers'}
      heroSubtitle={language === 'ru' ? 'Аренда и доставка по всему Пхукету' : 'Rentals & transfers across Phuket'}
      heroImage="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800"
      heroGradient={{ from: 'from-indigo-500/20', via: 'via-blue-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск транспорта...' : 'Search vehicles...'}
      categories={VEHICLE_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={transportFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      isLoading={isLoading}
      isEmpty={filteredVehicles.length === 0}
      emptyIcon={Car}
      emptyText={language === 'ru' ? 'Транспорт не найден' : 'No vehicles found'}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />
      
      <div className="grid gap-4">
        {filteredVehicles.map((vehicle) => (
          <ItemCard
            key={vehicle.id}
            image={vehicle.cover_image || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600'}
            title={language === 'ru' ? vehicle.name_ru : vehicle.name_en}
            rating={vehicle.rating ?? undefined}
            price={vehicle.price_per_day ?? undefined}
            currency={currencyInfo.symbol}
            priceLabel={`/${language === 'ru' ? 'день' : 'day'}`}
            meta={[
              { icon: Users, label: `${vehicle.capacity || 0}` },
              { icon: Gauge, label: 'Auto' },
            ]}
            tags={vehicle.features?.slice(0, 2) || []}
            isVerified={vehicle.is_verified}
            onClick={() => navigate(`/transport/vehicle/${vehicle.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
