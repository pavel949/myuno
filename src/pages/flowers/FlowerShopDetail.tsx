import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Phone, Globe, Heart, Share2, Plus, Minus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { useCartToast } from '@/hooks/useCartToast';

const shopData = {
  'shop-1': {
    name: 'Phuket Flowers',
    nameRu: 'Цветы Пхукета',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
    rating: 4.9,
    reviewCount: 234,
    location: 'Patong Beach',
    locationRu: 'Патонг Бич',
    address: '123 Beach Road, Patong',
    addressRu: 'Бич Роуд 123, Патонг',
    phone: '+66 76 123 456',
    website: 'www.phuketflowers.com',
    workingHours: '8:00 - 20:00',
    description: 'Premium flower shop with the freshest blooms in Phuket. We offer same-day delivery and custom arrangements for any occasion.',
    descriptionRu: 'Премиальный цветочный магазин с самыми свежими цветами на Пхукете. Предлагаем доставку в день заказа и индивидуальные композиции для любого случая.',
  },
  'shop-2': {
    name: 'Orchid Paradise',
    nameRu: 'Орхидея Рай',
    image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800',
    rating: 4.8,
    reviewCount: 189,
    location: 'Kata Beach',
    locationRu: 'Ката Бич',
    address: '45 Kata Road, Kata',
    addressRu: 'Ката Роуд 45, Ката',
    phone: '+66 76 234 567',
    website: 'www.orchidparadise.com',
    workingHours: '9:00 - 21:00',
    description: 'Specialists in exotic orchids and tropical arrangements. Perfect for special occasions and luxury gifts.',
    descriptionRu: 'Специалисты по экзотическим орхидеям и тропическим композициям. Идеально для особых случаев и роскошных подарков.',
  },
};

const products = [
  {
    id: 'product-1',
    name: 'Classic Rose Bouquet',
    nameRu: 'Классический букет роз',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400',
    price: 1500,
    description: '12 premium red roses',
    descriptionRu: '12 премиальных красных роз',
  },
  {
    id: 'product-2',
    name: 'Tropical Paradise',
    nameRu: 'Тропический Рай',
    image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400',
    price: 2200,
    description: 'Exotic flowers mix',
    descriptionRu: 'Микс экзотических цветов',
  },
  {
    id: 'product-3',
    name: 'White Elegance',
    nameRu: 'Белая Элегантность',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400',
    price: 1800,
    description: 'White lilies & roses',
    descriptionRu: 'Белые лилии и розы',
  },
  {
    id: 'product-4',
    name: 'Sunflower Joy',
    nameRu: 'Радость Подсолнухов',
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400',
    price: 1200,
    description: 'Bright sunflowers',
    descriptionRu: 'Яркие подсолнухи',
  },
  {
    id: 'product-5',
    name: 'Orchid Collection',
    nameRu: 'Коллекция Орхидей',
    image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400',
    price: 3500,
    description: 'Premium orchids',
    descriptionRu: 'Премиальные орхидеи',
  },
  {
    id: 'product-6',
    name: 'Birthday Special',
    nameRu: 'Праздничный букет',
    image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400',
    price: 2000,
    description: 'Colorful mix with balloons',
    descriptionRu: 'Яркий микс с шарами',
  },
];

const FlowerShopDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByProvider } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const { showAddedToast } = useCartToast();

  const shop = shopData[id as keyof typeof shopData] || shopData['shop-1'];
  const providerId = id || 'shop-1';
  const cartItems = getItemsByProvider(providerId);

  const addToCart = (product: typeof products[0]) => {
    const item = {
      id: `flowers-${providerId}-${product.id}`,
      type: 'flowers' as const,
      name: product.name,
      nameRu: product.nameRu,
      price: product.price,
      currency: '฿',
      image: product.image,
      providerId: providerId,
      providerName: shop.name,
      providerNameRu: shop.nameRu,
    };
    addItem(item);
    showAddedToast({ item });
  };

  const removeFromCart = (productId: string) => {
    const cartItemId = `flowers-${providerId}-${productId}`;
    const cartItem = items.find(i => i.id === cartItemId);
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(cartItemId, cartItem.quantity - 1);
    } else {
      removeItem(cartItemId);
    }
  };

  const getQuantity = (productId: string) => {
    const cartItemId = `flowers-${providerId}-${productId}`;
    return items.find(i => i.id === cartItemId)?.quantity || 0;
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background pb-24">
        {/* Header Image */}
        <div className="relative h-64">
          <img
            src={shop.image}
            alt={language === 'ru' ? shop.nameRu : shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Header Actions */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/flowers')}
              className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
              >
                <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-display font-bold">
              {language === 'ru' ? shop.nameRu : shop.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-medium">{shop.rating}</span>
              <span className="text-muted-foreground">({shop.reviewCount} {language === 'ru' ? 'отзывов' : 'reviews'})</span>
            </div>
          </div>

          <p className="text-muted-foreground">
            {language === 'ru' ? shop.descriptionRu : shop.description}
          </p>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{language === 'ru' ? shop.addressRu : shop.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{shop.workingHours}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{shop.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>{shop.website}</span>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">
            {language === 'ru' ? 'Букеты' : 'Bouquets'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => {
              const quantity = getQuantity(product.id);
              return (
                <div
                  key={product.id}
                  className="rounded-xl bg-card border border-border/50 overflow-hidden"
                >
                  <div className="relative aspect-square">
                    <img
                      src={product.image}
                      alt={language === 'ru' ? product.nameRu : product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {language === 'ru' ? product.nameRu : product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {language === 'ru' ? product.descriptionRu : product.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-primary">
                        ฿{product.price.toLocaleString()}
                      </span>
                      {quantity === 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            triggerRipple(e);
                            addToCart(product);
                          }}
                          className="relative overflow-hidden h-8 px-3 active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={(e) => {
                              triggerRipple(e);
                              removeFromCart(product.id);
                            }}
                            className="relative overflow-hidden h-7 w-7 active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={(e) => {
                              triggerRipple(e);
                              addToCart(product);
                            }}
                            className="relative overflow-hidden h-7 w-7 active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <StickyCartBar 
          providerId={providerId} 
          buttonLabel={language === 'ru' ? 'Оформить заказ' : 'Checkout'}
          className="bottom-0"
        />
      </div>
    </AppLayout>
  );
};

export default FlowerShopDetail;