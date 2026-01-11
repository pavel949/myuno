import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  Apple, 
  Gem, 
  Palette, 
  Gift, 
  Shirt,
  Sparkles,
  Wine,
  Cookie,
  Star,
  MapPin,
  Clock,
  Truck,
  Filter
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/uno/BackButton';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { UniversalFilter, ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { marketFilterConfig } from '@/components/filters/MarketFilters';

const categories = [
  { id: 'all', icon: ShoppingBag, labelEn: 'All', labelRu: 'Все' },
  { id: 'grocery', icon: Apple, labelEn: 'Grocery', labelRu: 'Продукты' },
  { id: 'souvenirs', icon: Gift, labelEn: 'Souvenirs', labelRu: 'Сувениры' },
  { id: 'cosmetics', icon: Sparkles, labelEn: 'Cosmetics', labelRu: 'Косметика' },
  { id: 'jewelry', icon: Gem, labelEn: 'Jewelry', labelRu: 'Украшения' },
  { id: 'decor', icon: Palette, labelEn: 'Decor', labelRu: 'Декор' },
  { id: 'clothing', icon: Shirt, labelEn: 'Clothing', labelRu: 'Одежда' },
  { id: 'alcohol', icon: Wine, labelEn: 'Alcohol', labelRu: 'Алкоголь' },
  { id: 'sweets', icon: Cookie, labelEn: 'Sweets', labelRu: 'Сладости' },
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
  },
  {
    id: 'wine-cellar',
    nameEn: 'Wine Connection',
    nameRu: 'Вайн Коннекшн',
    category: 'alcohol',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
    rating: 4.6,
    reviewCount: 345,
    address: 'Boat Avenue',
    addressRu: 'Боат Авеню',
    deliveryTime: '45-60',
    deliveryFee: 0,
    minOrder: 1000,
    isOpen: true,
    tags: ['imported', 'premium'],
  },
  {
    id: 'thai-sweets',
    nameEn: 'Sweet Thai',
    nameRu: 'Свит Тай',
    category: 'sweets',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
    rating: 4.7,
    reviewCount: 234,
    address: 'Central Floresta',
    addressRu: 'Сентрал Флореста',
    deliveryTime: '30-45',
    deliveryFee: 40,
    minOrder: 150,
    isOpen: true,
    tags: ['traditional', 'fresh'],
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

  const handleClearAllFilters = () => setFilterValues({});

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesCategory = selectedCategory === 'all' || store.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        store.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.nameRu.toLowerCase().includes(searchQuery.toLowerCase());
      
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
  }, [stores, selectedCategory, searchQuery, filterValues]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <BackButton fallbackPath="/" />
          <h1 className="text-lg font-semibold">
            {language === 'ru' ? 'Магазин' : 'Market'}
          </h1>
          <div className="flex items-center gap-2">
            <UniversalFilter
              config={marketFilterConfig}
              values={filterValues}
              onChange={setFilterValues}
              language={language as 'en' | 'ru'}
            >
              <Button variant="ghost" size="icon" className="relative">
                <Filter className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </UniversalFilter>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск магазинов...' : 'Search stores...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Active Filters */}
        <ActiveFilters
          config={marketFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          language={language as 'en' | 'ru'}
        />

        {/* Categories */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    setSelectedCategory(cat.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                    "border text-sm font-medium",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {language === 'ru' ? cat.labelRu : cat.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stores Grid */}
        <div className="space-y-3">
          {filteredStores.map((store) => (
            <button
              key={store.id}
              onClick={(e) => {
                triggerRipple(e);
                navigate(`/market/store/${store.id}`);
              }}
              className="w-full bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all text-left"
            >
              <div className="flex">
                <div className="w-28 h-28 flex-shrink-0">
                  <img
                    src={store.image}
                    alt={language === 'ru' ? store.nameRu : store.nameEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1">
                        {language === 'ru' ? store.nameRu : store.nameEn}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-medium">{store.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">
                        {language === 'ru' ? store.addressRu : store.address}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{store.deliveryTime} {language === 'ru' ? 'мин' : 'min'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Truck className="w-3 h-3 text-muted-foreground" />
                      <span className={store.deliveryFee === 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                        {store.deliveryFee === 0 
                          ? (language === 'ru' ? 'Бесплатно' : 'Free') 
                          : `฿${store.deliveryFee}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {store.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </button>
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
      </div>
    </AppLayout>
  );
};

export default MarketIndex;
