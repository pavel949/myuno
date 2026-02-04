import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Plus, Minus, Flower2, Truck, Clock, Shield, Loader2, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { useBouquet } from '@/hooks/useBouquets';
import { useCartToast } from '@/hooks/useCartToast';
import { useBuyNowFlowers } from '@/hooks/useBuyNowFlowers';
const BouquetDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByType } = useCart();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { showAddedToast } = useCartToast();
  const { buyNow } = useBuyNowFlowers();

  const { bouquet, isLoading } = useBouquet(id || '');
  
  if (isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!bouquet) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <p>{language === 'ru' ? 'Букет не найден' : 'Bouquet not found'}</p>
        </div>
      </AppLayout>
    );
  }

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = flowersInCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const cartItemId = `bouquet-${bouquet.id}`;
  const quantity = items.find(i => i.id === cartItemId)?.quantity || 0;

  const addToCart = () => {
    const item = {
      id: cartItemId,
      type: 'flowers' as const,
      name: bouquet.name_en,
      nameRu: bouquet.name_ru,
      price: bouquet.price,
      currency: '฿',
      image: bouquet.image || undefined,
      providerId: bouquet.shop?.provider_id || 'flowers-shop',
      providerName: 'Phuket Flowers',
      providerNameRu: 'Цветы Пхукета',
    };
    addItem(item);
    showAddedToast({ item });
  };

  const removeFromCart = () => {
    if (quantity > 1) {
      updateQuantity(cartItemId, quantity - 1);
    } else {
      removeItem(cartItemId);
    }
  };

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background pb-24">
        {/* Header Image */}
        <div className="relative aspect-square">
          <img
            src={bouquet.image || '/placeholder.svg'}
            alt={language === 'ru' ? bouquet.name_ru : bouquet.name_en}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
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

          {/* Popular badge */}
          {bouquet.is_popular && (
            <div className="absolute bottom-4 left-4">
              <Badge variant="default" className="text-sm bg-primary">
                {language === 'ru' ? 'Популярный' : 'Popular'}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Title and price */}
          <div>
            <h1 className="text-2xl font-display font-bold">
              {language === 'ru' ? bouquet.name_ru : bouquet.name_en}
            </h1>
            {bouquet.shop && (
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'ru' ? bouquet.shop.name_ru : bouquet.shop.name_en}
              </p>
            )}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-bold text-primary">
                ฿{bouquet.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Category badge */}
          {bouquet.category && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {bouquet.category}
              </Badge>
              {bouquet.size && (
                <Badge variant="outline">
                  {bouquet.size}
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {(bouquet.description_en || bouquet.description_ru) && (
            <div>
              <h2 className="font-semibold mb-2">
                {language === 'ru' ? 'Описание' : 'Description'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'ru' ? bouquet.description_ru : bouquet.description_en}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            {bouquet.flowers && bouquet.flowers.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                <Flower2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Цветы' : 'Flowers'}
                  </p>
                  <p className="font-medium text-sm">{bouquet.flowers.slice(0, 2).join(', ')}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Truck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Доставка' : 'Delivery'}
                </p>
                <p className="font-medium">{language === 'ru' ? '1-3 часа' : '1-3 hours'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Свежесть' : 'Freshness'}
                </p>
                <p className="font-medium">{language === 'ru' ? '7+ дней' : '7+ days'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Гарантия' : 'Guarantee'}
                </p>
                <p className="font-medium">{language === 'ru' ? '100%' : '100%'}</p>
              </div>
            </div>
          </div>

          {/* Shop info if available */}
          {bouquet.shop && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Магазин' : 'Shop'}
              </p>
              <p className="font-medium">
                {language === 'ru' ? bouquet.shop.name_ru : bouquet.shop.name_en}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <div className="flex items-center gap-3">
            {quantity === 0 ? (
              <>
                {/* Primary: Buy Now */}
                <Button
                  onClick={(e) => {
                    triggerRipple(e);
                    buyNow(bouquet);
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {language === 'ru' ? 'Купить сейчас' : 'Buy Now'}
                </Button>
                
                {/* Secondary: Add to Cart */}
                <Button
                  variant="outline"
                  onClick={(e) => {
                    triggerRipple(e);
                    addToCart();
                  }}
                  className="h-12 px-4"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                {/* Quantity controls */}
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      triggerRipple(e);
                      removeFromCart();
                    }}
                    className="h-10 w-10"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      triggerRipple(e);
                      addToCart();
                    }}
                    className="h-10 w-10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Buy Now (current quantity) */}
                <Button
                  onClick={(e) => {
                    triggerRipple(e);
                    buyNow(bouquet, quantity);
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {language === 'ru' ? 'Купить' : 'Buy'}
                </Button>
                
                {/* Cart with total */}
                <Button
                  variant="outline"
                  onClick={() => navigate('/cart')}
                  className="h-12"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  ฿{totalPrice.toLocaleString()}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BouquetDetail;
