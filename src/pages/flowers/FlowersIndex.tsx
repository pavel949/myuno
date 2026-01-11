import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Plus, Minus, Flower } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { triggerRipple } from '@/hooks/useRipple';
import { toast } from 'sonner';
import { MiniAppHero, MiniAppSearch } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, flowerFilterConfig, FilterValues } from '@/components/filters';

const categories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'roses', labelEn: 'Roses', labelRu: 'Розы' },
  { id: 'mixed', labelEn: 'Mixed', labelRu: 'Микс' },
  { id: 'tulips', labelEn: 'Tulips', labelRu: 'Тюльпаны' },
  { id: 'peonies', labelEn: 'Peonies', labelRu: 'Пионы' },
  { id: 'orchids', labelEn: 'Orchids', labelRu: 'Орхидеи' },
  { id: 'premium', labelEn: 'Premium', labelRu: 'Премиум' },
];

const priceFilters = [
  { id: 'all', labelEn: 'Any price', labelRu: 'Любая цена' },
  { id: 'budget', labelEn: 'Up to ฿1,500', labelRu: 'До ฿1,500', max: 1500 },
  { id: 'mid', labelEn: '฿1,500 - ฿3,000', labelRu: '฿1,500 - ฿3,000', min: 1500, max: 3000 },
  { id: 'premium', labelEn: '฿3,000+', labelRu: '฿3,000+', min: 3000 },
];

export const bouquets = [
  {
    id: 'bouquet-1',
    name: 'Romantic Red Roses',
    nameRu: 'Романтические красные розы',
    image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=600',
    price: 1800,
    originalPrice: 2200,
    rating: 4.9,
    reviewCount: 156,
    category: 'roses',
    tags: ['Bestseller', 'Romantic'],
    tagsRu: ['Хит продаж', 'Романтика'],
    flowersCount: 25,
    description: 'A stunning arrangement of 25 premium red roses.',
    descriptionRu: 'Великолепная композиция из 25 премиальных красных роз.',
  },
  {
    id: 'bouquet-2',
    name: 'Gentle Pink Peonies',
    nameRu: 'Нежные розовые пионы',
    image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=600',
    price: 2500,
    rating: 4.8,
    reviewCount: 98,
    category: 'peonies',
    tags: ['Seasonal', 'Premium'],
    tagsRu: ['Сезонные', 'Премиум'],
    flowersCount: 15,
    description: 'Luxurious bouquet of 15 fresh pink peonies.',
    descriptionRu: 'Роскошный букет из 15 свежих розовых пионов.',
  },
  {
    id: 'bouquet-3',
    name: 'Spring Mix',
    nameRu: 'Весенний микс',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600',
    price: 1200,
    rating: 4.7,
    reviewCount: 234,
    category: 'mixed',
    tags: ['Popular', 'Colorful'],
    tagsRu: ['Популярный', 'Яркий'],
    flowersCount: 30,
    description: 'Vibrant mix of seasonal spring flowers.',
    descriptionRu: 'Яркий микс сезонных весенних цветов.',
  },
  {
    id: 'bouquet-4',
    name: 'White Orchid Elegance',
    nameRu: 'Белые орхидеи элегант',
    image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600',
    price: 3500,
    rating: 4.9,
    reviewCount: 67,
    category: 'orchids',
    tags: ['Premium', 'Exotic'],
    tagsRu: ['Премиум', 'Экзотика'],
    flowersCount: 7,
    description: 'Elegant arrangement of 7 white phalaenopsis orchids.',
    descriptionRu: 'Элегантная композиция из 7 белых орхидей.',
  },
  {
    id: 'bouquet-5',
    name: 'Sunny Tulips',
    nameRu: 'Солнечные тюльпаны',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600',
    price: 950,
    rating: 4.6,
    reviewCount: 189,
    category: 'tulips',
    tags: ['Budget', 'Fresh'],
    tagsRu: ['Бюджетный', 'Свежие'],
    flowersCount: 21,
    description: 'Cheerful bouquet of 21 yellow tulips.',
    descriptionRu: 'Жизнерадостный букет из 21 желтого тюльпана.',
  },
  {
    id: 'bouquet-6',
    name: 'Luxury Rose Box',
    nameRu: 'Люкс розы в коробке',
    image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600',
    price: 4500,
    originalPrice: 5000,
    rating: 5.0,
    reviewCount: 45,
    category: 'premium',
    tags: ['Gift Box', 'VIP'],
    tagsRu: ['Подарочная коробка', 'VIP'],
    flowersCount: 51,
    description: '51 premium roses in an elegant gift box.',
    descriptionRu: '51 премиальная роза в элегантной подарочной коробке.',
  },
  {
    id: 'bouquet-7',
    name: 'Pastel Dreams',
    nameRu: 'Пастельные мечты',
    image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600',
    price: 1650,
    rating: 4.7,
    reviewCount: 123,
    category: 'mixed',
    tags: ['Tender', 'Elegant'],
    tagsRu: ['Нежный', 'Элегантный'],
    flowersCount: 25,
    description: 'Delicate arrangement in soft pastel shades.',
    descriptionRu: 'Нежная композиция в мягких пастельных тонах.',
  },
  {
    id: 'bouquet-8',
    name: 'Red & White Classic',
    nameRu: 'Красно-белая классика',
    image: 'https://images.unsplash.com/photo-1522057384400-681b421cfebc?w=600',
    price: 2100,
    rating: 4.8,
    reviewCount: 87,
    category: 'roses',
    tags: ['Classic', 'Wedding'],
    tagsRu: ['Классика', 'Свадебный'],
    flowersCount: 35,
    description: 'Timeless combination of red and white roses.',
    descriptionRu: 'Вечная классика из красных и белых роз.',
  },
  {
    id: 'bouquet-9',
    name: 'Purple Tulip Garden',
    nameRu: 'Сад фиолетовых тюльпанов',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600',
    price: 1100,
    rating: 4.5,
    reviewCount: 145,
    category: 'tulips',
    tags: ['Bright', 'Spring'],
    tagsRu: ['Яркий', 'Весенний'],
    flowersCount: 19,
    description: 'Beautiful purple tulips for spring.',
    descriptionRu: 'Красивые фиолетовые тюльпаны для весеннего настроения.',
  },
  {
    id: 'bouquet-10',
    name: 'Tropical Paradise',
    nameRu: 'Тропический рай',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600',
    price: 2800,
    rating: 4.8,
    reviewCount: 56,
    category: 'mixed',
    tags: ['Exotic', 'Unique'],
    tagsRu: ['Экзотика', 'Уникальный'],
    flowersCount: 20,
    description: 'Exotic tropical flowers including birds of paradise.',
    descriptionRu: 'Экзотические тропические цветы: стрелиция и антуриум.',
  },
  {
    id: 'bouquet-11',
    name: 'Single Stem Rose',
    nameRu: 'Одна роза',
    image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=600',
    price: 350,
    rating: 4.4,
    reviewCount: 312,
    category: 'roses',
    tags: ['Budget', 'Express'],
    tagsRu: ['Бюджетный', 'Экспресс'],
    flowersCount: 1,
    description: 'A single premium long-stem rose.',
    descriptionRu: 'Одна премиальная длинноствольная роза.',
  },
  {
    id: 'bouquet-12',
    name: 'Royal Peony Collection',
    nameRu: 'Королевская коллекция пионов',
    image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=600',
    price: 5500,
    rating: 5.0,
    reviewCount: 28,
    category: 'premium',
    tags: ['Exclusive', 'Limited'],
    tagsRu: ['Эксклюзив', 'Лимитированный'],
    flowersCount: 25,
    description: 'Our most luxurious peony arrangement.',
    descriptionRu: 'Наша самая роскошная композиция из пионов.',
  },
];

const FlowersIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({
    priceLevel: null,
    occasion: [],
    flowerType: [],
    color: [],
    features: [],
    delivery: [],
  });

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

  const handleClearAllFilters = () => {
    setFilterValues({
      priceLevel: null, occasion: [], flowerType: [], color: [], features: [], delivery: [],
    });
  };

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = flowersInCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredBouquets = bouquets.filter((bouquet) => {
    if (selectedCategory !== 'all' && bouquet.category !== selectedCategory) return false;
    
    const priceLevel = filterValues.priceLevel as string | null;
    if (priceLevel) {
      const level = parseInt(priceLevel);
      const priceRanges: Record<number, { min: number; max: number }> = {
        1: { min: 0, max: 1000 }, 2: { min: 1000, max: 2500 },
        3: { min: 2500, max: 4000 }, 4: { min: 4000, max: Infinity },
      };
      const range = priceRanges[level];
      if (range && (bouquet.price < range.min || bouquet.price > range.max)) return false;
    }
    
    if (searchQuery) {
      const name = language === 'ru' ? bouquet.nameRu : bouquet.name;
      if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    
    return true;
  });

  const addToCart = (bouquet: typeof bouquets[0]) => {
    addItem({
      id: `bouquet-${bouquet.id}`,
      type: 'flowers',
      name: bouquet.name,
      nameRu: bouquet.nameRu,
      price: bouquet.price,
      currency: '฿',
      image: bouquet.image,
      providerId: 'flowers-shop',
      providerName: 'Phuket Flowers',
      providerNameRu: 'Цветы Пхукета',
    });
    toast.success(language === 'ru' ? 'Добавлено в корзину' : 'Added to cart');
  };

  const removeFromCart = (bouquetId: string) => {
    const cartItemId = `bouquet-${bouquetId}`;
    const cartItem = items.find(i => i.id === cartItemId);
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(cartItemId, cartItem.quantity - 1);
    } else {
      removeItem(cartItemId);
    }
  };

  const getQuantity = (bouquetId: string) => {
    const cartItemId = `bouquet-${bouquetId}`;
    return items.find(i => i.id === cartItemId)?.quantity || 0;
  };

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer className="pb-24">
        <PageHeader
          title={language === 'ru' ? 'Букеты' : 'Bouquets'}
          showBack
          fallbackPath="/"
          subtitle={language === 'ru' ? `${bouquets.length} вариантов` : `${bouquets.length} options`}
          actions={
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/cart')}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          }
        />

        {/* Hero Section */}
        <MiniAppHero
          icon={Flower}
          title={language === 'ru' ? 'Доставка цветов' : 'Flower Delivery'}
          subtitle={language === 'ru' 
            ? 'Свежие букеты с доставкой за 2 часа' 
            : 'Fresh bouquets delivered in 2 hours'}
          backgroundImage="https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800"
          gradientFrom="from-pink-500/20"
          gradientVia="via-rose-500/20"
          gradientTo="to-primary/20"
          className="mt-4 mb-4"
        />

        {/* Search */}
        <MiniAppSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={language === 'ru' ? 'Поиск букетов...' : 'Search bouquets...'}
          className="mb-4"
        />

        {/* Category Filters + Universal Filter */}
        <div className="flex items-center gap-2 mb-4">
          <FilterChipGroup scrollable className="flex-1">
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={language === 'ru' ? cat.labelRu : cat.labelEn}
                isActive={selectedCategory === cat.id}
                size="sm"
                onToggle={() => setSelectedCategory(cat.id)}
              />
            ))}
          </FilterChipGroup>
          
          <UniversalFilter
            config={flowerFilterConfig}
            values={filterValues}
            onChange={setFilterValues}
            activeCount={activeFilterCount}
          />
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <ActiveFilters
            config={flowerFilterConfig}
            values={filterValues}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            className="mb-4"
          />
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {language === 'ru' 
            ? `Найдено: ${filteredBouquets.length}` 
            : `Found: ${filteredBouquets.length}`}
        </p>

        {/* Bouquets Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredBouquets.map((bouquet) => {
            const quantity = getQuantity(bouquet.id);
            return (
              <div
                key={bouquet.id}
                className="relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                {/* Image */}
                <div 
                  className="relative aspect-square overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    triggerRipple(e);
                    navigate(`/flowers/bouquet/${bouquet.id}`);
                  }}
                >
                  <img
                    src={bouquet.image}
                    alt={language === 'ru' ? bouquet.nameRu : bouquet.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  
                  {bouquet.originalPrice && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-destructive text-destructive-foreground">
                      -{Math.round((1 - bouquet.price / bouquet.originalPrice) * 100)}%
                    </span>
                  )}
                  
                  <button 
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-2.5">
                  <h3 
                    className="font-medium text-sm line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/flowers/bouquet/${bouquet.id}`)}
                  >
                    {language === 'ru' ? bouquet.nameRu : bouquet.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-xs font-medium">{bouquet.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({bouquet.reviewCount})</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-base font-bold text-primary">
                        ฿{bouquet.price.toLocaleString()}
                      </span>
                      {bouquet.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through ml-1">
                          ฿{bouquet.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {quantity === 0 ? (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerRipple(e);
                          addToCart(bouquet);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerRipple(e);
                            removeFromCart(bouquet.id);
                          }}
                          className="h-7 w-7"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-5 text-center font-medium text-sm">{quantity}</span>
                        <Button
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerRipple(e);
                            addToCart(bouquet);
                          }}
                          className="h-7 w-7"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {(language === 'ru' ? bouquet.tagsRu : bouquet.tags).slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 text-[10px] rounded-full bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>

      {/* Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <Button
            onClick={() => navigate('/cart')}
            className="w-full h-12 relative overflow-hidden"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span>{language === 'ru' ? 'Оформить заказ' : 'Checkout'}</span>
            <span className="ml-auto font-bold">฿{totalPrice.toLocaleString()}</span>
          </Button>
        </div>
      )}
    </AppLayout>
  );
};

export default FlowersIndex;
