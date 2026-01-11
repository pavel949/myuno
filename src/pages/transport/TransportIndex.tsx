import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bike, Plane, Ship, Clock, Star, MapPin, Users, Fuel, Settings2, SlidersHorizontal } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { UniversalFilter, ActiveFilters, transportFilterConfig, FilterValues } from '@/components/filters';
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

const demoTransfers = [
  {
    id: 'airport-from',
    type: 'airport',
    nameEn: 'Airport Pickup',
    nameRu: 'Встреча в аэропорту',
    descEn: 'Meet & greet at arrivals',
    descRu: 'Встретим с табличкой в зоне прилёта',
    price: 800,
    duration: '45 min',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600',
    path: '/transport/airport-transfer?direction=from-airport',
  },
  {
    id: 'airport-to',
    type: 'airport',
    nameEn: 'To Airport',
    nameRu: 'В аэропорт',
    descEn: 'On-time departure pickup',
    descRu: 'Заберём вовремя к вашему рейсу',
    price: 800,
    duration: '45 min',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600',
    path: '/transport/airport-transfer?direction=to-airport',
  },
  {
    id: 'transfer-2',
    type: 'transfer',
    nameEn: 'Island Hopping',
    nameRu: 'По островам',
    descEn: 'Speedboat to Phi Phi Islands',
    descRu: 'Скоростной катер на острова Пхи-Пхи',
    price: 1500,
    duration: '2 hours',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
    path: '/transport/transfer/transfer-2',
  },
];

const vehicleTypes = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🚗' },
  { id: 'car', labelEn: 'Cars', labelRu: 'Авто', icon: '🚙' },
  { id: 'motorbike', labelEn: 'Bikes', labelRu: 'Мото', icon: '🏍️' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник', icon: '🚐' },
];

export default function TransportIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('all');
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

  const handleClearAllFilters = () => setFilterValues({});

  const filteredVehicles = demoVehicles.filter(v => {
    if (selectedType !== 'all' && v.type !== selectedType) return false;
    
    // Passengers filter
    if (filterValues.passengers) {
      const passMap: Record<string, number[]> = {
        '1-2': [1, 2], '3-4': [3, 4], '5-7': [5, 6, 7], '8+': [8, 9, 10, 11, 12]
      };
      const allowedSeats = passMap[filterValues.passengers as string] || [];
      if (!allowedSeats.includes(v.seats)) return false;
    }
    
    return true;
  });

  const availableVehicles = filteredVehicles.filter(v => v.isAvailable);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={language === 'ru' ? 'Транспорт' : 'Transport'}
          showBack
          fallbackPath="/"
          subtitle={language === 'ru' ? 'Аренда и трансферы' : 'Rentals & Transfers'}
        />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-primary/20 p-6 mt-4 mb-6">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800')] bg-cover bg-center opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">
                {language === 'ru' ? 'Авто, мотобайки и трансферы' : 'Cars, bikes and transfers'}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {language === 'ru'
                ? `${availableVehicles.length} машин доступно`
                : `${availableVehicles.length} vehicles available`}
            </p>
          </div>
        </div>

        {/* Quick Services */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '🚗', label: language === 'ru' ? 'Аренда' : 'Rental', path: '#vehicles' },
            { icon: '🚕', label: language === 'ru' ? 'Такси' : 'Taxi', path: '/transport/taxi' },
            { icon: '✈️', label: language === 'ru' ? 'Аэропорт' : 'Airport', path: '/transport/airport-transfer' },
            { icon: '🚤', label: language === 'ru' ? 'Катера' : 'Boats', path: '#' },
          ].map((service, i) => (
            <button
              key={i}
              onClick={(e) => {
                triggerRipple(e);
                if (service.path.startsWith('/')) {
                  navigate(service.path);
                }
              }}
              className="relative overflow-hidden flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-95"
            >
              <span className="text-2xl mb-1">{service.icon}</span>
              <span className="text-xs font-medium text-center truncate w-full">{service.label}</span>
            </button>
          ))}
        </div>

        {/* Transfers Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === 'ru' ? 'Популярные трансферы' : 'Popular Transfers'}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {demoTransfers.map((transfer) => (
              <div
                key={transfer.id}
                onClick={() => navigate(transfer.path)}
                className="flex-shrink-0 w-64 rounded-xl overflow-hidden bg-card border border-border/50 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="relative h-32">
                  <img
                    src={transfer.image}
                    alt={language === 'ru' ? transfer.nameRu : transfer.nameEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    ฿{transfer.price}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">
                    {language === 'ru' ? transfer.nameRu : transfer.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {language === 'ru' ? transfer.descRu : transfer.descEn}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{transfer.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {language === 'ru' ? 'Аренда транспорта' : 'Vehicle Rental'}
          </h2>
          <UniversalFilter
            config={transportFilterConfig}
            values={filterValues}
            onChange={setFilterValues}
            activeCount={activeFilterCount}
          >
            <Button variant="outline" size="sm" className="relative gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              {language === 'ru' ? 'Фильтры' : 'Filters'}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </UniversalFilter>
        </div>

        {/* Active Filters */}
        <ActiveFilters
          config={transportFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Vehicle Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {vehicleTypes.map((type) => (
            <FilterChip
              key={type.id}
              label={`${type.icon} ${language === 'ru' ? type.labelRu : type.labelEn}`}
              isActive={selectedType === type.id}
              onToggle={() => setSelectedType(type.id)}
            />
          ))}
        </div>

        {/* Vehicles Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {language === 'ru' ? 'Доступно для аренды' : 'Available for Rent'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {availableVehicles.length} {language === 'ru' ? 'авто' : 'vehicles'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => vehicle.isAvailable && navigate(`/transport/vehicle/${vehicle.id}`)}
                className={cn(
                  "rounded-xl overflow-hidden bg-card border border-border/50 transition-all",
                  vehicle.isAvailable 
                    ? "cursor-pointer hover:border-primary/30" 
                    : "opacity-60"
                )}
              >
                {/* Image */}
                <div className="relative aspect-[16/10]">
                  <img
                    src={vehicle.image}
                    alt={language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
                    className={cn(
                      "w-full h-full object-cover",
                      !vehicle.isAvailable && "grayscale"
                    )}
                  />
                  {/* Price */}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    ฿{vehicle.pricePerDay}/{language === 'ru' ? 'день' : 'day'}
                  </div>
                  {/* Badges */}
                  {vehicle.isFeatured && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-gold/90 text-black text-xs font-medium">
                      ⭐ Featured
                    </div>
                  )}
                  {vehicle.isNew && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-success/90 text-white text-xs font-medium">
                      NEW
                    </div>
                  )}
                  {!vehicle.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-medium px-3 py-1 rounded bg-black/50">
                        {language === 'ru' ? 'Занято' : 'Unavailable'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold truncate">
                    {language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
                  </h3>
                  
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{language === 'ru' ? vehicle.locationRu : vehicle.location}</span>
                  </div>
                  
                  {/* Specs */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{vehicle.seats}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings2 className="w-4 h-4" />
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-4 h-4" />
                      <span>{vehicle.fuel}</span>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-3 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{vehicle.rating}</span>
                    <span className="text-muted-foreground">({vehicle.reviewCount})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
