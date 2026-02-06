/**
 * FlowersIndex - Main catalog page for flower delivery
 * 
 * Uses dynamic taxonomy from DB via useFlowerFilterOptions
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower, ShoppingCart, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, ItemCard, type MiniAppCategory, type QuickFilterSection } from '@/components/miniapp';
import { ActiveFilters, FilterValues } from '@/components/filters';
import { matchesSingleFilter } from '@/lib/filterUtils';
import { useBouquets, Bouquet } from '@/hooks/useBouquets';
import { useFlowerFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { CrossSellSection } from '@/components/crosssell';

// No fallback - use production data only

const FlowersIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Dynamic filter options from DB
  const { 
    categoryRibbon, 
    filterConfig: dynamicFilterConfig,
    occasions,
    colorPaletteOptions,
    styleOptions,
    isLoading: filtersLoading 
  } = useFlowerFilterOptions();

  // Price range options for quick filters
  const priceRangeOptions = useMemo(() => [
    { id: 'budget', labelEn: 'Up to ฿1,500', labelRu: 'До ฿1,500', icon: '💰' },
    { id: 'mid', labelEn: '฿1,500–3,000', labelRu: '฿1,500–3,000', icon: '💎' },
    { id: 'premium', labelEn: '฿3,000+', labelRu: '฿3,000+', icon: '👑' },
  ], []);

  // Build quick filter sections for inline chips
  const quickFilters: QuickFilterSection[] = useMemo(() => [
    {
      id: 'priceRange',
      options: priceRangeOptions,
    },
    {
      id: 'occasion',
      options: occasions.slice(0, 6).map(o => ({
        id: o.id,
        labelEn: o.labelEn,
        labelRu: o.labelRu,
        icon: typeof o.icon === 'string' ? o.icon : undefined,
      })),
    },
    {
      id: 'colorPalette',
      options: colorPaletteOptions.map(o => ({
        id: o.id,
        labelEn: o.labelEn,
        labelRu: o.labelRu,
        icon: typeof o.icon === 'string' ? o.icon : undefined,
      })),
    },
  ], [occasions, colorPaletteOptions, priceRangeOptions]);

  // Convert to MiniAppCategory format
  const categories: MiniAppCategory[] = useMemo(() => {
    return categoryRibbon.map(opt => ({
      id: opt.id,
      labelEn: opt.labelEn,
      labelRu: opt.labelRu,
      icon: typeof opt.icon === 'string' ? opt.icon : undefined,
    }));
  }, [categoryRibbon]);

  // Fetch bouquets from database
  const { bouquets: dbBouquets, isLoading } = useBouquets({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    onlyActive: true,
  });

  // Use database data directly - no fallback needed with production seeded data
  const bouquets = dbBouquets;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([_, value]) => {
      if (Array.isArray(value)) count += value.length;
      else if (value) count += 1;
    });
    return count;
  }, [filterValues]);

  const handleRemoveFilter = (sectionId: string, optionId?: string) => {
    setFilterValues(prev => {
      const sectionValue = prev[sectionId];
      if (Array.isArray(sectionValue) && optionId) {
        return { ...prev, [sectionId]: sectionValue.filter(v => v !== optionId) };
      }
      return { ...prev, [sectionId]: null };
    });
  };

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredBouquets = useMemo(() => {
    return bouquets.filter((bouquet) => {
      // Category filter is already applied at API level, but keep for fallback data
      if (selectedCategory !== 'all' && bouquet.category !== selectedCategory) return false;
      
      // Quick price range filter (new)
      const priceRangeFilter = filterValues.priceRange as string[] | undefined;
      if (priceRangeFilter?.length) {
        const inRange = priceRangeFilter.some(range => {
          switch (range) {
            case 'budget': return bouquet.price <= 1500;
            case 'mid': return bouquet.price > 1500 && bouquet.price <= 3000;
            case 'premium': return bouquet.price > 3000;
            default: return true;
          }
        });
        if (!inRange) return false;
      }
      
      // Price level filter (from drawer)
      const priceLevel = filterValues.priceLevel as string | null;
      if (priceLevel) {
        const level = parseInt(priceLevel);
        const priceRanges: Record<number, { min: number; max: number }> = {
          1: { min: 0, max: 1000 },
          2: { min: 1000, max: 2500 },
          3: { min: 2500, max: 4000 },
          4: { min: 4000, max: Infinity },
        };
        const range = priceRanges[level];
        if (range && (bouquet.price < range.min || bouquet.price > range.max)) return false;
      }
      
      // Search filter
      if (searchQuery) {
        const name = language === 'ru' ? bouquet.name_ru : bouquet.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      // Color filter - match against colors array or name
      const colorFilter = filterValues.color as string[] | undefined;
      if (colorFilter?.length) {
        const bouquetName = ((bouquet.name_en || '') + ' ' + (bouquet.name_ru || '')).toLowerCase();
        const bouquetColors = bouquet.colors || [];
        const hasColor = colorFilter.some(c => 
          bouquetName.includes(c.toLowerCase()) || 
          bouquetColors.some(bc => bc.toLowerCase().includes(c.toLowerCase()))
        );
        if (!hasColor) return false;
      }
      
      // Flower type filter - match against category
      const flowerTypeFilter = filterValues.flowerType as string[] | undefined;
      if (flowerTypeFilter?.length) {
        if (!matchesSingleFilter(bouquet.category || '', flowerTypeFilter)) return false;
      }
      
      // Size filter
      const sizeFilter = filterValues.size as string | undefined;
      if (sizeFilter && bouquet.size !== sizeFilter) {
        return false;
      }
      
      // Occasion filter - match against occasion_tags array
      const occasionFilter = filterValues.occasion as string[] | undefined;
      if (occasionFilter?.length) {
        const bouquetTags = bouquet.occasion_tags || [];
        const hasOccasion = occasionFilter.some(o => 
          bouquetTags.some(tag => tag.toLowerCase() === o.toLowerCase())
        );
        if (!hasOccasion) return false;
      }
      
      // Color palette filter - match against color_palette field
      const colorPaletteFilter = filterValues.colorPalette as string[] | undefined;
      if (colorPaletteFilter?.length) {
        const palette = (bouquet.color_palette || '').toLowerCase();
        const hasColorPalette = colorPaletteFilter.some(c => palette.includes(c.toLowerCase()));
        if (!hasColorPalette) return false;
      }
      
      // Style filter - match against style field
      const styleFilter = filterValues.style as string[] | undefined;
      if (styleFilter?.length) {
        const bouquetStyle = (bouquet.style || '').toLowerCase();
        const hasStyle = styleFilter.some(s => bouquetStyle === s.toLowerCase());
        if (!hasStyle) return false;
      }
      
      return true;
    });
  }, [bouquets, selectedCategory, searchQuery, filterValues, language]);

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Букеты' : 'Bouquets'}
      subtitle={language === 'ru' ? `${filteredBouquets.length} вариантов` : `${filteredBouquets.length} options`}
      fallbackPath="/"
      
      heroIcon={Flower}
      heroTitle={language === 'ru' ? 'Доставка цветов' : 'Flower Delivery'}
      heroSubtitle={language === 'ru' ? 'Свежие букеты с доставкой за 2 часа' : 'Fresh bouquets delivered in 2 hours'}
      heroGradientFrom="from-pink-500/20"
      heroGradientVia="via-rose-500/20"
      heroGradientTo="to-primary/20"
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск букетов...' : 'Search bouquets...'}
      
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
      quickFilters={quickFilters}
      
      showCartButton
      cartItemCount={totalItems}
      
      filterConfig={dynamicFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      
      showBottomNav={false}
      resultsCount={filteredBouquets.length}
      resultsLabel={language === 'ru' ? 'Букеты' : 'Bouquets'}
    >
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <ActiveFilters
          config={dynamicFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={() => setFilterValues({})}
          className="mb-4"
        />
      )}

      {/* Bouquets Grid - Vertical cards for flowers */}
      {isLoading || filtersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredBouquets.map((bouquet) => (
            <ItemCard
              key={bouquet.id}
              title={language === 'ru' ? bouquet.name_ru : bouquet.name_en}
              image={bouquet.image || undefined}
              price={bouquet.price}
              tags={bouquet.is_popular ? [language === 'ru' ? 'Хит' : 'Popular'] : undefined}
              variant="vertical"
              onClick={() => navigate(`/flowers/bouquet/${bouquet.id}`)}
            />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="flowers" className="mb-20" />

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {language === 'ru' ? 'Корзина' : 'Cart'} ({totalItems})
          </Button>
        </div>
      )}
    </MiniAppLayout>
  );
};

export default FlowersIndex;
