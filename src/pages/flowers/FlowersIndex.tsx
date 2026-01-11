import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower, Heart, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, flowerFilterConfig, FilterValues } from '@/components/filters';
import { toast } from 'sonner';

const FLOWER_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'roses', labelEn: 'Roses', labelRu: 'Розы', icon: '🌹' },
  { id: 'mixed', labelEn: 'Mixed', labelRu: 'Микс', icon: '💐' },
  { id: 'tulips', labelEn: 'Tulips', labelRu: 'Тюльпаны', icon: '🌷' },
  { id: 'peonies', labelEn: 'Peonies', labelRu: 'Пионы', icon: '🌸' },
  { id: 'orchids', labelEn: 'Orchids', labelRu: 'Орхидеи', icon: '🪻' },
  { id: 'premium', labelEn: 'Premium', labelRu: 'Премиум', icon: '✨' },
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
];

const FlowersIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, items, getItemsByType } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

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
      if (selectedCategory !== 'all' && bouquet.category !== selectedCategory) return false;
      
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
      
      if (searchQuery) {
        const name = language === 'ru' ? bouquet.nameRu : bouquet.name;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
      heroBackgroundImage="https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800"
      heroGradientFrom="from-pink-500/20"
      heroGradientVia="via-rose-500/20"
      heroGradientTo="to-primary/20"
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск букетов...' : 'Search bouquets...'}
      
      categories={FLOWER_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
      showCartButton
      cartItemCount={totalItems}
      
      filterButton={
        <UniversalFilter
          config={flowerFilterConfig}
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
          config={flowerFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={() => setFilterValues({})}
          className="mb-4"
        />
      )}

      {/* Bouquets Grid - Vertical cards for flowers */}
      <div className="grid grid-cols-2 gap-3">
        {filteredBouquets.map((bouquet) => (
          <ItemCard
            key={bouquet.id}
            id={bouquet.id}
            title={language === 'ru' ? bouquet.nameRu : bouquet.name}
            image={bouquet.image}
            price={bouquet.price}
            originalPrice={bouquet.originalPrice}
            rating={bouquet.rating}
            reviewCount={bouquet.reviewCount}
            tags={language === 'ru' ? bouquet.tagsRu : bouquet.tags}
            variant="vertical"
            onClick={() => navigate(`/flowers/bouquet/${bouquet.id}`)}
          />
        ))}
      </div>

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
