/**
 * RestaurantsIndex — Canonical consumer app: MiniAppLayout + CatalogCard
 * Search, filters, sort, map, results count all wired.
 */
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, MapPin, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { useRestaurants } from '@/hooks/useRestaurants';
import { CrossSellSection } from '@/components/crosssell';
import { mapRestaurantToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { restaurantFilterConfig } from '@/lib/filterRegistry';
import { vertRowsToMarkers } from '@/lib/adapters/vertRowToMarker';
import type { FilterValues } from '@/components/filters/UniversalFilter';
import { Button } from '@/components/ui/button';
import { pickLang } from '@/lib/i18n/pickLang';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';
import { PersonaFilterChip } from '@/components/landings/PersonaFilterChip';
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

const filterConfig = {
  ...restaurantFilterConfig,
  sections: restaurantFilterConfig.sections.filter(section => ['cuisine', 'dietary'].includes(section.id)),
};

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

  const [params, setParams] = useSearchParams();
  const selectedCuisine = params.get('category') || 'all';
  const selectedArea = params.get('district');
  const searchQuery = params.get('q') || '';
  const sortBy = params.get('sort') || 'recommended';
  const filterValues: FilterValues = useMemo(() => ({
    cuisine: params.getAll('cuisine'),
    dietary: params.getAll('dietary'),
  }), [params]);

  const updateQuery = (key: string, value: string, replace = false) => {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace, preventScrollReset: true });
  };

  const handleFilterChange = (values: FilterValues) => {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      for (const key of ['cuisine', 'dietary']) {
        next.delete(key);
        const value = values[key];
        if (Array.isArray(value)) for (const option of value) next.append(key, option);
      }
      return next;
    }, { preventScrollReset: true });
  };

  const { applyFilter: applyPersonaFilter, personaTags, clearPersona } = usePersonaFilter();

  const { restaurants, isLoading, error, refetch } = useRestaurants({
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

    // Persona filter — combines `cuisine`, `dietary_options`, `features` as
    // the synthetic tag pool for matching against persona vocabularies.
    result = applyPersonaFilter(result, (r) => {
      const raw = r as unknown as Record<string, unknown>;
      const cuisineTags = (raw.cuisine_tags as string[] | null) ?? [];
      const dietary = (raw.dietary_options as string[] | null) ?? [];
      const features = r.features ?? [];
      return [...cuisineTags, ...dietary, ...features, r.cuisine].filter(Boolean) as string[];
    }, { strict: true });

    return result;
  }, [restaurants, searchQuery, filterValues, sortBy, applyPersonaFilter]);


  return (
    <MiniAppLayout
      title={isRu ? 'Рестораны' : 'Restaurants'}
      subtitle={error ? pickLang(language, { ru: 'Каталог недоступен', en: 'Catalogue unavailable', th: 'ไม่สามารถโหลดแคตตาล็อก' }) : isRu ? `Найдено: ${filteredAndSorted.length}` : `${filteredAndSorted.length} results`}
      fallbackPath="/"
      showSearch
      searchValue={searchQuery}
      onSearchChange={value => updateQuery('q', value, true)}
      searchPlaceholder={isRu ? 'Поиск ресторанов...' : 'Search restaurants...'}
      showHero={false}
      categories={CUISINES}
      selectedCategory={selectedCuisine}
      onCategoryChange={value => updateQuery('category', value === 'all' ? '' : value)}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      filterActiveCount={filterActiveCount}
      mapMarkers={vertRowsToMarkers(filteredAndSorted)}
      onMapMarkerSelect={(id) => navigate(`/restaurants/${id}`)}
      mapIconChar="🍴"
      resultsCount={filteredAndSorted.length}
      resultsLabel={isRu ? 'Рестораны' : 'Restaurants'}
      stickySubHeader={
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {AREAS.map(a => (
            <button
              key={a.id}
              onClick={() => updateQuery('district', selectedArea === a.id ? '' : a.id)}
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
            onChange={e => updateQuery('sort', e.target.value === 'recommended' ? '' : e.target.value)}
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
      <PersonaFilterChip className="mb-3" />
      {error ? (
        <div role="alert" className="space-y-3 border border-border p-6">
          <p>{pickLang(language, { ru: 'Не удалось загрузить рестораны.', en: 'Unable to load restaurants.', th: 'โหลดร้านอาหารไม่สำเร็จ' })}</p>
          <Button variant="outline" onClick={() => void refetch()}>{pickLang(language, { ru: 'Повторить', en: 'Try again', th: 'ลองอีกครั้ง' })}</Button>
        </div>
      ) : isLoading ? (
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
          description={personaTags.length > 0
            ? pickLang(language, { ru: 'Нет ресторанов, подходящих под этот сценарий и остальные условия.', en: 'No restaurants match this scenario and your other selections.', th: 'ไม่มีร้านอาหารที่ตรงกับสถานการณ์และตัวเลือกอื่น ๆ ของคุณ' })
            : isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          action={personaTags.length > 0 ? <Button variant="outline" onClick={clearPersona}>{pickLang(language, { ru: 'Искать без сценария', en: 'Search without scenario', th: 'ค้นหาโดยไม่เลือกสถานการณ์' })}</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredAndSorted.map(restaurant => (
            <CatalogCard key={restaurant.id} {...mapRestaurantToCatalogCard(restaurant, language, navigate)} onClick={undefined} href={`/restaurants/${restaurant.id}`} />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="restaurants" className="mt-8" />
    </MiniAppLayout>
  );
}
