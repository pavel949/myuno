import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, Truck, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { marketFilterConfig } from '@/components/filters/MarketFilters';
import { useStores, Store } from '@/hooks/useStores';
import { matchesFilter, matchesPriceLevel, isOpenNow } from '@/lib/filterUtils';

const MARKET_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🛒' },
  { id: 'grocery', labelEn: 'Grocery', labelRu: 'Продукты', icon: '🍎' },
  { id: 'souvenirs', labelEn: 'Souvenirs', labelRu: 'Сувениры', icon: '🎁' },
  { id: 'cosmetics', labelEn: 'Cosmetics', labelRu: 'Косметика', icon: '✨' },
  { id: 'jewelry', labelEn: 'Jewelry', labelRu: 'Украшения', icon: '💎' },
  { id: 'decor', labelEn: 'Decor', labelRu: 'Декор', icon: '🎨' },
  { id: 'clothing', labelEn: 'Clothing', labelRu: 'Одежда', icon: '👔' },
];

// Export for StoreDetail compatibility
export const stores: Store[] = [];

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { items } = useCart();
  const { stores: dbStores, isLoading } = useStores();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const cartItemCount = items.filter(i => i.type === 'product').reduce((sum, i) => sum + i.quantity, 0);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

  const handleRemoveFilter = (sectionId: string, optionId?: string) => {
    setFilterValues(prev => {
      const newValues = { ...prev };
      if (optionId && Array.isArray(newValues[sectionId])) {
        newValues[sectionId] = (newValues[sectionId] as string[]).filter(id => id !== optionId);
        if ((newValues[sectionId] as string[]).length === 0) delete newValues[sectionId];
      } else {
        delete newValues[sectionId];
      }
      return newValues;
    });
  };

  const filteredStores = useMemo(() => {
    return dbStores.filter(store => {
      const matchesCategory = selectedCategory === 'all' || store.category === selectedCategory;
      
      const name = language === 'ru' ? store.name_ru : store.name_en;
      const matchesSearch = searchQuery === '' || 
        name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Delivery filters
      const deliveryFilters = filterValues.delivery as string[] || [];
      if (deliveryFilters.includes('free-delivery') && store.delivery_fee !== 0) return false;
      if (deliveryFilters.includes('fast-delivery')) {
        // Assume stores with delivery have ~30-60min delivery time
      }
      
      // Price level filter
      const priceLevel = filterValues.priceLevel as string | undefined;
      if (priceLevel && !matchesPriceLevel(store.delivery_fee || 0, priceLevel)) return false;
      
      // Store category filter from modal
      const storeCategories = filterValues.storeCategory as string[] | undefined;
      if (storeCategories?.length && !matchesFilter([store.category || ''], storeCategories)) return false;
      
      // Features filter
      const features = filterValues.features as string[] | undefined;
      if (features?.length) {
        if (features.includes('verified') && !store.is_verified) return false;
        if (features.includes('delivery') && !store.delivery_available) return false;
      }
      
      // Rating filter
      const ratingFilter = filterValues.rating as string | undefined;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        if ((store.rating || 0) < minRating) return false;
      }
      
      // Open now filter
      if (filterValues.openNow && !isOpenNow(store.working_hours as Record<string, string> | null)) return false;
      
      return matchesCategory && matchesSearch;
    });
  }, [dbStores, selectedCategory, searchQuery, filterValues, language]);

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Магазин' : 'Market'}
      subtitle={language === 'ru' ? `${filteredStores.length} магазинов` : `${filteredStores.length} stores`}
      fallbackPath="/"
      
      heroIcon={ShoppingBag}
      heroTitle={language === 'ru' ? 'Магазины Пхукета' : 'Phuket Stores'}
      heroSubtitle={language === 'ru' ? 'Доставка продуктов, сувениров и подарков' : 'Groceries, souvenirs and gifts delivery'}
      heroImage="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800"
      heroGradient={{ from: 'from-emerald-500/20', via: 'via-green-500/20', to: 'to-primary/20' }}
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск магазинов...' : 'Search stores...'}
      
      categories={MARKET_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
      isLoading={isLoading}
      isEmpty={filteredStores.length === 0}
      emptyIcon={ShoppingBag}
      emptyText={language === 'ru' ? 'Магазины не найдены' : 'No stores found'}
      
      showCartButton
      cartItemCount={cartItemCount}
      
      filterButton={
        <UniversalFilter
          config={marketFilterConfig}
          values={filterValues}
          onChange={setFilterValues}
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
      
      resultsCount={filteredStores.length}
      resultsLabel={language === 'ru' ? 'Магазины' : 'Stores'}
    >
      <ActiveFilters
        config={marketFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      <div className="space-y-3">
        {filteredStores.map((store) => (
          <ItemCard
            key={store.id}
            title={language === 'ru' ? store.name_ru : store.name_en}
            image={store.cover_image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800'}
            rating={store.rating}
            reviewCount={store.review_count}
            location={store.address ?? undefined}
            meta={[
              { icon: Clock, value: `30-60 ${language === 'ru' ? 'мин' : 'min'}` },
              { icon: Truck, value: store.delivery_fee === 0 
                ? (language === 'ru' ? 'Бесплатно' : 'Free') 
                : `฿${store.delivery_fee}` },
            ]}
            isVerified={store.is_verified}
            isAvailable={store.delivery_available}
            onClick={() => navigate(`/market/store/${store.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
};

export default MarketIndex;
