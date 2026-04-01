/**
 * RestaurantsIndex — Unified catalog using MiniAppLayout + CatalogCard
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { useRestaurants } from '@/hooks/useRestaurants';
import { CrossSellSection } from '@/components/crosssell';
import { mapRestaurantToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
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

export default function RestaurantsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const { restaurants, isLoading } = useRestaurants({
    cuisine: selectedCuisine === 'all' ? undefined : selectedCuisine,
    district: selectedArea || undefined,
  });

  return (
    <MiniAppLayout
      title={isRu ? 'Рестораны' : 'Restaurants'}
      subtitle={`${restaurants.length} ${isRu ? 'ресторанов' : 'restaurants'}`}
      fallbackPath="/"
      showSearch={false}
      showHero={false}
      categories={CUISINES}
      selectedCategory={selectedCuisine}
      onCategoryChange={setSelectedCuisine}
      showFilter={false}
      headerActions={
        <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => navigate('/restaurants/map')}>
          <MapPin className="w-4 h-4" />
        </Button>
      }
      stickySubHeader={
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {AREAS.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedArea(selectedArea === a.id ? null : a.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap",
                selectedArea === a.id
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary text-foreground border-border hover:border-foreground/30"
              )}
            >
              <MapPin className="w-3 h-3" />
              {a.label}
            </button>
          ))}
        </div>
      }
    >
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
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={isRu ? 'Ничего не найдено' : 'No restaurants found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
          {restaurants.map(restaurant => (
            <CatalogCard key={restaurant.id} {...mapRestaurantToCatalogCard(restaurant, language, navigate)} />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="restaurants" className="mt-8" />
    </MiniAppLayout>
  );
}
