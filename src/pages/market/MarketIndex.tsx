import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Apple, Gem, Palette, Gift, Shirt, Sparkles, Wine, Cookie,
  Star, MapPin, Clock, Truck, SlidersHorizontal
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { marketFilterConfig } from '@/components/filters/MarketFilters';

const MARKET_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🛒' },
  { id: 'grocery', labelEn: 'Grocery', labelRu: 'Продукты', icon: '🍎' },
  { id: 'souvenirs', labelEn: 'Souvenirs', labelRu: 'Сувениры', icon: '🎁' },
  { id: 'cosmetics', labelEn: 'Cosmetics', labelRu: 'Косметика', icon: '✨' },
  { id: 'jewelry', labelEn: 'Jewelry', labelRu: 'Украшения', icon: '💎' },
  { id: 'decor', labelEn: 'Decor', labelRu: 'Декор', icon: '🎨' },
  { id: 'clothing', labelEn: 'Clothing', labelRu: 'Одежда', icon: '👔' },
];

export const stores = [
  {
    id: 'villa-market',
    nameEn: 'Villa Market',
    nameRu: 'Вилла Маркет',
    category: 'grocery',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
    rating: 4.8,
    reviewCount: 324,
    address: 'Central Festival, Phuket',
    addressRu: 'Сентрал Фестиваль, Пхукет',
    deliveryTime: '30-45',
    deliveryFee: 50,
    minOrder: 300,
    isOpen: true,
    tags: ['imported', 'organic', 'premium'],
    tagsRu: ['импорт', 'органик', 'премиум'],
  },
  {
    id: 'makro',
    nameEn: 'Makro',
    nameRu: 'Макро',
    category: 'grocery',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    rating: 4.5,
    reviewCount: 567,
    address: 'Phuket Town',
    addressRu: 'Пхукет Таун',
    deliveryTime: '45-60',
    deliveryFee: 40,
    minOrder: 500,
    isOpen: true,
    tags: ['wholesale', 'bulk'],
    tagsRu: ['оптом', 'большие объемы'],
  },
  {
    id: 'thai-souvenirs',
    nameEn: 'Thai Treasures',
    nameRu: 'Тайские Сокровища',
    category: 'souvenirs',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
    rating: 4.7,
    reviewCount: 234,
    address: 'Old Phuket Town',
    addressRu: 'Старый Пхукет',
    deliveryTime: '60-90',
    deliveryFee: 60,
    minOrder: 200,
    isOpen: true,
    tags: ['handmade', 'authentic'],
    tagsRu: ['ручная работа', 'аутентичный'],
  },
  {
    id: 'pearl-gallery',
    nameEn: 'Pearl Gallery',
    nameRu: 'Галерея Жемчуга',
    category: 'jewelry',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    rating: 4.9,
    reviewCount: 156,
    address: 'Patong Beach',
    addressRu: 'Пляж Патонг',
    deliveryTime: '60-90',
    deliveryFee: 0,
    minOrder: 1000,
    isOpen: true,
    tags: ['luxury', 'certified'],
    tagsRu: ['люкс', 'сертифицировано'],
    isFeatured: true,
  },
  {
    id: 'thai-cosmetics',
    nameEn: 'Beauty Island',
    nameRu: 'Бьюти Айленд',
    category: 'cosmetics',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    rating: 4.6,
    reviewCount: 412,
    address: 'Jungceylon Mall',
    addressRu: 'ТЦ Джанг Цейлон',
    deliveryTime: '45-60',
    deliveryFee: 50,
    minOrder: 300,
    isOpen: true,
    tags: ['natural', 'thai-herbs'],
    tagsRu: ['натуральное', 'тайские травы'],
  },
  {
    id: 'home-decor',
    nameEn: 'Bali Home',
    nameRu: 'Бали Хоум',
    category: 'decor',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    rating: 4.7,
    reviewCount: 189,
    address: 'Cherng Talay',
    addressRu: 'Черенг Талай',
    deliveryTime: '90-120',
    deliveryFee: 100,
    minOrder: 500,
    isOpen: true,
    tags: ['handcrafted', 'unique'],
    tagsRu: ['ручная работа', 'уникальный'],
  },
  {
    id: 'thai-silk',
    nameEn: 'Thai Silk House',
    nameRu: 'Дом Тайского Шёлка',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
    rating: 4.8,
    reviewCount: 278,
    address: 'Kata Beach',
    addressRu: 'Пляж Ката',
    deliveryTime: '60-90',
    deliveryFee: 50,
    minOrder: 400,
    isOpen: true,
    tags: ['premium', 'authentic'],
    tagsRu: ['премиум', 'аутентичный'],
  },
];

const MarketIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { items } = useCart();
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
    return stores.filter(store => {
      const matchesCategory = selectedCategory === 'all' || store.category === selectedCategory;
      
      const name = language === 'ru' ? store.nameRu : store.nameEn;
      const matchesSearch = searchQuery === '' || 
        name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Delivery filter
      const deliveryFilters = filterValues.delivery as string[] || [];
      if (deliveryFilters.includes('free-delivery') && store.deliveryFee !== 0) {
        return false;
      }
      if (deliveryFilters.includes('express') && parseInt(store.deliveryTime.split('-')[0]) > 45) {
        return false;
      }
      
      return matchesCategory && matchesSearch;
    });
  }, [stores, selectedCategory, searchQuery, filterValues, language]);

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Магазин' : 'Market'}
      subtitle={language === 'ru' ? `${filteredStores.length} магазинов` : `${filteredStores.length} stores`}
      fallbackPath="/"
      
      heroIcon={ShoppingBag}
      heroTitle={language === 'ru' ? 'Магазины Пхукета' : 'Phuket Stores'}
      heroSubtitle={language === 'ru' ? 'Доставка продуктов, сувениров и подарков' : 'Groceries, souvenirs and gifts delivery'}
      heroBackgroundImage="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800"
      heroGradientFrom="from-emerald-500/20"
      heroGradientVia="via-green-500/20"
      heroGradientTo="to-primary/20"
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск магазинов...' : 'Search stores...'}
      
      categories={MARKET_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
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
      {/* Active Filters */}
      <ActiveFilters
        config={marketFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      {/* Stores Grid */}
      <div className="space-y-3">
        {filteredStores.map((store) => (
          <ItemCard
            key={store.id}
            title={language === 'ru' ? store.nameRu : store.nameEn}
            image={store.image}
            rating={store.rating}
            reviewCount={store.reviewCount}
            location={language === 'ru' ? store.addressRu : store.address}
            meta={[
              { icon: Clock, value: `${store.deliveryTime} ${language === 'ru' ? 'мин' : 'min'}` },
              { icon: Truck, value: store.deliveryFee === 0 
                ? (language === 'ru' ? 'Бесплатно' : 'Free') 
                : `฿${store.deliveryFee}` },
            ]}
            tags={language === 'ru' ? store.tagsRu : store.tags}
            isFeatured={store.isFeatured}
            isAvailable={store.isOpen}
            onClick={() => navigate(`/market/store/${store.id}`)}
          />
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Магазины не найдены' : 'No stores found'}
          </p>
        </div>
      )}
    </MiniAppLayout>
  );
};

export default MarketIndex;
