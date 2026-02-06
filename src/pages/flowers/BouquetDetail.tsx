import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Plus, Minus, Flower2, Truck, Clock, Shield, Loader2, Zap, Package } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { useBouquet, SizeVariant } from '@/hooks/useBouquets';
import { useCartToast } from '@/hooks/useCartToast';
import { useBuyNowFlowers } from '@/hooks/useBuyNowFlowers';
import { SIZE_NOTE_EN, SIZE_NOTE_RU } from '@/types/bouquet';

type SizeKey = 'S' | 'M' | 'L';

const BouquetDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByType } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizeKey>('M');
  const { showAddedToast } = useCartToast();
  const { buyNow } = useBuyNowFlowers();

  const { bouquet, isLoading } = useBouquet(id || '');

  // Get size variants or create default from base price
  const sizeVariants = useMemo<SizeVariant[]>(() => {
    if (bouquet?.size_variants?.length) {
      return bouquet.size_variants as SizeVariant[];
    }
    // Fallback for bouquets without variants
    if (bouquet) {
      return [
        { size: 'S', label_en: 'Small', label_ru: 'Маленький', price: bouquet.price * 0.7, flower_count: 15 },
        { size: 'M', label_en: 'Medium', label_ru: 'Средний', price: bouquet.price, flower_count: 25 },
        { size: 'L', label_en: 'Large', label_ru: 'Большой', price: bouquet.price * 1.5, flower_count: 40 },
      ];
    }
    return [];
  }, [bouquet]);

  const currentVariant = sizeVariants.find(v => v.size === selectedSize) || sizeVariants[1];
  const currentPrice = currentVariant?.price || bouquet?.price || 0;
  
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

  // Cart item ID includes size for separate tracking
  const cartItemId = `bouquet-${bouquet.id}-${selectedSize}`;
  const quantity = items.find(i => i.id === cartItemId)?.quantity || 0;

  const addToCart = () => {
    const sizeLabel = language === 'ru' ? currentVariant.label_ru : currentVariant.label_en;
    const item = {
      id: cartItemId,
      type: 'flowers' as const,
      name: `${bouquet.name_en} (${currentVariant.size})`,
      nameRu: `${bouquet.name_ru} (${sizeLabel})`,
      price: currentPrice,
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
                ฿{currentPrice.toLocaleString()}
              </span>
              {currentVariant?.flower_count && (
                <span className="text-sm text-muted-foreground">
                  ~{currentVariant.flower_count} {language === 'ru' ? 'цветов' : 'flowers'}
                </span>
              )}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm">
              {language === 'ru' ? 'Выберите размер' : 'Select Size'}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {sizeVariants.map((variant) => (
                <button
                  key={variant.size}
                  onClick={() => setSelectedSize(variant.size as SizeKey)}
                  className={cn(
                    "relative p-3 rounded-xl border-2 transition-all duration-200",
                    "flex flex-col items-center gap-1",
                    selectedSize === variant.size
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 bg-background"
                  )}
                >
                  <span className="text-lg font-bold">{variant.size}</span>
                  <span className="text-xs text-muted-foreground">
                    {language === 'ru' ? variant.label_ru : variant.label_en}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    ฿{variant.price.toLocaleString()}
                  </span>
                  {variant.flower_count && (
                    <span className="text-xs text-muted-foreground">
                      ~{variant.flower_count} {language === 'ru' ? 'шт' : 'pcs'}
                    </span>
                  )}
                  {selectedSize === variant.size && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? SIZE_NOTE_RU : SIZE_NOTE_EN}
            </p>
          </div>

          {/* Category and style badges */}
          <div className="flex flex-wrap gap-2">
            {bouquet.style && (
              <Badge variant="secondary">{bouquet.style}</Badge>
            )}
            {bouquet.color_palette && (
              <Badge variant="outline">{bouquet.color_palette}</Badge>
            )}
            {bouquet.occasion_tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

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

          {/* Composition */}
          {(bouquet.composition_en || bouquet.composition_ru) && (
            <div>
              <h2 className="font-semibold mb-2">
                {language === 'ru' ? 'Состав' : 'Composition'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'ru' ? bouquet.composition_ru : bouquet.composition_en}
              </p>
            </div>
          )}

          {/* Details Grid */}
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
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Размер' : 'Size'}
                </p>
                <p className="font-medium">
                  {selectedSize} - {language === 'ru' ? currentVariant.label_ru : currentVariant.label_en}
                </p>
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
          </div>

          {/* Availability Note */}
          {bouquet.availability_note && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                {bouquet.availability_note}
              </p>
            </div>
          )}

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
                    const modifiedBouquet = { ...bouquet, price: currentPrice };
                    buyNow(modifiedBouquet, 1, { size: selectedSize, sizeVariant: currentVariant });
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
                    const modifiedBouquet = { ...bouquet, price: currentPrice };
                    buyNow(modifiedBouquet, quantity, { size: selectedSize, sizeVariant: currentVariant });
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