/**
 * RestaurantsIndex - Restaurant catalog with reservation-first UX
 * 
 * Uses real restaurant data: cuisine_tags, price_band, area, reservation_provider.
 * Filters by area, cuisine, price band.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Clock, Star, MapPin, Phone, ExternalLink, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { MiniAppLayout, ItemCard, type MiniAppCategory, type QuickFilterSection } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { triggerRipple } from '@/hooks/useRipple';
import { 
  reservationFilterConfig,
  type FilterValues 
} from '@/components/filters';
import { CrossSellSection } from '@/components/crosssell';
import { VerticalCTA } from '@/components/leads/VerticalCTA';

const CUISINE_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🍽️' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🍜' },
  { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты', icon: '🦐' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍝' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
  { id: 'steak', labelEn: 'Steak', labelRu: 'Стейк', icon: '🥩' },
  { id: 'international', labelEn: 'International', labelRu: 'Международная', icon: '🌍' },
];

const AREA_QUICK_FILTERS: QuickFilterSection[] = [
  {
    id: 'location',
    options: [
      { id: 'Patong', labelEn: 'Patong', labelRu: 'Патонг', icon: '📍' },
      { id: 'Kata', labelEn: 'Kata', labelRu: 'Ката', icon: '📍' },
      { id: 'Karon', labelEn: 'Karon', labelRu: 'Карон', icon: '📍' },
      { id: 'Kamala', labelEn: 'Kamala', labelRu: 'Камала', icon: '📍' },
      { id: 'Phuket Town', labelEn: 'Phuket Town', labelRu: 'Пхукет Таун', icon: '📍' },
      { id: 'Mai Khao', labelEn: 'Mai Khao', labelRu: 'Май Кхао', icon: '📍' },
      { id: 'Cherngtalay', labelEn: 'Bang Tao', labelRu: 'Банг Тао', icon: '📍' },
      { id: 'Cape Panwa', labelEn: 'Cape Panwa', labelRu: 'Кейп Панва', icon: '📍' },
      { id: 'Layan', labelEn: 'Layan', labelRu: 'Лаян', icon: '📍' },
    ],
  },
];

const PRICE_BAND_LABEL: Record<string, string> = {
  budget: '฿',
  mid: '฿฿',
  mid_high: '฿฿฿',
  premium: '฿฿฿฿',
};

function getReservationCTA(provider?: string | null, language: string = 'en') {
  switch (provider) {
    case 'chope':
    case 'tablecheck':
    case 'sevenrooms':
      return language === 'ru' ? 'Забронировать' : 'Reserve a Table';
    case 'website':
      return language === 'ru' ? 'На сайте' : 'Book on Website';
    case 'phone':
      return language === 'ru' ? 'Позвонить' : 'Call to Reserve';
    default:
      return language === 'ru' ? 'Забронировать' : 'Reserve';
  }
}

export default function RestaurantsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const selectedLocations = (filterValues.location as string[]) || [];
  const selectedLocation = selectedLocations.length === 1 ? selectedLocations[0] : undefined;

  const { restaurants, isLoading } = useRestaurants({
    cuisine: selectedCuisine === 'all' ? undefined : selectedCuisine,
    district: selectedLocation,
    searchQuery: searchQuery || undefined,
  });

  // Client-side filtering for cuisine_tags (since DB uses old `cuisine` field)
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(rest => {
      // Cuisine tag matching
      if (selectedCuisine !== 'all') {
        const tags = (rest as any).cuisine_tags as string[] | null;
        const cuisineField = rest.cuisine?.toLowerCase() || '';
        const matchesCuisine = tags?.some(t => t.toLowerCase().includes(selectedCuisine.toLowerCase()))
          || cuisineField.includes(selectedCuisine.toLowerCase());
        if (!matchesCuisine) return false;
      }
      
      // Multi-location filter
      if (selectedLocations.length > 1) {
        const area = (rest as any).area as string | null;
        if (!area || !selectedLocations.includes(area)) return false;
      }
      
      return true;
    });
  }, [restaurants, selectedCuisine, selectedLocations]);

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Рестораны Пхукета' : 'Phuket Restaurants'}
      subtitle={language === 'ru' ? `${filteredRestaurants.length} мест` : `${filteredRestaurants.length} places`}
      heroIcon={UtensilsCrossed}
      heroTitle={language === 'ru' ? 'Забронировать столик' : 'Reserve a Table'}
      heroSubtitle={language === 'ru' ? '20 лучших ресторанов с бронированием' : '20 top restaurants with verified reservations'}
      heroImage="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
      heroGradient={{ from: 'from-orange-500/20', via: 'via-red-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск ресторанов...' : 'Search restaurants...'}
      categories={CUISINE_CATEGORIES}
      selectedCategory={selectedCuisine}
      onCategoryChange={setSelectedCuisine}
      quickFilters={AREA_QUICK_FILTERS}
      filterConfig={reservationFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      showMapButton
      onMapClick={() => navigate('/restaurants/map')}
      isLoading={isLoading}
      isEmpty={filteredRestaurants.length === 0}
      emptyIcon={UtensilsCrossed}
      emptyText={language === 'ru' ? 'Ресторанов не найдено' : 'No restaurants found'}
    >
      <div className="grid gap-4">
        {filteredRestaurants.map((restaurant) => {
          const r = restaurant as any;
          const cuisineTags = r.cuisine_tags as string[] | null;
          const priceBand = r.price_band as string | null;
          const reservationProvider = r.reservation_provider as string | null;
          const reservationUrl = r.reservation_url as string | null;
          const heroImage = r.hero_image_url || restaurant.cover_image;
          const area = r.area as string | null;

          const subtitle = [
            cuisineTags?.join(' · ') || restaurant.cuisine,
            priceBand ? PRICE_BAND_LABEL[priceBand] : '฿'.repeat(restaurant.price_range || 2),
          ].filter(Boolean).join(' • ');

          return (
            <div key={restaurant.id} className="relative">
              <ItemCard
                image={heroImage || undefined}
                title={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
                subtitle={subtitle}
                rating={restaurant.rating ?? undefined}
                location={area || restaurant.district || undefined}
                isVerified={!r.needs_manual_verification}
                tags={cuisineTags?.slice(0, 3) || []}
                onClick={() => navigate(`/restaurants/${restaurant.id}`)}
              />
              {/* Reservation CTA */}
              {reservationUrl && (
                <div className="flex gap-2 px-3 pb-3 -mt-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerRipple(e as any);
                      window.open(reservationUrl, '_blank', 'noopener');
                    }}
                    className="flex-1 gap-1.5"
                  >
                    <CalendarDays className="w-4 h-4" />
                    {getReservationCTA(reservationProvider, language)}
                  </Button>
                  {restaurant.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${restaurant.phone}`;
                      }}
                      className="gap-1.5"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <VerticalCTA vertical="restaurants" className="my-6" />
      <CrossSellSection currentVertical="restaurants" />
    </MiniAppLayout>
  );
}
