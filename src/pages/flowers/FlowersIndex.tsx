/**
 * FlowersIndex — Unified catalog using MiniAppLayout + CatalogCard
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, ShoppingCart, Shield, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { useBouquets } from '@/hooks/useBouquets';
import { useFlowerFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { mapBouquetToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { APP_ROUTES } from '@/lib/config/routes';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function FlowersIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const isRu = language === 'ru';
  const { applyFilter: applyPersonaFilter } = usePersonaFilter();

  const { categoryRibbon, filterConfig, isLoading: filtersLoading } = useFlowerFilterOptions();
  const categories = useMemo(() => categoryRibbon.map(opt => ({
    id: opt.id,
    labelEn: opt.labelEn,
    labelRu: opt.labelRu,
  })), [categoryRibbon]);

  const { bouquets, isLoading } = useBouquets({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    onlyActive: true,
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(filterValues).forEach(v => {
      if (Array.isArray(v)) count += v.length;
      else if (v) count += 1;
    });
    return count;
  }, [filterValues]);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

  // Precompute a lowercased haystack per bouquet once per `bouquets` identity.
  // This is the most expensive step on mobile — caching it avoids re-joining
  // arrays on every keystroke or filter toggle.
  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bouquets) {
      map.set(b.id, [
        b.name_en, b.name_ru,
        b.description_en, b.description_ru,
        b.style, b.color_palette,
        ...(b.flowers || []),
        ...(b.colors || []),
        ...(b.occasion_tags || []),
      ].filter(Boolean).join(' ').toLowerCase());
    }
    return map;
  }, [bouquets]);

  const normalizedQuery = useMemo(
    () => debouncedSearchQuery.trim().toLowerCase(),
    [debouncedSearchQuery],
  );

  // Stage 1: search-only result, cached on (bouquets, normalizedQuery).
  // Toggling a filter (without changing the query) reuses this slice.
  const searchedBouquets = useMemo(() => {
    if (!normalizedQuery) return bouquets;
    return bouquets.filter(b => (haystacks.get(b.id) || '').includes(normalizedQuery));
  }, [bouquets, haystacks, normalizedQuery]);

  // Stage 2: structured filters, cached on (searchedBouquets, filterValues).
  // Typing in the search box without touching filters reuses prior filter pass.
  const structurallyFiltered = useMemo(() => {
    if (activeFilterCount === 0) return searchedBouquets;
    const priceLevel = filterValues.priceLevel as string | null;
    const occasions = filterValues.occasion as string[] | undefined;
    const styles = (filterValues.style as string[] | undefined)?.map(s => s.toLowerCase());
    const colors = (filterValues.colorPalette as string[] | undefined)?.map(c => c.toLowerCase());
    const flowerTypes = (filterValues.flowerType as string[] | undefined)?.map(f => f.toLowerCase());
    const priceRanges: Record<string, [number, number]> = {
      '1': [0, 1500], '2': [1500, 3000], '3': [3000, 5000], '4': [5000, Infinity],
    };
    const [pMin, pMax] = priceLevel ? (priceRanges[priceLevel] || [0, Infinity]) : [0, Infinity];

    return searchedBouquets.filter(b => {
      if (priceLevel && (b.price < pMin || b.price >= pMax)) return false;
      if (occasions?.length && !(b.occasion_tags || []).some((o: string) => occasions.includes(o))) return false;
      if (styles?.length) {
        const bStyle = b.style?.toLowerCase();
        if (!bStyle || !styles.includes(bStyle)) return false;
      }
      if (colors?.length) {
        const palette = b.color_palette?.toLowerCase() || '';
        const bColors = (b.colors || []).map((c: string) => c.toLowerCase());
        if (!colors.some(c => palette.includes(c) || bColors.some(bc => bc.includes(c)))) return false;
      }
      if (flowerTypes?.length) {
        const flowers = (b.flowers || []).map((f: string) => f.toLowerCase());
        if (!flowerTypes.some(ft => flowers.some(f => f.includes(ft)))) return false;
      }
      return true;
    });
  }, [searchedBouquets, filterValues, activeFilterCount]);

  // Stage 3: persona filter (cheap, depends on persona context).
  const filteredBouquets = useMemo(
    () => applyPersonaFilter(structurallyFiltered, (b) => {
      const tags = (b.occasion_tags as string[] | null) ?? [];
      return [...tags, b.style].filter(Boolean) as string[];
    }),
    [structurallyFiltered, applyPersonaFilter],
  );

  const handleRemoveFilter = useCallback((sectionId: string, optionId?: string) => {
    setFilterValues(prev => {
      const current = prev[sectionId];
      if (Array.isArray(current) && optionId) return { ...prev, [sectionId]: current.filter(v => v !== optionId) };
      return { ...prev, [sectionId]: null };
    });
  }, []);

  const handleClearAll = useCallback(() => setFilterValues({}), []);

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);

  const isBefore2PM = new Date().getHours() < 14;

  return (
    <MiniAppLayout
      title={isRu ? 'Доставка цветов' : 'Flower Delivery'}
      subtitle={isRu ? `Найдено: ${filteredBouquets.length}` : `${filteredBouquets.length} results`}
      fallbackPath={APP_ROUTES.DISCOVER}
      showSearch
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск букетов, цветов, поводов…' : 'Search bouquets, flowers, occasions…'}
      showHero={false}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      showCartButton={true}
      cartItemCount={totalItems}
      showBottomNav={false}
    >
      <Helmet>
        <title>{isRu ? 'Доставка цветов на Пхукете | myUNO' : 'Flower Delivery in Phuket | myUNO'}</title>
        <meta name="description" content={isRu
          ? 'Доставка свежих букетов на Пхукете за 1-3 часа. Розы, пионы, орхидеи.'
          : 'Fresh flower delivery in Phuket within 1-3 hours. Roses, peonies, orchids.'
        } />
      </Helmet>

      {/* Trust bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs text-muted-foreground flex-wrap -mt-2 mb-4">
        <span className="flex items-center gap-1 shrink-0">
          <Shield className="w-3 h-3 text-primary shrink-0" />
          {isRu ? 'Гарантия свежести 5 дней' : '5-day freshness guarantee'}
        </span>
        {isBefore2PM && (
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-primary shrink-0" />
            {isRu ? 'Доставка сегодня — заказ до 14:00' : 'Same-day delivery — order before 2 PM'}
          </span>
        )}
      </div>

      {activeFilterCount > 0 && (
        <ActiveFilters
          config={filterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAll}
          className="mb-4"
        />
      )}

      {isLoading || filtersLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-none" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredBouquets.length === 0 ? (
        <EmptyState
          icon={Flower2}
          title={isRu ? 'Букеты не найдены' : 'No bouquets found'}
          description={isRu
            ? activeFilterCount > 0 ? 'Попробуйте изменить фильтры' : 'В этой категории пока нет букетов'
            : activeFilterCount > 0 ? 'Try adjusting your filters' : 'No bouquets in this category yet'
          }
          action={activeFilterCount > 0 ? (
            <Button variant="outline" onClick={handleClearAll}>
              {isRu ? 'Сбросить фильтры' : 'Reset filters'}
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBouquets.map(bouquet => (
            <CatalogCard key={bouquet.id} {...mapBouquetToCatalogCard(bouquet, language, navigate)} />
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
