/**
 * BeautySpaIndex — Canonical consumer app: MiniAppLayout + CatalogCard
 * Search, filters, sort, map, results count all wired.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalons } from '@/hooks/useSalons';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { mapSalonToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { beautyFilterConfig } from '@/lib/filterRegistry';
import { APP_ROUTES } from '@/lib/config/routes';
import type { FilterValues } from '@/components/filters/UniversalFilter';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'spa', labelEn: 'Spa', labelRu: 'Спа' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж' },
  { id: 'beauty_salon', labelEn: 'Beauty', labelRu: 'Красота' },
  { id: 'hair_salon', labelEn: 'Hair', labelRu: 'Волосы' },
  { id: 'nail_salon', labelEn: 'Nails', labelRu: 'Ногти' },
  { id: 'barber', labelEn: 'Barber', labelRu: 'Барбер' },
];

const SORT_OPTIONS = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  { id: 'price_low', labelEn: 'Price: Low', labelRu: 'Цена ↑' },
  { id: 'price_high', labelEn: 'Price: High', labelRu: 'Цена ↓' },
];

export default function BeautySpaIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState('recommended');
  const isRu = language === 'ru';

  const { applyFilter: applyPersonaFilter } = usePersonaFilter();
  const { salons, isLoading } = useSalons(selectedCategory === 'all' ? undefined : selectedCategory);

  const filterActiveCount = useMemo(() => {
    return Object.values(filterValues).filter(v =>
      Array.isArray(v) ? v.length > 0 : v != null
    ).length;
  }, [filterValues]);

  const filteredAndSorted = useMemo(() => {
    let result = [...salons];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.name_en?.toLowerCase().includes(q)) ||
        (s.name_ru?.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'price_low':
        result.sort((a, b) => (a.price_from ?? 999999) - (b.price_from ?? 999999));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price_from ?? 0) - (a.price_from ?? 0));
        break;
    }

    return result;
  }, [salons, searchQuery, sortBy]);

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
  }, []);

  return (
    <MiniAppLayout
      title={isRu ? 'Красота и СПА' : 'Beauty & Spa'}
      subtitle={isRu ? `Найдено: ${filteredAndSorted.length}` : `${filteredAndSorted.length} results`}
      fallbackPath="/discover"
      showSearch
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск салонов...' : 'Search salons...'}
      showHero={false}
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={beautyFilterConfig}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      filterActiveCount={filterActiveCount}
      showMapButton
      mapPath={APP_ROUTES.BEAUTY_MAP}
      resultsCount={filteredAndSorted.length}
      resultsLabel={isRu ? 'Салоны' : 'Salons'}
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
          icon={Scissors}
          title={isRu ? 'Салоны не найдены' : 'No salons found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSorted.map(salon => (
            <CatalogCard key={salon.id} {...mapSalonToCatalogCard(salon, language, navigate)} />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="beauty" className="mt-8" />
    </MiniAppLayout>
  );
}
