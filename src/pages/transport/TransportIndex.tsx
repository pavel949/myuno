import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard, type QuickGridItem } from '@/components/miniapp';
import { transportFilterConfig, FilterValues } from '@/components/filters';
import { useVehicles } from '@/hooks/useVehicles';
import { matchesPriceLevel } from '@/lib/filterUtils';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { CrossSellSection } from '@/components/crosssell';
import { 
  getRibbonCategories, 
  matchesCategory,
  normalizeVehicleType,
} from '@/lib/config/transportTaxonomy';
import { mapVehicleToCardProps } from '@/lib/adapters/vehicleAdapters';

export default function TransportIndex() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const { vehicles, isLoading } = useVehicles();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Get ribbon categories from taxonomy
  const ribbonCategories = useMemo(() => getRibbonCategories(language), [language]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Category filter using taxonomy normalization
      if (!matchesCategory(v.vehicle_type, selectedCategory)) return false;
      
      // Search filter
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
      
      // Vehicle type filter from modal (using taxonomy normalization)
      const vehicleTypeFilter = filterValues.vehicleType as string[] | undefined;
      if (vehicleTypeFilter?.length) {
        const normalizedType = normalizeVehicleType(v.vehicle_type);
        if (!vehicleTypeFilter.includes(normalizedType)) return false;
      }
      
      // Transmission filter (NEW)
      const transmissionFilter = filterValues.transmission as string | undefined;
      if (transmissionFilter) {
        if (v.transmission?.toLowerCase() !== transmissionFilter.toLowerCase()) return false;
      }
      
      // Fuel type filter (NEW)
      const fuelTypeFilter = filterValues.fuelType as string[] | undefined;
      if (fuelTypeFilter?.length) {
        if (!v.fuel_type || !fuelTypeFilter.includes(v.fuel_type.toLowerCase())) return false;
      }
      
      // Features filter
      const featuresFilter = filterValues.features as string[] | undefined;
      if (featuresFilter?.length) {
        const vehicleFeatures = v.features || [];
        const hasAllFeatures = featuresFilter.every(f => 
          vehicleFeatures.some(vf => vf.toLowerCase() === f.toLowerCase())
        );
        if (!hasAllFeatures) return false;
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
      categories={ribbonCategories}
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
        {filteredVehicles.map((vehicle) => {
          const cardProps = mapVehicleToCardProps(vehicle, language, currencyInfo.symbol);
          return (
            <ItemCard
              key={vehicle.id}
              image={cardProps.image}
              title={cardProps.title}
              subtitle={cardProps.subtitle}
              rating={cardProps.rating}
              price={cardProps.price}
              currency={cardProps.currency}
              priceLabel={cardProps.priceLabel}
              meta={cardProps.meta}
              tags={cardProps.tags}
              badge={cardProps.badge}
              isVerified={cardProps.isVerified}
              onClick={() => navigate(`/transport/vehicle/${vehicle.id}`)}
            />
          );
        })}
      </div>

      <VerticalCTA vertical="vehicles" className="my-6" />
      
      <CrossSellSection currentVertical="transport" maxItems={4} />
    </MiniAppLayout>
  );
}
