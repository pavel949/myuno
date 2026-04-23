/**
 * RestaurantsIndex — Canonical consumer app: MiniAppLayout + CatalogCard
 * Search, filters, sort, map, results count all wired.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, MapPin, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { useRestaurants } from '@/hooks/useRestaurants';
import { CrossSellSection } from '@/components/crosssell';
import { mapRestaurantToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { restaurantFilterConfig } from '@/lib/filterRegistry';
import { APP_ROUTES } from '@/lib/config/routes';
import type { FilterValues } from '@/components/filters/UniversalFilter';
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

const SORT_OPTIONS = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  { id: 'price_low', labelEn: 'Price: Low', labelRu: 'Цена ↑' },
  { id: 'price_high', labelEn: 'Price: High', labelRu: 'Цена ↓' },
];

export default function RestaurantsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState('recommended');

  const { restaurants, isLoading } = useRestaurants({
    cuisine: selectedCuisine === 'all' ? undefined : selectedCuisine,
    district: selectedArea || undefined,
  });

  const filterActiveCount = useMemo(() => {
    return Object.values(filterValues).filter(v =>
      Array.isArray(v) ? v.length > 0 : v != null
    ).length;
  }, [filterValues]);

  const filteredAndSorted = useMemo(() => {
    let result = [...restaurants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.name_en?.toLowerCase().includes(q)) ||
        (r.name_ru?.toLowerCase().includes(q))
      );
    }

    const cuisineFilter = filterValues.cuisine as string[] | undefined;
    if (cuisineFilter?.length) {
      result = result.filter(r => {
        const tags = (r as unknown as Record<string, unknown>).cuisine_tags as string[] | null;
        return tags?.some(t => cuisineFilter.includes(t));
      });
    }

    const dietaryFilter = filterValues.dietary as string[] | undefined;
    if (dietaryFilter?.length) {
      result = result.filter(r => {
        const tags = (r as unknown as Record<string, unknown>).dietary_options as string[] | null;
        return tags?.some(t => dietaryFilter.includes(t));
      });
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'price_low':
        result.sort((a, b) => {
          const pa = (a as unknown as Record<string, unknown>).avg_price as number ?? 999999;
          const pb = (b as unknown as Record<string, unknown>).avg_price as number ?? 999999;
          return pa - pb;
        });
        break;
      case 'price_high':
        result.sort((a, b) => {
          const pa = (a as unknown as Record<string, unknown>).avg_price as number ?? 0;
          const pb = (b as unknown as Record<string, unknown>).avg_price as number ?? 0;
          return pb - pa;
        });
        break;
    }

    return result;
  }, [restaurants, searchQuery, filterValues, sortBy]);

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
  }, []);

  return (
    <MiniAppLayout
      title={isRu ? 'Рестораны' : 'Restaurants'}
      subtitle={isRu ? `Найдено: ${filteredAndSorted.length}` : `${filteredAndSorted.length} results`}
      fallbackPath="/"
      showSearch
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск ресторанов...' : 'Search restaurants...'}
      showHero={false}
      categories={CUISINES}
      selectedCategory={selectedCuisine}
      onCategoryChange={setSelectedCuisine}
      filterConfig={restaurantFilterConfig}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      filterActiveCount={filterActiveCount}
      showMapButton
      mapPath={APP_ROUTES.RESTAURANT_MAP}
      resultsCount={filteredAndSorted.length}
      resultsLabel={isRu ? 'Рестораны' : 'Restaurants'}
      stickySubHeader={
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
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
          <div className="w-px h-5 bg-border/60 flex-shrink-0 mx-1" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="flex-shrink-0 text-[11px] font-medium bg-secondary border border-border rounded-full px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>
                {isRu ? opt.labelRu : opt.labelEn}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={isRu ? 'Ничего не найдено' : 'No restaurants found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredAndSorted.map(restaurant => (
            <CatalogCard key={restaurant.id} {...mapRestaurantToCatalogCard(restaurant, language, navigate)} />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="restaurants" className="mt-8" />
    </MiniAppLayout>
  );
}
