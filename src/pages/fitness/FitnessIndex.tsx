/**
 * FitnessIndex — Canonical consumer app: MiniAppLayout + CatalogCard
 * Search, filters, sort, results count, cross-sell all wired.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGyms } from '@/hooks/useGyms';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { mapGymToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { fitnessFilterConfig } from '@/lib/filterRegistry';
import { withGeoSection } from '@/components/filters';
import { vertRowsToMarkers } from '@/lib/adapters/vertRowToMarker';
import type { FilterValues } from '@/components/filters/UniversalFilter';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'gym', labelEn: 'Gym', labelRu: 'Зал' },
  { id: 'yoga', labelEn: 'Yoga', labelRu: 'Йога' },
  { id: 'muay-thai', labelEn: 'Muay Thai', labelRu: 'Муай Тай' },
  { id: 'crossfit', labelEn: 'CrossFit', labelRu: 'Кроссфит' },
  { id: 'swimming', labelEn: 'Swimming', labelRu: 'Бассейн' },
];

const SORT_OPTIONS = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  { id: 'price_low', labelEn: 'Price: Low', labelRu: 'Цена ↑' },
  { id: 'price_high', labelEn: 'Price: High', labelRu: 'Цена ↓' },
];

export default function FitnessIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { gyms, isLoading } = useGyms();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState('recommended');
  const isRu = language === 'ru';
  const { applyFilter: applyPersonaFilter } = usePersonaFilter();

  const filterActiveCount = useMemo(() => {
    return Object.values(filterValues).filter(v =>
      Array.isArray(v) ? v.length > 0 : v != null
    ).length;
  }, [filterValues]);

  const filteredAndSorted = useMemo(() => {
    let result = [...gyms];

    if (selectedCategory !== 'all') {
      result = result.filter(gym => gym.gym_type === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g =>
        (g.name_en?.toLowerCase().includes(q)) ||
        (g.name_ru?.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'price_low':
        result.sort((a, b) => {
          const pa = a.price_day_pass ?? a.price_month_pass ?? 999999;
          const pb = b.price_day_pass ?? b.price_month_pass ?? 999999;
          return pa - pb;
        });
        break;
      case 'price_high':
        result.sort((a, b) => {
          const pa = a.price_day_pass ?? a.price_month_pass ?? 0;
          const pb = b.price_day_pass ?? b.price_month_pass ?? 0;
          return pb - pa;
        });
        break;
    }

    // Persona filter — fitness uses gym_type + tags for matching.
    result = applyPersonaFilter(result, (g) => {
      const raw = g as unknown as Record<string, unknown>;
      const tags = (raw.tags as string[] | null) ?? [];
      return [...tags, g.gym_type].filter(Boolean) as string[];
    });

    return result;
  }, [gyms, selectedCategory, searchQuery, sortBy, applyPersonaFilter]);

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
  }, []);

  return (
    <MiniAppLayout
      title={isRu ? 'Фитнес и Спорт' : 'Fitness & Sports'}
      subtitle={`${filteredAndSorted.length} ${isRu ? 'залов' : 'gyms'}`}
      fallbackPath="/discover"
      showSearch
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск залов...' : 'Search gyms...'}
      showHero={false}
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={withGeoSection(fitnessFilterConfig)}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      filterActiveCount={filterActiveCount}
      mapMarkers={vertRowsToMarkers(filteredAndSorted)}
      onMapMarkerSelect={(id) => navigate(`/fitness/${id}`)}
      mapIconChar="F"
      resultsCount={filteredAndSorted.length}
      resultsLabel={isRu ? 'Залы' : 'Gyms'}
      stickySubHeader={
        <div className="px-4 py-2 flex items-center justify-end">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-[11px] font-medium bg-secondary border border-border rounded-full px-2.5 py-1.5 outline-none cursor-pointer"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={isRu ? 'Залы не найдены' : 'No gyms found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSorted.map(gym => (
            <CatalogCard key={gym.id} {...mapGymToCatalogCard(gym, language, navigate)} />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="fitness" className="mt-8" />
    </MiniAppLayout>
  );
}
