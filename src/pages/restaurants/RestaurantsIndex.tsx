import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UtensilsCrossed, Clock, Star, MapPin, Bike, ArrowRight, Flame, CalendarDays } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { demoRestaurants, cuisineCategories } from './restaurantsData';

type Mode = 'delivery' | 'reservation';

export default function RestaurantsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialMode = (searchParams.get('mode') as Mode) || 'delivery';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  const filteredRestaurants = demoRestaurants.filter(rest => {
    const name = language === 'ru' ? rest.nameRu : rest.nameEn;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'all' || 
      rest.cuisine.toLowerCase() === selectedCuisine.toLowerCase();
    
    // Filter by capability based on mode
    if (mode === 'delivery' && !rest.acceptsDelivery) return false;
    if (mode === 'reservation' && !rest.acceptsReservations) return false;
    
    return matchesSearch && matchesCuisine;
  });

  const openRestaurants = filteredRestaurants.filter(r => r.isOpen);
  const closedRestaurants = filteredRestaurants.filter(r => !r.isOpen);

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/restaurants/${restaurantId}?mode=${mode}`);
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
                {language === 'ru' ? 'Рестораны' : 'Restaurants'}
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {mode === 'delivery' 
                ? (language === 'ru' ? 'Заказать доставку' : 'Order Delivery')
                : (language === 'ru' ? 'Забронировать столик' : 'Reserve a Table')
              }
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === 'delivery'
                ? (language === 'ru' ? 'Лучшие рестораны и быстрая доставка' : 'Best restaurants with fast delivery')
                : (language === 'ru' ? 'Выберите ресторан и забронируйте место' : 'Choose a restaurant and book your table')
              }
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => handleModeChange(v as Mode)} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12">
            <TabsTrigger value="delivery" className="h-10 text-sm gap-2">
              <Bike className="w-4 h-4" />
              {language === 'ru' ? 'Доставка' : 'Delivery'}
            </TabsTrigger>
            <TabsTrigger value="reservation" className="h-10 text-sm gap-2">
              <CalendarDays className="w-4 h-4" />
              {language === 'ru' ? 'Столик' : 'Reservation'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ru' ? 'Поиск ресторанов...' : 'Search restaurants...'}
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

        {/* Quick Categories - only show for delivery mode */}
        {mode === 'delivery' && (
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
        )}

        {/* Reservation Quick Options */}
        {mode === 'reservation' && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🥂', label: language === 'ru' ? 'Романтика' : 'Romantic' },
              { icon: '🎂', label: language === 'ru' ? 'Праздник' : 'Birthday' },
              { icon: '💼', label: language === 'ru' ? 'Бизнес' : 'Business' },
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
        )}

        {/* Featured Banner */}
        {mode === 'delivery' && demoRestaurants.filter(r => r.isFeatured).length > 0 && (
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
              {mode === 'reservation' 
                ? (language === 'ru' ? 'Доступно для брони' : 'Available for Booking')
                : (language === 'ru' ? 'Открыто сейчас' : 'Open Now')
              }
            </h2>
            <span className="text-sm text-muted-foreground">
              {openRestaurants.length} {language === 'ru' ? 'ресторанов' : 'restaurants'}
            </span>
          </div>
          
          <div className="space-y-4">
            {openRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                {/* Main clickable area */}
                <div 
                  onClick={(e) => {
                    triggerRipple(e);
                    handleRestaurantClick(restaurant.id);
                  }}
                  className="flex gap-4 p-3 cursor-pointer active:scale-[0.98]"
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
                      
                      {restaurant.acceptsDelivery && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{restaurant.deliveryTime} min</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[80px]">{language === 'ru' ? restaurant.locationRu : restaurant.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons - Two buttons on card */}
                <div className="flex gap-2 px-3 pb-3">
                  {restaurant.acceptsDelivery && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerRipple(e);
                        navigate(`/restaurants/${restaurant.id}?mode=delivery`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                      <Bike className="w-4 h-4" />
                      {language === 'ru' ? 'Заказать' : 'Order'}
                    </button>
                  )}
                  {restaurant.acceptsReservations && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerRipple(e);
                        navigate(`/restaurants/${restaurant.id}/reserve`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 active:scale-[0.98] transition-all"
                    >
                      <CalendarDays className="w-4 h-4" />
                      {language === 'ru' ? 'Столик' : 'Book'}
                    </button>
                  )}
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
