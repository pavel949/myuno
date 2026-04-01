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

export default function FlowersIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const isRu = language === 'ru';

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

  const filteredBouquets = useMemo(() => {
    if (activeFilterCount === 0) return bouquets;
    return bouquets.filter(b => {
      const priceLevel = filterValues.priceLevel as string | null;
      if (priceLevel) {
        const ranges: Record<string, [number, number]> = { '1': [0, 1500], '2': [1500, 3000], '3': [3000, 5000], '4': [5000, Infinity] };
        const [min, max] = ranges[priceLevel] || [0, Infinity];
        if (b.price < min || b.price >= max) return false;
      }
      const occasions = filterValues.occasion as string[] | undefined;
      if (occasions?.length && !(b.occasion_tags || []).some((o: string) => occasions.includes(o))) return false;
      const styles = filterValues.style as string[] | undefined;
      if (styles?.length && (!b.style || !styles.some(s => s.toLowerCase() === b.style?.toLowerCase()))) return false;
      const colors = filterValues.colorPalette as string[] | undefined;
      if (colors?.length) {
        const palette = b.color_palette?.toLowerCase() || '';
        const bColors = b.colors || [];
        if (!colors.some(c => palette.includes(c.toLowerCase()) || bColors.some((bc: string) => bc.toLowerCase().includes(c.toLowerCase())))) return false;
      }
      const flowerTypes = filterValues.flowerType as string[] | undefined;
      if (flowerTypes?.length) {
        const flowers = b.flowers || [];
        if (!flowerTypes.some(ft => flowers.some((f: string) => f.toLowerCase().includes(ft.toLowerCase())))) return false;
      }
      return true;
    });
  }, [bouquets, filterValues, activeFilterCount]);

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
      subtitle={`${filteredBouquets.length} ${isRu ? 'букетов' : 'bouquets'}`}
      fallbackPath="/discover"
      showSearch={false}
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
            {isRu ? 'До 14:00 — сегодня' : 'Before 2 PM — today'}
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
              <Skeleton className="aspect-[3/4] rounded-xl" />
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
