import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Star, MapPin, Clock, Flower2, Heart, Gift, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';

const categories = [
  { id: 'bouquets', icon: Flower2, labelEn: 'Bouquets', labelRu: 'Букеты' },
  { id: 'roses', icon: Heart, labelEn: 'Roses', labelRu: 'Розы' },
  { id: 'gifts', icon: Gift, labelEn: 'Gift Sets', labelRu: 'Подарки' },
  { id: 'wedding', icon: Sparkles, labelEn: 'Wedding', labelRu: 'Свадебные' },
];

const flowerShops = [
  {
    id: 'shop-1',
    name: 'Phuket Flowers',
    nameRu: 'Цветы Пхукета',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600',
    rating: 4.9,
    reviewCount: 234,
    location: 'Patong Beach',
    locationRu: 'Патонг Бич',
    priceFrom: 500,
    deliveryTime: '1-2 hours',
    deliveryTimeRu: '1-2 часа',
    isVerified: true,
    tags: ['Delivery', 'Fresh Flowers', 'Gift Wrap'],
    tagsRu: ['Доставка', 'Свежие цветы', 'Упаковка'],
  },
  {
    id: 'shop-2',
    name: 'Orchid Paradise',
    nameRu: 'Орхидея Рай',
    image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600',
    rating: 4.8,
    reviewCount: 189,
    location: 'Kata Beach',
    locationRu: 'Ката Бич',
    priceFrom: 800,
    deliveryTime: '2-3 hours',
    deliveryTimeRu: '2-3 часа',
    isVerified: true,
    isNew: true,
    tags: ['Exotic', 'Orchids', 'Premium'],
    tagsRu: ['Экзотика', 'Орхидеи', 'Премиум'],
  },
  {
    id: 'shop-3',
    name: 'Rose Garden Studio',
    nameRu: 'Студия Розовый Сад',
    image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600',
    rating: 4.7,
    reviewCount: 156,
    location: 'Rawai',
    locationRu: 'Равай',
    priceFrom: 600,
    deliveryTime: '1-3 hours',
    deliveryTimeRu: '1-3 часа',
    isVerified: false,
    tags: ['Roses', 'Wedding', 'Events'],
    tagsRu: ['Розы', 'Свадьбы', 'Мероприятия'],
  },
  {
    id: 'shop-4',
    name: 'Tropical Blooms',
    nameRu: 'Тропические Цветы',
    image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600',
    rating: 4.6,
    reviewCount: 98,
    location: 'Phuket Town',
    locationRu: 'Пхукет Таун',
    priceFrom: 450,
    deliveryTime: '2-4 hours',
    deliveryTimeRu: '2-4 часа',
    isVerified: true,
    tags: ['Budget', 'Local', 'Fast Delivery'],
    tagsRu: ['Бюджетно', 'Местное', 'Быстрая доставка'],
  },
];

const FlowersIndex = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredShops = flowerShops.filter((shop) => {
    const name = language === 'ru' ? shop.nameRu : shop.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold">
                {language === 'ru' ? 'Цветы' : 'Flowers'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Букеты и доставка' : 'Bouquets & Delivery'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={language === 'ru' ? 'Поиск цветочных магазинов...' : 'Search flower shops...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    setSelectedCategory(isSelected ? null : cat.id);
                  }}
                  className={cn(
                    "relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all active:scale-95",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {language === 'ru' ? cat.labelRu : cat.labelEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Flower Shops */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {language === 'ru' ? 'Цветочные магазины' : 'Flower Shops'}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    navigate(`/flowers/shop/${shop.id}`);
                  }}
                  className="relative overflow-hidden flex gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {/* Image */}
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={shop.image}
                      alt={language === 'ru' ? shop.nameRu : shop.name}
                      className="w-full h-full object-cover"
                    />
                    {shop.isNew && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary text-primary-foreground">
                        {language === 'ru' ? 'Новый' : 'New'}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">
                        {language === 'ru' ? shop.nameRu : shop.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="text-sm font-medium">{shop.rating}</span>
                        <span className="text-xs text-muted-foreground">({shop.reviewCount})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{language === 'ru' ? shop.locationRu : shop.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{language === 'ru' ? shop.deliveryTimeRu : shop.deliveryTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-primary font-semibold">
                        ฿{shop.priceFrom.toLocaleString()}+
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {language === 'ru' ? 'от' : 'from'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(language === 'ru' ? shop.tagsRu : shop.tags).slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FlowersIndex;