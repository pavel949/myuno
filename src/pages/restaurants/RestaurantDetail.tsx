import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Star, Clock, MapPin, Bike, Plus, Minus, 
  Share2, CalendarDays, UtensilsCrossed
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useRestaurant } from '@/hooks/useRestaurants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';
import { cn } from '@/lib/utils';
import { useViewHistory } from '@/hooks/useViewHistory';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { useCartToast } from '@/hooks/useCartToast';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByProvider } = useCart();
  const { trackView } = useViewHistory();
  const { showAddedToast } = useCartToast();

  const { restaurant, menuCategories, menuItems, isLoading } = useRestaurant(id || '');

  const initialMode = searchParams.get('mode') || 'delivery';
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');

  const providerId = id || '';
  const cartItems = getItemsByProvider(providerId);

  useEffect(() => {
    if (restaurant) {
      trackView(id || restaurant.id, 'restaurant', {
        name_en: restaurant.name_en,
        name_ru: restaurant.name_ru,
        image: restaurant.cover_image,
        rating: restaurant.rating,
        location: restaurant.district,
      });
    }
  }, [id, restaurant, trackView]);

  if (isLoading) {
    return (
      <AppLayout>
        <DetailPageSkeleton />
      </AppLayout>
    );
  }

  if (!restaurant) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Ресторан не найден' : 'Restaurant not found'}
          </p>
        </div>
      </AppLayout>
    );
  }

  const addToCart = (item: typeof menuItems[0]) => {
    const cartItem = {
      id: `food-${providerId}-${item.id}`,
      type: 'food' as const,
      name: item.name_en,
      nameRu: item.name_ru,
      price: item.price,
      currency: item.currency || '฿',
      image: item.image || undefined,
      providerId: providerId,
      providerName: restaurant.name_en,
      providerNameRu: restaurant.name_ru,
    };
    addItem(cartItem);
    showAddedToast({ item: cartItem, cartPath: `/restaurants/${id}/delivery` });
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

  // Group menu items by category
  const menuByCategory = menuCategories.map(category => ({
    ...category,
    items: menuItems.filter(item => item.category_id === category.id)
  })).filter(category => category.items.length > 0);

  // Items without category
  const uncategorizedItems = menuItems.filter(item => !item.category_id);

  return (
    <AppLayout>
      <div className="pb-24">
        {/* Header with Image */}
        <div className="relative h-48">
          <img
            src={restaurant.cover_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
            alt={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          
          {/* Navigation */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <button
              onClick={() => navigate('/restaurants')}
              className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <FavoriteButton
                itemType="restaurant"
                itemId={id || ''}
                itemData={{
                  name: restaurant.name_en,
                  nameRu: restaurant.name_ru,
                  image: restaurant.cover_image,
                  rating: restaurant.rating,
                  location: restaurant.district,
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
                  {language === 'ru' ? restaurant.name_ru : restaurant.name_en}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {restaurant.cuisine} • {'฿'.repeat(restaurant.price_range || 2)}
                </p>
              </div>
              <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                {restaurant.is_active 
                  ? (language === 'ru' ? 'Открыто' : 'Open')
                  : (language === 'ru' ? 'Закрыто' : 'Closed')}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{restaurant.rating || 0}</span>
                <span className="text-muted-foreground">({restaurant.review_count || 0})</span>
              </div>
              {restaurant.delivery_available && (
                <>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{restaurant.delivery_time} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bike className="w-4 h-4" />
                    <span>฿{restaurant.delivery_fee || 0}</span>
                  </div>
                </>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-3">
              {language === 'ru' ? restaurant.description_ru : restaurant.description_en}
            </p>
            
            {restaurant.address && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{restaurant.address}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {restaurant.delivery_available && (
                <Button
                  variant={initialMode === 'delivery' ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => setActiveTab('menu')}
                >
                  <Bike className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Доставка' : 'Delivery'}
                </Button>
              )}
              <Button
                variant={initialMode === 'reservation' ? 'default' : 'outline'}
                className="h-12"
                onClick={() => navigate(`/restaurants/${id}/reserve`)}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Столик' : 'Book Table'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs for Menu / Reviews */}
        <div className="px-4 mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'menu' | 'reviews')}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="menu" className="gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                {language === 'ru' ? 'Меню' : 'Menu'}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="w-4 h-4" />
                {language === 'ru' ? 'Отзывы' : 'Reviews'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Menu */}
        {activeTab === 'menu' && (
          <div className="px-4 mt-6 space-y-6">
            {menuByCategory.length === 0 && uncategorizedItems.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {language === 'ru' ? 'Меню пока не добавлено' : 'Menu not available yet'}
                </p>
              </div>
            ) : (
              <>
                {menuByCategory.map((section) => (
                  <div key={section.id}>
                    <h2 className="text-lg font-semibold mb-3">
                      {language === 'ru' ? section.name_ru : section.name_en}
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
                            {item.image && (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={language === 'ru' ? item.name_ru : item.name_en}
                                  className="w-full h-full object-cover"
                                />
                                {item.is_popular && (
                                  <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-orange-500 text-white text-[10px]">
                                    🔥
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium">
                                    {language === 'ru' ? item.name_ru : item.name_en}
                                    {item.is_spicy && <span className="ml-1">🌶️</span>}
                                    {item.is_vegetarian && <span className="ml-1">🌱</span>}
                                  </h3>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {language === 'ru' ? item.description_ru : item.description_en}
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

                {/* Uncategorized items */}
                {uncategorizedItems.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">
                      {language === 'ru' ? 'Другое' : 'Other'}
                    </h2>
                    <div className="space-y-3">
                      {uncategorizedItems.map((item) => {
                        const quantity = getItemQuantity(item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex gap-4 p-3 rounded-xl bg-card border border-border/50"
                          >
                            {item.image && (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={language === 'ru' ? item.name_ru : item.name_en}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">
                                {language === 'ru' ? item.name_ru : item.name_en}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {language === 'ru' ? item.description_ru : item.description_en}
                              </p>
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
                )}
              </>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="px-4 mt-4">
            <ReviewsSection 
              itemType="restaurant" 
              itemId={id || ''} 
              itemName={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
            />
          </div>
        )}

        <StickyCartBar
          providerId={providerId}
          checkoutPath={`/restaurants/${id}/delivery`}
          className="bottom-0"
        />
      </div>
    </AppLayout>
  );
}
