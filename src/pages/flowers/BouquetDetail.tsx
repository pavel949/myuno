import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Plus, Minus, Flower2, Truck, Clock, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { bouquets } from './FlowersIndex';
import { useCartToast } from '@/hooks/useCartToast';

const BouquetDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByType } = useCart();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { showAddedToast } = useCartToast();

  const bouquet = bouquets.find(b => b.id === id);
  
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
      name: bouquet.name,
      nameRu: bouquet.nameRu,
      price: bouquet.price,
      currency: '฿',
      image: bouquet.image,
      providerId: 'flowers-shop',
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

  // Related bouquets (same category)
  const relatedBouquets = bouquets
    .filter(b => b.category === bouquet.category && b.id !== bouquet.id)
    .slice(0, 4);

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background pb-24">
        {/* Header Image */}
        <div className="relative aspect-square">
          <img
            src={bouquet.image}
            alt={language === 'ru' ? bouquet.nameRu : bouquet.name}
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

          {/* Discount badge */}
          {bouquet.originalPrice && (
            <div className="absolute bottom-4 left-4">
              <Badge variant="destructive" className="text-sm">
                -{Math.round((1 - bouquet.price / bouquet.originalPrice) * 100)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Title and price */}
          <div>
            <h1 className="text-2xl font-display font-bold">
              {language === 'ru' ? bouquet.nameRu : bouquet.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-medium">{bouquet.rating}</span>
              <span className="text-muted-foreground">
                ({bouquet.reviewCount} {language === 'ru' ? 'отзывов' : 'reviews'})
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-bold text-primary">
                ฿{bouquet.price.toLocaleString()}
              </span>
              {bouquet.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ฿{bouquet.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {(language === 'ru' ? bouquet.tagsRu : bouquet.tags).map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold mb-2">
              {language === 'ru' ? 'Описание' : 'Description'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ru' ? bouquet.descriptionRu : bouquet.description}
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Flower2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Цветов' : 'Flowers'}
                </p>
                <p className="font-medium">{bouquet.flowersCount}</p>
              </div>
            </div>
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

          {/* Related Bouquets */}
          {relatedBouquets.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">
                {language === 'ru' ? 'Похожие букеты' : 'Similar bouquets'}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {relatedBouquets.map((related) => (
                  <div
                    key={related.id}
                    onClick={() => navigate(`/flowers/bouquet/${related.id}`)}
                    className="flex-shrink-0 w-32 cursor-pointer"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2">
                      <img
                        src={related.image}
                        alt={language === 'ru' ? related.nameRu : related.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium line-clamp-1">
                      {language === 'ru' ? related.nameRu : related.name}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      ฿{related.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <div className="flex items-center gap-3">
            {quantity === 0 ? (
              <Button
                onClick={(e) => {
                  triggerRipple(e);
                  addToCart();
                }}
                className="flex-1 h-12"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {language === 'ru' ? 'Добавить в корзину' : 'Add to cart'}
              </Button>
            ) : (
              <>
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
                <Button
                  onClick={() => navigate('/cart')}
                  className="flex-1 h-12"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {language === 'ru' ? 'Корзина' : 'Cart'}
                  <span className="ml-auto font-bold">฿{totalPrice.toLocaleString()}</span>
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
