import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, Clock, Star, MapPin, Bike, ArrowRight, Flame, CalendarDays, Map } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { SkeletonCard } from '@/components/uno/SkeletonCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { triggerRipple } from '@/hooks/useRipple';
import { useRestaurants } from '@/hooks/useRestaurants';
import { MiniAppHero, MiniAppSearch, MiniAppQuickActions } from '@/components/miniapp';
import { 
  UniversalFilter, 
  ActiveFilters,
  deliveryFilterConfig, 
  reservationFilterConfig,
  type FilterValues 
} from '@/components/filters';

type Mode = 'delivery' | 'reservation';

const CUISINE_CATEGORIES = [
  { id: 'all', icon: '🍽️', labelEn: 'All', labelRu: 'Все' },
  { id: 'thai', icon: '🍜', labelEn: 'Thai', labelRu: 'Тайская' },
  { id: 'seafood', icon: '🦐', labelEn: 'Seafood', labelRu: 'Морепродукты' },
  { id: 'japanese', icon: '🍣', labelEn: 'Japanese', labelRu: 'Японская' },
  { id: 'italian', icon: '🍕', labelEn: 'Italian', labelRu: 'Итальянская' },
  { id: 'indian', icon: '🍛', labelEn: 'Indian', labelRu: 'Индийская' },
];

const LOCATION_CATEGORIES = [
  { id: 'all', labelEn: 'All areas', labelRu: 'Все районы' },
  { id: 'Patong', labelEn: 'Patong', labelRu: 'Патонг' },
  { id: 'Kata', labelEn: 'Kata', labelRu: 'Ката' },
  { id: 'Kamala', labelEn: 'Kamala', labelRu: 'Камала' },
  { id: 'Phuket Town', labelEn: 'Phuket Town', labelRu: 'Пхукет Таун' },
];

