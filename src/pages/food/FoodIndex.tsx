import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UtensilsCrossed, Clock, Star, MapPin, Bike, ArrowRight, Flame } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';

// Demo restaurants data
const demoRestaurants = [
  {
    id: 'rest-1',
    nameEn: 'Thai Orchid Kitchen',
    nameRu: 'Тайская Орхидея',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    rating: 4.8,
    reviewCount: 234,
    cuisine: 'Thai',
    cuisineRu: 'Тайская',
    location: 'Patong',
    locationRu: 'Патонг',
    deliveryTime: '25-35',
    deliveryFee: 40,
    minOrder: 200,
    isOpen: true,
    isFeatured: true,
    isNew: false,
    priceLevel: 2,
    tags: ['Thai', 'Seafood', 'Spicy'],
  },
  {
    id: 'rest-2',
    nameEn: 'Sushi Master',
    nameRu: 'Суши Мастер',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600',
    rating: 4.9,
    reviewCount: 189,
    cuisine: 'Japanese',
    cuisineRu: 'Японская',
    location: 'Kata',
    locationRu: 'Ката',
    deliveryTime: '30-40',
    deliveryFee: 50,
    minOrder: 300,
    isOpen: true,
    isFeatured: true,
    priceLevel: 3,
    tags: ['Japanese', 'Sushi', 'Fresh'],
  },
  {
    id: 'rest-3',
    nameEn: 'Pizza Paradise',
    nameRu: 'Пицца Парадайз',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    rating: 4.6,
    reviewCount: 456,
    cuisine: 'Italian',
    cuisineRu: 'Итальянская',
    location: 'Rawai',
    locationRu: 'Равай',
    deliveryTime: '20-30',
    deliveryFee: 30,
    minOrder: 250,
    isOpen: true,
    isNew: true,
    priceLevel: 2,
    tags: ['Italian', 'Pizza', 'Pasta'],
  },
  {
    id: 'rest-4',
    nameEn: 'Burger Joint',
    nameRu: 'Бургер Джоинт',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    rating: 4.5,
    reviewCount: 312,
    cuisine: 'American',
    cuisineRu: 'Американская',
    location: 'Kamala',
    locationRu: 'Камала',
    deliveryTime: '15-25',
    deliveryFee: 35,
    minOrder: 150,
    isOpen: false,
    priceLevel: 1,
    tags: ['American', 'Burgers', 'Fast Food'],
  },
  {
    id: 'rest-5',
    nameEn: 'Spice Garden',
    nameRu: 'Сад Специй',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
    rating: 4.7,
    reviewCount: 178,
    cuisine: 'Indian',
    cuisineRu: 'Индийская',
    location: 'Chalong',
    locationRu: 'Чалонг',
    deliveryTime: '30-45',
    deliveryFee: 45,
    minOrder: 300,
    isOpen: true,
    priceLevel: 2,
    tags: ['Indian', 'Curry', 'Vegetarian'],
  },
];

const cuisineCategories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🍽️' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🥢' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍕' },
  { id: 'american', labelEn: 'American', labelRu: 'Американская', icon: '🍔' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
];

export default function FoodIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');

  const filteredRestaurants = demoRestaurants.filter(rest => {
    const name = language === 'ru' ? rest.nameRu : rest.nameEn;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'all' || 
      rest.cuisine.toLowerCase() === selectedCuisine.toLowerCase();
    return matchesSearch && matchesCuisine;
  });

  const openRestaurants = filteredRestaurants.filter(r => r.isOpen);
  const closedRestaurants = filteredRestaurants.filter(r => !r.isOpen);

  const renderPriceLevel = (level: number) => {
    return '฿'.repeat(level) + '฿'.repeat(3 - level).split('').map(() => '').join('');
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-red-500/20 to-primary/20 p-6">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800')] bg-cover bg-center opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">
                {language === 'ru' ? 'Еда и Доставка' : 'Food & Delivery'}
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {language === 'ru' 
                ? 'Что будем есть сегодня?' 
                : 'What to eat today?'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ru'
                ? 'Лучшие рестораны и быстрая доставка'
                : 'Best restaurants with fast delivery'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск ресторанов, блюд...' : 'Search restaurants, dishes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border/50"
          />
        </div>

        {/* Cuisine filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {cuisineCategories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={`${cat.icon} ${language === 'ru' ? cat.labelRu : cat.labelEn}`}
              isActive={selectedCuisine === cat.id}
              onToggle={() => setSelectedCuisine(cat.id)}
            />
          ))}
        </div>

        {/* Quick Categories */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '🔥', label: language === 'ru' ? 'Популярное' : 'Popular' },
            { icon: '⚡', label: language === 'ru' ? 'Быстро' : 'Fast' },
            { icon: '🆓', label: language === 'ru' ? 'Бесплатно' : 'Free Del.' },
            { icon: '🌱', label: language === 'ru' ? 'Веган' : 'Vegan' },
          ].map((cat, i) => (
            <button
              key={i}
              onClick={(e) => triggerRipple(e)}
              className="relative overflow-hidden flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-95"
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs font-medium text-center truncate w-full">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Featured Banner */}
        {demoRestaurants.filter(r => r.isFeatured).length > 0 && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-4">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-white" />
              <div className="flex-1">
                <p className="text-white font-bold">
                  {language === 'ru' ? 'Горячие предложения!' : 'Hot Deals!'}
                </p>
                <p className="text-white/80 text-sm">
                  {language === 'ru' ? 'Скидка 20% на первый заказ' : '20% off your first order'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Open Restaurants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {language === 'ru' ? 'Открыто сейчас' : 'Open Now'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {openRestaurants.length} {language === 'ru' ? 'ресторанов' : 'restaurants'}
            </span>
          </div>
          
          <div className="space-y-4">
            {openRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={(e) => {
                  triggerRipple(e);
                  navigate(`/food/restaurant/${restaurant.id}`);
                }}
                className="relative overflow-hidden flex gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.98]"
              >
                {/* Image */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={restaurant.image}
                    alt={language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {restaurant.isFeatured && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gold/90 text-black text-[10px] font-medium">
                      ⭐
                    </div>
                  )}
                  {restaurant.isNew && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-success/90 text-white text-[10px] font-medium">
                      NEW
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? restaurant.cuisineRu : restaurant.cuisine} • {'฿'.repeat(restaurant.priceLevel)}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{restaurant.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{restaurant.deliveryTime} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Bike className="w-4 h-4" />
                      <span>฿{restaurant.deliveryFee}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closed Restaurants */}
        {closedRestaurants.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
              {language === 'ru' ? 'Сейчас закрыто' : 'Currently Closed'}
            </h2>
            
            <div className="space-y-4 opacity-60">
              {closedRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="flex gap-4 p-3 rounded-xl bg-card border border-border/50"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 grayscale">
                    <img
                      src={restaurant.image}
                      alt={language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-2 py-1 rounded bg-black/50">
                        {language === 'ru' ? 'Закрыто' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? restaurant.cuisineRu : restaurant.cuisine}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{restaurant.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
