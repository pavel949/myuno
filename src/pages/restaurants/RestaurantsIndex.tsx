import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, Clock, Star, MapPin, Bike, ArrowRight, Flame, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { triggerRipple } from '@/hooks/useRipple';
import { 
  deliveryFilterConfig, 
  reservationFilterConfig,
  type FilterValues 
} from '@/components/filters';
import { CrossSellSection } from '@/components/crosssell';
import { matchesFilter, matchesPriceLevel, isOpenNow } from '@/lib/filterUtils';
import { VerticalCTA } from '@/components/leads/VerticalCTA';

type Mode = 'delivery' | 'reservation';

const CUISINE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская' },
  { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская' },
];

const LOCATION_CATEGORIES: MiniAppCategory[] = [
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
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const { restaurants, isLoading } = useRestaurants({
    cuisine: selectedCuisine === 'all' ? undefined : selectedCuisine,
    district: selectedLocation === 'all' ? undefined : selectedLocation,
    searchQuery: searchQuery || undefined,
    deliveryOnly: mode === 'delivery' ? true : undefined,
  });

  const filterConfig = mode === 'delivery' ? deliveryFilterConfig : reservationFilterConfig;

  // Sync cuisine filter from modal to category chips
  const effectiveCuisine = useMemo(() => {
    const modalCuisine = filterValues.cuisine as string[];
    if (modalCuisine?.length === 1) return modalCuisine[0];
    if (modalCuisine?.length > 1) return 'all'; // Multiple selected, show all from API
    return selectedCuisine;
  }, [filterValues.cuisine, selectedCuisine]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(rest => {
      // Price level filter - using normalized matching
      const priceFilter = filterValues.priceLevel as string | undefined;
      if (priceFilter && !matchesPriceLevel(rest.price_range ? rest.price_range * 500 : undefined, priceFilter)) return false;
      
      // Cuisine filter from modal (when multiple selected) - using normalized matching
      const cuisineFilter = filterValues.cuisine as string[];
      if (cuisineFilter?.length > 0) {
        if (!matchesFilter(rest.cuisine ? [rest.cuisine] : [], cuisineFilter)) return false;
      }
      
      // Features filter - using normalized matching
      const featureFilter = filterValues.features as string[];
      if (featureFilter?.length > 0) {
        if (!matchesFilter(rest.features || [], featureFilter)) return false;
      }
      
      // Occasion filter - using normalized matching
      const occasionFilter = filterValues.occasion as string[];
      if (occasionFilter?.length > 0) {
        if (!matchesFilter(rest.features || [], occasionFilter)) return false;
      }
      
      // Dietary filter - using normalized matching
      const dietaryFilter = filterValues.dietary as string[];
      if (dietaryFilter?.length > 0) {
        if (!matchesFilter(rest.features || [], dietaryFilter)) return false;
      }
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((rest.rating || 0) < minRating) return false;
      }
      
      // Open now filter
      if (filterValues.openNow && !isOpenNow(rest.working_hours as Record<string, string> | null)) return false;
      
      // Delivery-specific filters
      const deliveryFilter = filterValues.delivery as string[];
      if (deliveryFilter?.length > 0) {
        if (deliveryFilter.includes('free_delivery') && (rest.delivery_fee || 0) > 0) return false;
        if (deliveryFilter.includes('fast_delivery')) {
          const deliveryTime = rest.delivery_time?.split('-')[0];
          if (deliveryTime && parseInt(deliveryTime) > 30) return false;
        }
        if (deliveryFilter.includes('no_min_order') && (rest.min_order_amount || 0) > 0) return false;
      }
      
      return true;
    });
  }, [restaurants, filterValues]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  const quickItemsDelivery: QuickGridItem[] = [
    { icon: '🔥', label: language === 'ru' ? 'Популярное' : 'Popular' },
    { icon: '⚡', label: language === 'ru' ? 'Быстро' : 'Fast' },
    { icon: '🆓', label: language === 'ru' ? 'Бесплатно' : 'Free Del.' },
    { icon: '🌱', label: language === 'ru' ? 'Веган' : 'Vegan' },
  ];

  const quickItemsReservation: QuickGridItem[] = [
    { icon: '🥂', label: language === 'ru' ? 'Романтика' : 'Romantic' },
    { icon: '🎂', label: language === 'ru' ? 'Праздник' : 'Birthday' },
    { icon: '💼', label: language === 'ru' ? 'Бизнес' : 'Business' },
  ];

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Рестораны' : 'Restaurants'}
      subtitle={language === 'ru' ? `${filteredRestaurants.length} мест` : `${filteredRestaurants.length} places`}
      heroIcon={UtensilsCrossed}
      heroTitle={mode === 'delivery' 
        ? (language === 'ru' ? 'Заказать доставку' : 'Order Delivery')
        : (language === 'ru' ? 'Забронировать столик' : 'Reserve a Table')}
      heroSubtitle={mode === 'delivery'
        ? (language === 'ru' ? 'Лучшие рестораны и быстрая доставка' : 'Best restaurants with fast delivery')
        : (language === 'ru' ? 'Выберите ресторан и забронируйте место' : 'Choose a restaurant and book your table')}
      heroImage="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
      heroGradient={{ from: 'from-orange-500/20', via: 'via-red-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск ресторанов...' : 'Search restaurants...'}
      categories={CUISINE_CATEGORIES}
      selectedCategory={selectedCuisine}
      onCategoryChange={setSelectedCuisine}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      showMapButton
      onMapClick={() => navigate(`/restaurants/map?mode=${mode}`)}
      isLoading={isLoading}
      isEmpty={filteredRestaurants.length === 0}
      emptyIcon={UtensilsCrossed}
      emptyText={mode === 'reservation' 
        ? (language === 'ru' ? 'Нет ресторанов с возможностью бронирования' : 'No restaurants with table booking')
        : (language === 'ru' ? 'Нет ресторанов с доставкой' : 'No restaurants with delivery')}
    >
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

      {/* Location filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
        {LOCATION_CATEGORIES.map((loc) => (
          <Button
            key={loc.id}
            variant={selectedLocation === loc.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLocation(loc.id)}
            className="shrink-0"
          >
            📍 {language === 'ru' ? loc.labelRu : loc.labelEn}
          </Button>
        ))}
      </div>

      <MiniAppQuickGrid 
        items={mode === 'delivery' ? quickItemsDelivery : quickItemsReservation} 
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
      
      <div className="grid gap-4">
        {filteredRestaurants.map((restaurant) => (
          <div key={restaurant.id} className="relative">
            <ItemCard
              image={restaurant.cover_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
              title={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
              subtitle={`${restaurant.cuisine} • ${'฿'.repeat(restaurant.price_range || 2)}`}
              rating={restaurant.rating ?? undefined}
              location={restaurant.district ?? undefined}
              isFeatured={restaurant.is_featured ?? undefined}
              meta={[
                ...(restaurant.delivery_time ? [{ icon: Clock, label: `${restaurant.delivery_time} min` }] : []),
              ]}
              onClick={() => navigate(`/restaurants/${restaurant.id}?mode=${mode}`)}
            />
            <div className="flex gap-2 px-3 pb-3 -mt-2">
              {restaurant.delivery_available && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerRipple(e as any);
                    navigate(`/restaurants/${restaurant.id}?mode=delivery`);
                  }}
                  className="flex-1 gap-1.5"
                >
                  <Bike className="w-4 h-4" />
                  {language === 'ru' ? 'Заказать' : 'Order'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerRipple(e as any);
                  navigate(`/restaurants/${restaurant.id}?mode=reservation`);
                }}
                className="flex-1 gap-1.5"
              >
                <CalendarDays className="w-4 h-4" />
                {language === 'ru' ? 'Столик' : 'Book'}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <VerticalCTA vertical="restaurants" className="my-6" />

      <CrossSellSection currentVertical="restaurants" />
    </MiniAppLayout>
  );
}