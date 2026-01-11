import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, Clock, MapPin, Phone, Bike, Plus, Minus, 
  ShoppingCart, Heart, Share2, Info
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useViewHistory } from '@/hooks/useViewHistory';
import { toast } from 'sonner';
import { BackButton } from '@/components/uno/BackButton';

// Demo restaurant data
const demoRestaurant = {
  id: 'rest-1',
  nameEn: 'Thai Orchid Kitchen',
  nameRu: 'Тайская Орхидея',
  descriptionEn: 'Authentic Thai cuisine with fresh ingredients and traditional recipes. Our chefs bring the flavors of Thailand to your table.',
  descriptionRu: 'Аутентичная тайская кухня со свежими ингредиентами и традиционными рецептами. Наши повара приносят вкус Таиланда к вашему столу.',
  image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
  coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
  rating: 4.8,
  reviewCount: 234,
  cuisine: 'Thai',
  cuisineRu: 'Тайская',
  location: 'Patong Beach Road',
  deliveryTime: '25-35',
  deliveryFee: 40,
  minOrder: 200,
  isOpen: true,
  phone: '+66 76 123 456',
  menu: [
    {
      category: 'Popular',
      categoryRu: 'Популярное',
      items: [
        {
          id: 'dish-1',
          nameEn: 'Pad Thai',
          nameRu: 'Пад Тай',
          descriptionEn: 'Stir-fried rice noodles with shrimp, tofu, peanuts',
          descriptionRu: 'Жареная рисовая лапша с креветками, тофу, арахисом',
          price: 180,
          image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=300',
          isPopular: true,
          isSpicy: false,
        },
        {
          id: 'dish-2',
          nameEn: 'Tom Yum Goong',
          nameRu: 'Том Ям Кунг',
          descriptionEn: 'Spicy shrimp soup with lemongrass and lime',
          descriptionRu: 'Острый суп с креветками, лемонграссом и лаймом',
          price: 220,
          image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=300',
          isPopular: true,
          isSpicy: true,
        },
      ],
    },
    {
      category: 'Main Dishes',
      categoryRu: 'Основные блюда',
      items: [
        {
          id: 'dish-3',
          nameEn: 'Green Curry Chicken',
          nameRu: 'Зелёный Карри с Курицей',
          descriptionEn: 'Creamy coconut curry with Thai basil',
          descriptionRu: 'Сливочный кокосовый карри с тайским базиликом',
          price: 200,
          image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300',
          isSpicy: true,
        },
        {
          id: 'dish-4',
          nameEn: 'Massaman Curry',
          nameRu: 'Массаман Карри',
          descriptionEn: 'Rich curry with potatoes and peanuts',
          descriptionRu: 'Насыщенный карри с картофелем и арахисом',
          price: 220,
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300',
          isSpicy: false,
        },
      ],
    },
    {
      category: 'Appetizers',
      categoryRu: 'Закуски',
      items: [
        {
          id: 'dish-5',
          nameEn: 'Spring Rolls',
          nameRu: 'Спринг Роллы',
          descriptionEn: 'Crispy vegetable rolls with sweet chili sauce',
          descriptionRu: 'Хрустящие овощные роллы со сладким чили соусом',
          price: 120,
          image: 'https://images.unsplash.com/photo-1548507200-c56d450c71eb?w=300',
          isSpicy: false,
        },
        {
          id: 'dish-6',
          nameEn: 'Satay Skewers',
          nameRu: 'Сатай на шпажках',
          descriptionEn: 'Grilled chicken with peanut sauce',
          descriptionRu: 'Курица гриль с арахисовым соусом',
          price: 150,
          image: 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=300',
          isSpicy: false,
        },
      ],
    },
  ],
};

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByProvider } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const { trackView } = useViewHistory();

  const restaurant = demoRestaurant;
  const providerId = id || restaurant.id;
  const cartItems = getItemsByProvider(providerId);

  useEffect(() => {
    trackView(id || restaurant.id, 'restaurant', {
      name_en: restaurant.nameEn,
      name_ru: restaurant.nameRu,
      image: restaurant.image,
      rating: restaurant.rating,
      location: restaurant.location,
    });
  }, [id]);

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
            <BackButton fallbackPath="/restaurants" variant="overlay" />
            <div className="flex gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
              >
                <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
              </button>
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
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{restaurant.deliveryTime} min</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bike className="w-4 h-4" />
                <span>฿{restaurant.deliveryFee}</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-3">
              {language === 'ru' ? restaurant.descriptionRu : restaurant.descriptionEn}
            </p>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{restaurant.location}</span>
            </div>
          </div>
        </div>

        {/* Menu */}
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

        {/* Cart Bottom Bar */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
            <Button
              className="w-full h-14 text-lg"
              onClick={() => navigate('/cart')}
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
