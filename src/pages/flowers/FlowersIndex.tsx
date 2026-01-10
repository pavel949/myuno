import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterChip, FilterChipGroup } from '@/components/uno/FilterChip';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { toast } from 'sonner';
import { BackButton } from '@/components/uno/BackButton';

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

// Seed data: 15 bouquets
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
    description: 'A stunning arrangement of 25 premium red roses, perfect for expressing love and passion.',
    descriptionRu: 'Великолепная композиция из 25 премиальных красных роз, идеально для выражения любви и страсти.',
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
    description: 'Luxurious bouquet of 15 fresh pink peonies with delicate fragrance.',
    descriptionRu: 'Роскошный букет из 15 свежих розовых пионов с нежным ароматом.',
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
    description: 'Vibrant mix of seasonal spring flowers in cheerful colors.',
    descriptionRu: 'Яркий микс сезонных весенних цветов в жизнерадостных тонах.',
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
    description: 'Elegant arrangement of 7 white phalaenopsis orchids in a ceramic pot.',
    descriptionRu: 'Элегантная композиция из 7 белых орхидей фаленопсис в керамическом горшке.',
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
    description: 'Cheerful bouquet of 21 yellow tulips to brighten any day.',
    descriptionRu: 'Жизнерадостный букет из 21 желтого тюльпана для хорошего настроения.',
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
    description: '51 premium roses in an elegant gift box with satin ribbon.',
    descriptionRu: '51 премиальная роза в элегантной подарочной коробке с атласной лентой.',
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
    description: 'Delicate arrangement in soft pastel shades of pink, cream and lavender.',
    descriptionRu: 'Нежная композиция в мягких пастельных тонах розового, кремового и лавандового.',
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
    description: 'Timeless combination of red and white roses for any special occasion.',
    descriptionRu: 'Вечная классика из красных и белых роз для любого особого случая.',
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
    description: 'Beautiful purple tulips that bring a touch of spring to any room.',
    descriptionRu: 'Красивые фиолетовые тюльпаны, которые привнесут весну в любую комнату.',
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
    description: 'Exotic tropical flowers including birds of paradise and anthurium.',
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
    description: 'A single premium long-stem rose, elegantly wrapped.',
    descriptionRu: 'Одна премиальная длинноствольная роза в элегантной упаковке.',
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
    description: 'Our most luxurious peony arrangement with 25 premium blooms.',
    descriptionRu: 'Наша самая роскошная композиция из 25 премиальных пионов.',
  },
  {
    id: 'bouquet-13',
    name: 'Garden Fresh Mix',
    nameRu: 'Свежий садовый микс',
    image: 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=600',
    price: 1400,
    rating: 4.6,
    reviewCount: 178,
    category: 'mixed',
    tags: ['Natural', 'Rustic'],
    tagsRu: ['Натуральный', 'Рустик'],
    flowersCount: 28,
    description: 'Freshly picked garden flowers with a natural, rustic charm.',
    descriptionRu: 'Только что собранные садовые цветы с натуральным деревенским шармом.',
  },
  {
    id: 'bouquet-14',
    name: 'Champagne Roses',
    nameRu: 'Шампанские розы',
    image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600',
    price: 2300,
    rating: 4.9,
    reviewCount: 92,
    category: 'roses',
    tags: ['Elegant', 'Wedding'],
    tagsRu: ['Элегантный', 'Свадебный'],
    flowersCount: 31,
    description: '31 champagne-colored roses for an elegant and sophisticated gift.',
    descriptionRu: '31 роза цвета шампань для элегантного и изысканного подарка.',
  },
  {
    id: 'bouquet-15',
    name: 'Mini Orchid Pot',
    nameRu: 'Мини орхидея в горшке',
    image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600',
    price: 1900,
    rating: 4.7,
    reviewCount: 134,
    category: 'orchids',
    tags: ['Long-lasting', 'Gift'],
    tagsRu: ['Долговечный', 'Подарок'],
    flowersCount: 3,
    description: 'A mini orchid plant that lasts for months with minimal care.',
    descriptionRu: 'Мини-орхидея в горшке, которая цветет месяцами при минимальном уходе.',
  },
];

const FlowersIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedPrice, setSelectedPrice] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = flowersInCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredBouquets = bouquets.filter((bouquet) => {
    if (selectedCategory !== 'all' && bouquet.category !== selectedCategory) {
      return false;
    }
    
    const priceFilter = priceFilters.find(p => p.id === selectedPrice);
    if (priceFilter) {
      if (priceFilter.min && bouquet.price < priceFilter.min) return false;
      if (priceFilter.max && bouquet.price > priceFilter.max) return false;
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
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <BackButton fallbackPath="/" />
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold">
                {language === 'ru' ? 'Букеты' : 'Bouquets'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? `${bouquets.length} вариантов` : `${bouquets.length} options`}
              </p>
            </div>
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
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ru' ? 'Поиск букетов...' : 'Search bouquets...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Category Filters */}
          <FilterChipGroup scrollable>
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

          {/* Price Filters */}
          <FilterChipGroup scrollable>
            {priceFilters.map((price) => (
              <FilterChip
                key={price.id}
                label={language === 'ru' ? price.labelRu : price.labelEn}
                isActive={selectedPrice === price.id}
                size="sm"
                onToggle={() => setSelectedPrice(price.id)}
              />
            ))}
          </FilterChipGroup>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
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
                  {/* Image - clickable for details */}
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
                    
                    {/* Discount badge */}
                    {bouquet.originalPrice && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-destructive text-destructive-foreground">
                        -{Math.round((1 - bouquet.price / bouquet.originalPrice) * 100)}%
                      </span>
                    )}
                    
                    {/* Favorite button */}
                    <button 
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle favorite
                      }}
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
                      
                      {/* Add to cart button */}
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
        </div>

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
      </div>
    </AppLayout>
  );
};

export default FlowersIndex;
