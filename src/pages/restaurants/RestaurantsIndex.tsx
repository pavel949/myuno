/**
 * RestaurantsIndex — Airbnb-style restaurant catalog
 * Clean header, cuisine pills, area filters, grid cards
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, SlidersHorizontal, Star, MapPin, Phone, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { useRestaurants } from '@/hooks/useRestaurants';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CrossSellSection } from '@/components/crosssell';
import { cn } from '@/lib/utils';

const CUISINES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская' },
  { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская' },
  { id: 'steak', labelEn: 'Steak', labelRu: 'Стейк' },
  { id: 'international', labelEn: 'International', labelRu: 'Международная' },
];

const AREAS = [
  { id: 'Patong', label: 'Patong' },
  { id: 'Kata', label: 'Kata' },
  { id: 'Kamala', label: 'Kamala' },
  { id: 'Cherngtalay', label: 'Bang Tao' },
  { id: 'Phuket Town', label: 'Phuket Town' },
];

const PRICE_BAND_LABEL: Record<string, string> = {
  budget: '฿',
  mid: '฿฿',
  mid_high: '฿฿฿',
  premium: '฿฿฿฿',
};

export default function RestaurantsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { restaurants, isLoading } = useRestaurants({
    cuisine: selectedCuisine === 'all' ? undefined : selectedCuisine,
    district: selectedArea || undefined,
    searchQuery: searchQuery || undefined,
  });

  const filtered = useMemo(() => {
    return restaurants.filter(rest => {
      if (selectedCuisine !== 'all') {
        const tags = (rest as any).cuisine_tags as string[] | null;
        const cuisineField = rest.cuisine?.toLowerCase() || '';
        const matches = tags?.some(t => t.toLowerCase().includes(selectedCuisine.toLowerCase()))
          || cuisineField.includes(selectedCuisine.toLowerCase());
        if (!matches) return false;
      }
      return true;
    });
  }, [restaurants, selectedCuisine]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b space-y-3 pb-3">
          <div className="container max-w-7xl mx-auto px-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BackButton fallbackPath="/" variant="ghost" size="sm" />
                <h1 className="text-lg font-bold truncate">
                  {isRu ? 'Рестораны' : 'Restaurants'}
                </h1>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/restaurants/map')}>
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">{isRu ? 'Карта' : 'Map'}</span>
              </Button>
            </div>
          </div>

          {/* Cuisine pills */}
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CUISINES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCuisine(c.id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                    selectedCuisine === c.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:border-foreground/50"
                  )}
                >
                  {isRu ? c.labelRu : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Area filters */}
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {AREAS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedArea(selectedArea === a.id ? null : a.id)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap",
                    selectedArea === a.id
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  )}
                >
                  <MapPin className="w-3 h-3" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Results count */}
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {isRu ? 'ресторанов' : 'restaurants'}
          </p>
        </div>

        {/* Grid */}
        <main className="container max-w-7xl mx-auto px-4 pb-24">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title={isRu ? 'Ничего не найдено' : 'No restaurants found'}
              description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {filtered.map((restaurant) => {
                const r = restaurant as any;
                const cuisineTags = r.cuisine_tags as string[] | null;
                const priceBand = r.price_band as string | null;
                const reservationUrl = r.reservation_url as string | null;
                const heroImage = r.hero_image_url || restaurant.cover_image;
                const area = r.area as string | null;

                return (
                  <div
                    key={restaurant.id}
                    className="cursor-pointer group"
                    onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                  >
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                      <OptimizedImage
                        src={heroImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'}
                        alt={isRu ? restaurant.name_ru : restaurant.name_en}
                        width={400}
                        height={300}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        quality={80}
                      />
                      {priceBand && (
                        <span className="absolute top-2 left-2 bg-background/90 text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {PRICE_BAND_LABEL[priceBand] || '฿฿'}
                        </span>
                      )}
                      {reservationUrl && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px]">
                          <CalendarDays className="w-3 h-3 mr-0.5" />
                          {isRu ? 'Бронь' : 'Reserve'}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {restaurant.rating && restaurant.rating > 0 && (
                          <>
                            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                            <span className="font-medium text-foreground">{restaurant.rating.toFixed(1)}</span>
                          </>
                        )}
                        {cuisineTags && cuisineTags.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="truncate">{cuisineTags.slice(0, 2).join(', ')}</span>
                          </>
                        )}
                      </div>

                      <h3 className="font-medium text-sm leading-tight line-clamp-2">
                        {isRu ? restaurant.name_ru : restaurant.name_en}
                      </h3>

                      {area && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{area}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <CrossSellSection currentVertical="restaurants" className="mt-8" />
        </main>
      </div>
    </AppLayout>
  );
}
