import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard, type QuickGridItem } from '@/components/miniapp';
import { TransportFiltersKlook, type DatePreset, type SortOption } from '@/components/transport/TransportFiltersKlook';
import { useVehicles } from '@/hooks/useVehicles';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { CrossSellSection } from '@/components/crosssell';
import { normalizeVehicleType } from '@/lib/taxonomies';
import { mapVehicleToCardProps } from '@/lib/adapters/vehicleAdapters';

export default function TransportIndex() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const { vehicles, isLoading } = useVehicles();
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('any');
  const [selectedInlineFilters, setSelectedInlineFilters] = useState<string[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string[]>([]);
  const [selectedTransmission, setSelectedTransmission] = useState<string[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);

  const filteredVehicles = useMemo(() => {
    let results = vehicles.filter(v => {
      // Category filter
      const normalizedType = normalizeVehicleType(v.vehicle_type);
      if (selectedCategory !== 'all' && normalizedType !== selectedCategory) return false;
      
      // Search filter
      if (searchQuery) {
        const name = language === 'ru' ? v.name_ru : v.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      // Price filter
      const price = v.price_per_day || 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      
      // Vehicle type filter from drawer
      if (selectedVehicleType.length > 0) {
        if (!selectedVehicleType.includes(normalizedType)) return false;
      }
      
      // Transmission filter
      if (selectedTransmission.length > 0) {
        const trans = v.transmission?.toLowerCase() || '';
        if (!selectedTransmission.some(t => trans.includes(t))) return false;
      }
      
      // Fuel type filter
      if (selectedFuelType.length > 0) {
        const fuel = v.fuel_type?.toLowerCase() || '';
        if (!selectedFuelType.includes(fuel)) return false;
      }
      
      // Features filter
      if (selectedFeatures.length > 0) {
        const vehicleFeatures = v.features || [];
        const hasAllFeatures = selectedFeatures.every(f => 
          vehicleFeatures.some(vf => vf.toLowerCase() === f.toLowerCase())
        );
        if (!hasAllFeatures) return false;
      }
      
      // Inline quick filters (Automatic, Insurance, Delivery)
      if (selectedInlineFilters.includes('automatic')) {
        if (v.transmission?.toLowerCase() !== 'automatic') return false;
      }
      if (selectedInlineFilters.includes('insurance')) {
        // Check if vehicle has insurance in features
        if (!v.features?.some(f => f.toLowerCase().includes('insurance'))) return false;
      }
      if (selectedInlineFilters.includes('delivery')) {
        if (!v.features?.some(f => f.toLowerCase().includes('delivery'))) return false;
      }
      
      // Quick filters (drawer)
      if (selectedQuickFilters.includes('verified') && !v.is_verified) return false;
      
      return true;
    });
    
    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.price_per_day || 0) - (b.price_per_day || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          // No created_at in Vehicle type, fallback to rating
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
    
    return results;
  }, [vehicles, selectedCategory, searchQuery, sortBy, priceRange, selectedVehicleType, selectedTransmission, selectedFuelType, selectedFeatures, selectedInlineFilters, selectedQuickFilters, language]);

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
      isLoading={isLoading}
      isEmpty={filteredVehicles.length === 0}
      emptyIcon={Car}
      emptyText={language === 'ru' ? 'Транспорт не найден' : 'No vehicles found'}
    >
      {/* Klook-style Unified Filters */}
      <TransportFiltersKlook
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        selectedInlineFilters={selectedInlineFilters}
        onInlineFiltersChange={setSelectedInlineFilters}
        selectedVehicleType={selectedVehicleType}
        onVehicleTypeChange={setSelectedVehicleType}
        selectedTransmission={selectedTransmission}
        onTransmissionChange={setSelectedTransmission}
        selectedFuelType={selectedFuelType}
        onFuelTypeChange={setSelectedFuelType}
        selectedFeatures={selectedFeatures}
        onFeaturesChange={setSelectedFeatures}
        selectedQuickFilters={selectedQuickFilters}
        onQuickFiltersChange={setSelectedQuickFilters}
        resultsCount={filteredVehicles.length}
        language={language}
      />
      
      <MiniAppQuickGrid items={quickItems} columns={4} className="my-6" />
      
      {/* Results Grid */}
      <div className="grid gap-4">
        {filteredVehicles.map((vehicle) => {
          const cardProps = mapVehicleToCardProps(vehicle, language);
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
