import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Star, Clock, MapPin, Phone, Bike, Plus, Minus, 
  ShoppingCart, Share2, CalendarDays, UtensilsCrossed
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useViewHistory } from '@/hooks/useViewHistory';
import { toast } from 'sonner';
import { getRestaurantById } from './restaurantsData';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByProvider } = useCart();
  const { trackView } = useViewHistory();

  const initialMode = searchParams.get('mode') || 'delivery';
  const [activeTab, setActiveTab] = useState<'menu' | 'sets' | 'reviews'>('menu');

  const restaurant = getRestaurantById(id || '');
  const providerId = id || '';
  const cartItems = getItemsByProvider(providerId);

  useEffect(() => {
    if (restaurant) {
      trackView(id || restaurant.id, 'restaurant', {
        name_en: restaurant.nameEn,
        name_ru: restaurant.nameRu,
        image: restaurant.image,
        rating: restaurant.rating,
        location: restaurant.location,
      });
    }
  }, [id, restaurant]);

  if (!restaurant) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Ресторан не найден' : 'Restaurant not found'}
          </p>
        </div>
      </AppLayout>
    );
  }

  const addToCart = (item: any) => {
    addItem({
      id: `food-${providerId}-${item.id}`,
      type: 'food',
      name: item.nameEn,
      nameRu: item.nameRu,
      price: item.price,
      currency: '฿',
      image: item.image,
      providerId: providerId,
      providerName: restaurant.nameEn,
      providerNameRu: restaurant.nameRu,
    });
    toast.success(language === 'ru' ? 'Добавлено в корзину' : 'Added to cart');
  };

  const removeFromCart = (itemId: string) => {
    const cartItemId = `food-${providerId}-${itemId}`;
    const cartItem = items.find(i => i.id === cartItemId);
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(cartItemId, cartItem.quantity - 1);
    } else {
      removeItem(cartItemId);
    }
  };

  const getItemQuantity = (itemId: string) => {
    const cartItemId = `food-${providerId}-${itemId}`;
    return items.find(i => i.id === cartItemId)?.quantity || 0;
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-24">
        {/* Header with Image */}
        <div className="relative h-48">
          <img
            src={restaurant.coverImage}
            alt={language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          
          {/* Navigation */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <FavoriteButton
                itemType="restaurant"
                itemId={id || ''}
                itemData={{
                  name: restaurant.nameEn,
                  nameRu: restaurant.nameRu,
                  image: restaurant.image,
                  rating: restaurant.rating,
                  location: restaurant.location,
                  cuisine: restaurant.cuisine,
                }}
                className="bg-background/80 backdrop-blur-sm"
              />
              <button className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="px-4 -mt-8 relative z-10">
          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-display font-bold">
                  {language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? restaurant.cuisineRu : restaurant.cuisine}
                </p>
              </div>
              <Badge variant={restaurant.isOpen ? "default" : "secondary"}>
                {restaurant.isOpen 
                  ? (language === 'ru' ? 'Открыто' : 'Open')
                  : (language === 'ru' ? 'Закрыто' : 'Closed')}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{restaurant.rating}</span>
                <span className="text-muted-foreground">({restaurant.reviewCount})</span>
              </div>
              {restaurant.acceptsDelivery && (
                <>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{restaurant.deliveryTime} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bike className="w-4 h-4" />
                    <span>฿{restaurant.deliveryFee}</span>
                  </div>
                </>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-3">
              {language === 'ru' ? restaurant.descriptionRu : restaurant.descriptionEn}
            </p>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{restaurant.address}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {restaurant.acceptsDelivery && (
                <Button
                  variant={initialMode === 'delivery' ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => setActiveTab('menu')}
                >
                  <Bike className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Доставка' : 'Delivery'}
                </Button>
              )}
              {restaurant.acceptsReservations && (
                <Button
                  variant={initialMode === 'reservation' ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => navigate(`/restaurants/${id}/reserve`)}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Столик' : 'Book Table'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for Menu / Set Menus / Reviews */}
        <div className="px-4 mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'menu' | 'sets' | 'reviews')}>
            <TabsList className={cn("w-full grid", restaurant.hasSetMenus && restaurant.setMenus && restaurant.setMenus.length > 0 ? "grid-cols-3" : "grid-cols-2")}>
              <TabsTrigger value="menu" className="gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                {language === 'ru' ? 'Меню' : 'Menu'}
              </TabsTrigger>
              {restaurant.hasSetMenus && restaurant.setMenus && restaurant.setMenus.length > 0 && (
                <TabsTrigger value="sets" className="gap-2">
                  🥂 {language === 'ru' ? 'Сеты' : 'Sets'}
                </TabsTrigger>
              )}
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="w-4 h-4" />
                {language === 'ru' ? 'Отзывы' : 'Reviews'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Set Menus */}
        {activeTab === 'sets' && restaurant.setMenus && (
          <div className="px-4 mt-4 space-y-4">
            {restaurant.setMenus.map((set) => (
              <div
                key={set.id}
                className="rounded-xl bg-card border border-border/50 overflow-hidden"
              >
                <div className="relative h-40">
                  <img
                    src={set.image}
                    alt={language === 'ru' ? set.nameRu : set.nameEn}
                    className="w-full h-full object-cover"
                  />
                  {set.originalPrice && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-destructive text-white text-xs font-medium">
                      -{Math.round((1 - set.price / set.originalPrice) * 100)}%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">
                    {language === 'ru' ? set.nameRu : set.nameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ru' ? set.descriptionRu : set.descriptionEn}
                  </p>
                  
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {language === 'ru' ? 'Включено:' : 'Includes:'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(language === 'ru' ? set.includesRu : set.includes).map((item, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-secondary text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">฿{set.price}</span>
                        {set.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ฿{set.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{set.duration}</span>
                        <span>•</span>
                        <span>👥 до {set.maxGuests}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/restaurants/${id}/experience/${set.id}`)}
                    >
                      {language === 'ru' ? 'Забронировать' : 'Book'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu */}
        {activeTab === 'menu' && (
          <div className="px-4 mt-6 space-y-6">
            {restaurant.menu.map((section) => (
              <div key={section.category}>
                <h2 className="text-lg font-semibold mb-3">
                  {language === 'ru' ? section.categoryRu : section.category}
                </h2>
                
                <div className="space-y-3">
                  {section.items.map((item) => {
                    const quantity = getItemQuantity(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 rounded-xl bg-card border border-border/50"
                      >
                        {/* Image */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={language === 'ru' ? item.nameRu : item.nameEn}
                            className="w-full h-full object-cover"
                          />
                          {item.isPopular && (
                            <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-orange-500 text-white text-[10px]">
                              🔥
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">
                                {language === 'ru' ? item.nameRu : item.nameEn}
                                {item.isSpicy && <span className="ml-1">🌶️</span>}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {language === 'ru' ? item.descriptionRu : item.descriptionEn}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-primary">฿{item.price}</span>
                            
                            {quantity > 0 ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-6 text-center font-medium">{quantity}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="px-4 mt-4">
            <ReviewsSection 
              itemType="restaurant" 
              itemId={id || ''} 
              itemName={language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
            />
          </div>
        )}

        {/* Cart Bottom Bar */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
            <Button
              className="w-full h-14 text-lg"
              onClick={() => navigate(`/restaurants/${id}/delivery`)}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {language === 'ru' ? 'Корзина' : 'View Cart'} ({cartCount})
              <span className="ml-auto">฿{cartTotal}</span>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