export default function RestaurantsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialMode = (searchParams.get('mode') as Mode) || 'delivery';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  // Advanced filters
  const [filterValues, setFilterValues] = useState<FilterValues>({
    priceLevel: null,
    cuisine: [],
    features: [],
    occasion: [],
    dietary: [],
    delivery: [],
  });

  // Load restaurants from database
  const { restaurants, isLoading } = useRestaurants({
    cuisine: selectedCuisine === 'all' ? undefined : selectedCuisine,
    district: selectedLocation === 'all' ? undefined : selectedLocation,
    searchQuery: searchQuery || undefined,
    deliveryOnly: mode === 'delivery' ? true : undefined,
  });

  // Get current filter config based on mode
  const filterConfig = mode === 'delivery' ? deliveryFilterConfig : reservationFilterConfig;

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(filterValues).forEach(value => {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value) {
        count += 1;
      }
    });
    return count;
  }, [filterValues]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  // Additional client-side filtering for advanced filters
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(rest => {
      // Price level filter
      const priceFilter = filterValues.priceLevel;
      if (priceFilter && rest.price_range !== parseInt(priceFilter as string)) {
        return false;
      }
      
      // Features filter
      const featureFilter = filterValues.features as string[];
      if (featureFilter.length > 0 && rest.features) {
        if (!featureFilter.every(f => rest.features?.includes(f))) {
          return false;
        }
      }
      
      // Delivery specific filters
      const deliveryFilter = filterValues.delivery as string[];
      if (deliveryFilter.length > 0) {
        if (deliveryFilter.includes('free_delivery') && (rest.delivery_fee || 0) > 0) return false;
        if (deliveryFilter.includes('fast_delivery')) {
          const deliveryTime = rest.delivery_time?.split('-')[0];
          if (deliveryTime && parseInt(deliveryTime) > 30) return false;
        }
        if (deliveryFilter.includes('no_min_order') && (rest.min_order_amount || 0) > 0) return false;
      }
      
      // For reservation mode, filter to only restaurants without delivery (fine dining)
      if (mode === 'reservation' && rest.delivery_available) {
        // Keep restaurants that have reservation capability (have features like fine_dining, romantic, etc.)
        const hasReservationFeatures = rest.features?.some(f => 
          ['fine_dining', 'romantic', 'reservations_required', 'private_rooms'].includes(f)
        );
        if (!hasReservationFeatures) return true; // Still show them for now
      }
      
      return true;
    });
  }, [restaurants, filterValues, mode]);

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/restaurants/${restaurantId}?mode=${mode}`);
  };

  // Handle removing individual filter
  const handleRemoveFilter = (sectionId: string, optionId?: string) => {
    setFilterValues(prev => {
      const sectionValue = prev[sectionId];
      if (Array.isArray(sectionValue) && optionId) {
        return { ...prev, [sectionId]: sectionValue.filter(v => v !== optionId) };
      }
      return { ...prev, [sectionId]: null };
    });
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilterValues({
      priceLevel: null,
      cuisine: [],
      features: [],
      occasion: [],
      dietary: [],
      delivery: [],
    });
    setSelectedCuisine('all');
    setSelectedLocation('all');
  };

  const deliveryQuickActions = [
    { icon: '🔥', label: language === 'ru' ? 'Популярное' : 'Popular' },
    { icon: '⚡', label: language === 'ru' ? 'Быстро' : 'Fast' },
    { icon: '🆓', label: language === 'ru' ? 'Бесплатно' : 'Free Del.' },
    { icon: '🌱', label: language === 'ru' ? 'Веган' : 'Vegan' },
  ];

  const reservationQuickActions = [
    { icon: '🥂', label: language === 'ru' ? 'Романтика' : 'Romantic' },
    { icon: '🎂', label: language === 'ru' ? 'Праздник' : 'Birthday' },
    { icon: '💼', label: language === 'ru' ? 'Бизнес' : 'Business' },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={language === 'ru' ? 'Рестораны' : 'Restaurants'}
          showBack
          fallbackPath="/"
          subtitle={language === 'ru' ? `${filteredRestaurants.length} мест` : `${filteredRestaurants.length} places`}
          actions={
            <div className="flex items-center gap-1">
              <UniversalFilter
                config={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/restaurants/map?mode=${mode}`)}
              >
                <Map className="w-5 h-5" />
              </Button>
            </div>
          }
        />

        {/* Hero Section */}
        <MiniAppHero
          icon={UtensilsCrossed}
          title={mode === 'delivery' 
            ? (language === 'ru' ? 'Заказать доставку' : 'Order Delivery')
            : (language === 'ru' ? 'Забронировать столик' : 'Reserve a Table')}
          subtitle={mode === 'delivery'
            ? (language === 'ru' ? 'Лучшие рестораны и быстрая доставка' : 'Best restaurants with fast delivery')
            : (language === 'ru' ? 'Выберите ресторан и забронируйте место' : 'Choose a restaurant and book your table')}
          backgroundImage="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
          gradientFrom="from-orange-500/20"
          gradientVia="via-red-500/20"
          gradientTo="to-primary/20"
          className="mt-4 mb-4"
        />

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => handleModeChange(v as Mode)} className="w-full mb-4">
          <TabsList className="w-full grid grid-cols-2 h-12">
            <TabsTrigger value="delivery" className="h-10 text-sm gap-2">
              <Bike className="w-4 h-4" />
              {language === 'ru' ? 'Доставка' : 'Delivery'}
            </TabsTrigger>
            <TabsTrigger value="reservation" className="h-10 text-sm gap-2">
              <CalendarDays className="w-4 h-4" />
              {language === 'ru' ? 'Столик' : 'Reservation'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <MiniAppSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={language === 'ru' ? 'Поиск ресторанов...' : 'Search restaurants...'}
          className="mb-4"
        />

        {/* Cuisine filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-2">
          {CUISINE_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat.id}
              label={`${cat.icon} ${language === 'ru' ? cat.labelRu : cat.labelEn}`}
              isActive={selectedCuisine === cat.id}
              onToggle={() => setSelectedCuisine(cat.id)}
            />
          ))}
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <ActiveFilters
            config={filterConfig}
            values={filterValues}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            className="mb-4"
          />
        )}

        {/* Location filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
          {LOCATION_CATEGORIES.map((loc) => (
            <FilterChip
              key={loc.id}
              label={`📍 ${language === 'ru' ? loc.labelRu : loc.labelEn}`}
              isActive={selectedLocation === loc.id}
              onToggle={() => setSelectedLocation(loc.id)}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <MiniAppQuickActions
          actions={mode === 'delivery' ? deliveryQuickActions : reservationQuickActions}
          columns={mode === 'delivery' ? 4 : 3}
          className="mb-6"
        />

        {/* Featured Banner - only for delivery */}
        {mode === 'delivery' && filteredRestaurants.some(r => r.is_featured) && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-4 mb-6">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-white" />
              <div className="flex-1">
                <p className="text-white font-bold">
                  {language === 'ru' ? 'Горячие предложения!' : 'Hot Deals!'}
                </p>
                <p className="text-white/80 text-sm">
                  {language === 'ru' ? 'Скидка 20% на первый заказ' : '20% off your first order'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRestaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">
              {language === 'ru' ? 'Ничего не найдено' : 'No restaurants found'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {mode === 'reservation' 
                ? (language === 'ru' 
                    ? 'Нет ресторанов с возможностью бронирования по вашему запросу' 
                    : 'No restaurants with table booking match your search')
                : (language === 'ru' 
                    ? 'Нет ресторанов с доставкой по вашему запросу' 
                    : 'No restaurants with delivery match your search')}
            </p>
          </div>
        )}

        {/* Restaurants List */}
        {!isLoading && filteredRestaurants.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {mode === 'reservation' 
                  ? (language === 'ru' ? 'Доступно для брони' : 'Available for Booking')
                  : (language === 'ru' ? 'Рестораны' : 'Restaurants')}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredRestaurants.length} {language === 'ru' ? 'ресторанов' : 'restaurants'}
              </span>
            </div>
            
            <div className="space-y-4">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div 
                    onClick={(e) => {
                      triggerRipple(e);
                      handleRestaurantClick(restaurant.id);
                    }}
                    className="flex gap-4 p-3 cursor-pointer active:scale-[0.98]"
                  >
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={restaurant.cover_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                        alt={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {restaurant.is_featured && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gold/90 text-black text-[10px] font-medium">
                          ⭐
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {language === 'ru' ? restaurant.name_ru : restaurant.name_en}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground">
                        {restaurant.cuisine} • {'฿'.repeat(restaurant.price_range || 2)}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{restaurant.rating || 0}</span>
                        </div>
                        
                        {restaurant.delivery_available && restaurant.delivery_time && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{restaurant.delivery_time} min</span>
                          </div>
                        )}
                        
                        {restaurant.district && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-[80px]">{restaurant.district}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 px-3 pb-3">
                    {restaurant.delivery_available && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerRipple(e);
                          navigate(`/restaurants/${restaurant.id}?mode=delivery`);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
                      >
                        <Bike className="w-4 h-4" />
                        {language === 'ru' ? 'Заказать' : 'Order'}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerRipple(e);
                        navigate(`/restaurants/${restaurant.id}/reserve`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 active:scale-[0.98] transition-all"
                    >
                      <CalendarDays className="w-4 h-4" />
                      {language === 'ru' ? 'Столик' : 'Book'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
