/**
 * FlowersIndex — Premium flower delivery catalog with conversion mechanics
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, ShoppingCart, Shield, Clock, Flame, Star, Filter } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useBouquets } from '@/hooks/useBouquets';
import { useFlowerFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';

export default function FlowersIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const isRu = language === 'ru';

  const { categoryRibbon, filterConfig, isLoading: filtersLoading } = useFlowerFilterOptions();
  const categories = useMemo(() => categoryRibbon.map(opt => ({
    id: opt.id,
    label: isRu ? opt.labelRu : opt.labelEn,
  })), [categoryRibbon, isRu]);

  const { bouquets, isLoading } = useBouquets({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    onlyActive: true,
  });

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(filterValues).forEach(v => {
      if (Array.isArray(v)) count += v.length;
      else if (v) count += 1;
    });
    return count;
  }, [filterValues]);

  // Client-side filtering
  const filteredBouquets = useMemo(() => {
    if (activeFilterCount === 0) return bouquets;

    return bouquets.filter(b => {
      // Price level
      const priceLevel = filterValues.priceLevel as string | null;
      if (priceLevel) {
        const price = b.price;
        const ranges: Record<string, [number, number]> = {
          '1': [0, 1500], '2': [1500, 3000], '3': [3000, 5000], '4': [5000, Infinity],
        };
        const [min, max] = ranges[priceLevel] || [0, Infinity];
        if (price < min || price >= max) return false;
      }

      // Occasion
      const occasions = filterValues.occasion as string[] | undefined;
      if (occasions?.length) {
        const tags = b.occasion_tags || [];
        if (!occasions.some(o => tags.includes(o))) return false;
      }

      // Style
      const styles = filterValues.style as string[] | undefined;
      if (styles?.length) {
        if (!b.style || !styles.some(s => s.toLowerCase() === b.style?.toLowerCase())) return false;
      }

      // Color palette
      const colors = filterValues.colorPalette as string[] | undefined;
      if (colors?.length) {
        const palette = b.color_palette?.toLowerCase() || '';
        const bColors = b.colors || [];
        if (!colors.some(c => palette.includes(c.toLowerCase()) || bColors.some(bc => bc.toLowerCase().includes(c.toLowerCase())))) return false;
      }

      // Flower type (from category taxonomy — matches `flowers` array)
      const flowerTypes = filterValues.flowerType as string[] | undefined;
      if (flowerTypes?.length) {
        const flowers = b.flowers || [];
        if (!flowerTypes.some(ft => flowers.some(f => f.toLowerCase().includes(ft.toLowerCase())))) return false;
      }

      // Size filter
      const size = filterValues.size as string | null;
      if (size && b.size_variants) {
        const variants = b.size_variants as any[];
        if (!variants.some(v => v.size === size)) return false;
      }

      return true;
    });
  }, [bouquets, filterValues, activeFilterCount]);

  // Filter removal handler
  const handleRemoveFilter = useCallback((sectionId: string, optionId?: string) => {
    setFilterValues(prev => {
      const current = prev[sectionId];
      if (Array.isArray(current) && optionId) {
        return { ...prev, [sectionId]: current.filter(v => v !== optionId) };
      }
      return { ...prev, [sectionId]: null };
    });
  }, []);

  const handleClearAll = useCallback(() => setFilterValues({}), []);

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);

  const cartButton = totalItems > 0 ? (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 relative"
      onClick={() => navigate('/cart')}
    >
      <ShoppingCart className="w-4 h-4" />
      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
        {totalItems}
      </span>
    </Button>
  ) : undefined;

  const isBefore2PM = new Date().getHours() < 14;

  return (
    <AppLayout showHeader={false} showBottomNav={false}>
      <Helmet>
        <title>{isRu ? 'Доставка цветов на Пхукете | myUNO' : 'Flower Delivery in Phuket | myUNO'}</title>
        <meta name="description" content={isRu
          ? 'Доставка свежих букетов на Пхукете за 1-3 часа. Розы, пионы, орхидеи. Гарантия свежести 5 дней.'
          : 'Fresh flower delivery in Phuket within 1-3 hours. Roses, peonies, orchids. 5-day freshness guarantee.'
        } />
      </Helmet>
      <div className="min-h-screen bg-background">
        <CatalogHeader
          title={isRu ? 'Доставка цветов' : 'Flower Delivery'}
          subtitle={`${filteredBouquets.length} ${isRu ? 'букетов' : 'bouquets'}`}
          fallbackPath="/discover"
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          actions={
            <div className="flex items-center gap-2">
              <UniversalFilter
                config={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                activeCount={activeFilterCount}
              />
              {cartButton}
            </div>
          }
        />

        {/* Trust bar */}
        <div className="bg-muted/50 border-b px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-primary" />
              {isRu ? 'Гарантия свежести 5 дней' : '5-day freshness guarantee'}
            </span>
            {isBefore2PM && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                {isRu ? 'До 14:00 — доставим сегодня' : 'Order by 2 PM — same-day delivery'}
              </span>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4 pb-24">
          {/* Active filters */}
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
              {filteredBouquets.map(bouquet => {
                const name = isRu ? bouquet.name_ru : bouquet.name_en;
                const shortDesc = isRu 
                  ? bouquet.short_description_ru
                  : bouquet.short_description_en;
                const hasVariants = bouquet.size_variants?.length;
                const displayPrice = hasVariants
                  ? (bouquet.size_variants as any[])[0]?.price || bouquet.price
                  : bouquet.price;
                const socialProof = bouquet.social_proof_badge;
                const urgencyBadge = bouquet.urgency_badge;
                const scarcityLevel = bouquet.scarcity_level;
                const boxType = bouquet.box_type;

                return (
                  <div
                    key={bouquet.id}
                    className="cursor-pointer group"
                    onClick={() => navigate(`/flowers/bouquet/${bouquet.id}`)}
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                      <OptimizedImage
                        src={bouquet.image || 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400'}
                        alt={name}
                        width={400}
                        height={533}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        quality={80}
                      />
                      {/* Badges stack */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {bouquet.is_popular && (
                          <Badge className="bg-primary text-primary-foreground text-[10px]">
                            <Flame className="w-2.5 h-2.5 mr-0.5" />
                            {isRu ? 'Хит' : 'Popular'}
                          </Badge>
                        )}
                        {boxType && boxType !== 'wrap' && (
                          <Badge variant="secondary" className="text-[10px]">
                            {boxType === 'velvet_box' ? (isRu ? '🎁 Бархатная коробка' : '🎁 Velvet Box') : boxType === 'luxury_box' ? (isRu ? '👑 Люкс коробка' : '👑 Luxury Box') : boxType}
                          </Badge>
                        )}
                        {scarcityLevel === 'high' && (
                          <Badge variant="destructive" className="text-[10px]">
                            {isRu ? 'Осталось мало' : 'Limited'}
                          </Badge>
                        )}
                      </div>

                      {/* Social proof badge bottom */}
                      {socialProof && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <Badge className="bg-background/90 text-foreground text-[9px] backdrop-blur-sm border-0 w-full justify-center">
                          <Star className="w-2.5 h-2.5 mr-0.5 text-amber-500" />
                            {isRu 
                              ? socialProof === 'Most ordered this week' ? 'Самый заказываемый на этой неделе'
                                : socialProof === 'Customer favorite' ? 'Любимец покупателей'
                                : socialProof
                              : socialProof}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {shortDesc && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{shortDesc}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {hasVariants ? `${isRu ? 'от' : 'from'} ` : ''}฿{displayPrice.toLocaleString()}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          {isRu ? '5д' : '5d'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
