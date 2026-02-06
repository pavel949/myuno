/**
 * FlowersIndex - Main catalog page for flower delivery
 * 
 * Uses dynamic taxonomy from DB via useFlowerFilterOptions
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower, SlidersHorizontal, ShoppingCart, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, FilterValues, FilterConfig } from '@/components/filters';
import { matchesSingleFilter } from '@/lib/filterUtils';
import { useBouquets, Bouquet } from '@/hooks/useBouquets';
import { useFlowerFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { CrossSellSection } from '@/components/crosssell';

// Fallback data when database is empty
const FALLBACK_BOUQUETS: Partial<Bouquet>[] = [
  {
    id: 'bouquet-1',
    name_en: 'Romantic Red Roses',
    name_ru: 'Романтические красные розы',
    image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=600',
    price: 1800,
    category: 'roses',
    size: 'medium',
    is_popular: true,
    shop_id: '',
  },
  {
    id: 'bouquet-2',
    name_en: 'Gentle Pink Peonies',
    name_ru: 'Нежные розовые пионы',
    image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=600',
    price: 2500,
    category: 'peonies',
    size: 'medium',
    is_popular: true,
    shop_id: '',
  },
  {
    id: 'bouquet-3',
    name_en: 'Spring Mix',
    name_ru: 'Весенний микс',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600',
    price: 1200,
    category: 'mixed',
    size: 'large',
    is_popular: false,
    shop_id: '',
  },
  {
    id: 'bouquet-4',
    name_en: 'White Orchid Elegance',
    name_ru: 'Белые орхидеи элегант',
    image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600',
    price: 3500,
    category: 'orchids',
    size: 'medium',
    is_popular: true,
    shop_id: '',
  },
  {
    id: 'bouquet-5',
    name_en: 'Sunny Tulips',
    name_ru: 'Солнечные тюльпаны',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600',
    price: 950,
    category: 'tulips',
    size: 'medium',
    is_popular: false,
    shop_id: '',
  },
  {
    id: 'bouquet-6',
    name_en: 'Luxury Rose Box',
    name_ru: 'Люкс розы в коробке',
    image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600',
    price: 4500,
    category: 'premium',
    size: 'xl',
    is_popular: true,
    shop_id: '',
  },
];

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
    isLoading: filtersLoading 
  } = useFlowerFilterOptions();

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

  // Use database data or fallback
  const bouquets = dbBouquets.length > 0 ? dbBouquets : FALLBACK_BOUQUETS as Bouquet[];

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
      
      // Price level filter
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
      
      // Occasion filter
      const occasionFilter = filterValues.occasion as string[] | undefined;
      if (occasionFilter?.length) {
        // Check if bouquet matches any occasion (via name or tags)
        const bouquetName = ((bouquet.name_en || '') + ' ' + (bouquet.name_ru || '')).toLowerCase();
        const hasOccasion = occasionFilter.some(o => bouquetName.includes(o.toLowerCase()));
        if (!hasOccasion) return false;
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
      heroImage="https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800"
      heroGradient={{ from: 'from-pink-500/20', via: 'via-rose-500/20', to: 'to-primary/20' }}
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск букетов...' : 'Search bouquets...'}
      
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
      showCartButton
      cartItemCount={totalItems}
      
      filterButton={
        <UniversalFilter
          config={dynamicFilterConfig}
          values={filterValues}
          onChange={setFilterValues}
          activeCount={activeFilterCount}
        >
          <Button variant="outline" size="icon" className="relative shrink-0 h-10 w-10">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </UniversalFilter>
      }
      
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
