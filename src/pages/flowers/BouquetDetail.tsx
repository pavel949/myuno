import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Plus, Minus, Flower2, Truck, Clock, Shield, Zap, Package, Sparkles, Gift } from 'lucide-react';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type SizeKey = 'S' | 'M' | 'L';

// Emotional microcopy based on trigger tag
const EMOTIONAL_COPY: Record<string, { en: string; ru: string }> = {
  romantic: { en: 'Make this moment unforgettable.', ru: 'Сделайте этот момент незабываемым.' },
  birthday: { en: 'Brighten their day instantly.', ru: 'Мгновенно осветите их день.' },
  joy: { en: 'Pure happiness, delivered.', ru: 'Чистое счастье с доставкой.' },
  luxury: { en: 'Because ordinary isn\'t enough.', ru: 'Потому что обычного — недостаточно.' },
  gratitude: { en: 'The perfect way to say thank you.', ru: 'Идеальный способ сказать спасибо.' },
  comfort: { en: 'Warmth and care in every petal.', ru: 'Тепло и забота в каждом лепестке.' },
  sophistication: { en: 'Elegance speaks for itself.', ru: 'Элегантность говорит сама за себя.' },
  adventure: { en: 'A burst of tropical energy.', ru: 'Заряд тропической энергии.' },
  lifestyle: { en: 'Beauty that lasts.', ru: 'Красота, которая сохраняется.' },
};

// Fetch flower addons
function useFlowerAddons() {
  return useQuery({
    queryKey: ['flower-addons'],
    queryFn: async () => {
      const { data } = await supabase
        .from('flower_addons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
  });
}

const BouquetDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { addItem, removeItem, updateQuantity, items, getItemsByType } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizeKey>('M');
  const { showAddedToast } = useCartToast();
  const { buyNow } = useBuyNowFlowers();
  const { data: addons = [] } = useFlowerAddons();

  const { bouquet, isLoading } = useBouquet(id || '');
  const isRu = language === 'ru';

  const sizeVariants = useMemo<SizeVariant[]>(() => {
    if (bouquet?.size_variants?.length) {
      return bouquet.size_variants as SizeVariant[];
    }
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
  const smallVariant = sizeVariants.find(v => v.size === 'S');
  const mediumVariant = sizeVariants.find(v => v.size === 'M');

  // Psychology data
  const emotionalTag = (bouquet as any)?.emotional_trigger_tag;
  const socialProof = (bouquet as any)?.social_proof_badge;
  const urgencyBadge = (bouquet as any)?.urgency_badge;
  const scarcityLevel = (bouquet as any)?.scarcity_level;
  const emotionalCopy = emotionalTag ? EMOTIONAL_COPY[emotionalTag] : null;
  const isBefore2PM = new Date().getHours() < 14;

  if (isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <DetailPageSkeleton />
      </AppLayout>
    );
  }

  if (!bouquet) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <Flower2 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {isRu ? 'Букет не найден' : 'Bouquet not found'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Возможно, он был удалён или недоступен' : 'It may have been removed or is unavailable'}
          </p>
          <Button onClick={() => navigate('/flowers')}>
            {isRu ? 'К каталогу цветов' : 'Back to flowers'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = flowersInCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const cartItemId = `bouquet-${bouquet.id}-${selectedSize}`;
  const quantity = items.find(i => i.id === cartItemId)?.quantity || 0;

  const addToCart = () => {
    const sizeLabel = isRu ? currentVariant.label_ru : currentVariant.label_en;
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
    // Compliment toast
    toast.success(
      isRu ? 'Отличный выбор! Этот букет точно произведёт впечатление ✨' : 'Great choice! This bouquet will make an impression ✨',
      { duration: 3000 }
    );
  };

  const removeFromCart = () => {
    if (quantity > 1) {
      updateQuantity(cartItemId, quantity - 1);
    } else {
      removeItem(cartItemId);
    }
  };

  // Upsell: if S selected, show upgrade nudge
  const showUpgradeNudge = selectedSize === 'S' && smallVariant && mediumVariant;
  const upgradeDiff = showUpgradeNudge ? mediumVariant!.price - smallVariant!.price : 0;
  const upgradeFlowerDiff = showUpgradeNudge ? (mediumVariant!.flower_count - smallVariant!.flower_count) : 0;

  return (
    <AppLayout showBottomNav={false}>
      <Helmet>
        <title>{`${isRu ? bouquet.name_ru : bouquet.name_en} — ${isRu ? 'Доставка цветов' : 'Flower Delivery'} | myUNO`}</title>
        <meta name="description" content={(isRu ? bouquet.description_ru : bouquet.description_en) || (isRu ? bouquet.name_ru : bouquet.name_en)} />
      </Helmet>
      <div className="min-h-screen bg-background pb-28">
        {/* Header Image */}
        <div className="relative aspect-square max-h-[500px]">
          <img
            src={bouquet.image || '/placeholder.svg'}
            alt={isRu ? bouquet.name_ru : bouquet.name_en}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/flowers')} className="bg-black/20 text-white hover:bg-black/40">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)} className="bg-black/20 text-white hover:bg-black/40">
                <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
              </Button>
              <Button variant="ghost" size="icon" className="bg-black/20 text-white hover:bg-black/40">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Badges overlay */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
            {bouquet.is_popular && (
              <Badge variant="default" className="bg-primary text-sm">
                {isRu ? '🔥 Бестселлер' : '🔥 Bestseller'}
              </Badge>
            )}
            {socialProof && (
              <Badge className="bg-background/90 text-foreground text-xs border-0">
                <Star className="w-3 h-3 mr-1 text-accent" />
                {isRu 
                  ? socialProof === 'Most ordered this week' ? 'Самый заказываемый на этой неделе'
                    : socialProof === 'Customer favorite' ? 'Любимец покупателей'
                    : socialProof
                  : socialProof}
              </Badge>
            )}
            {scarcityLevel === 'high' && (
              <Badge variant="destructive" className="text-xs">
                {isRu ? 'Ограниченное количество сегодня' : 'Limited availability today'}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Title and price */}
          <div>
            <h1 className="text-2xl font-display font-bold">
              {isRu ? bouquet.name_ru : bouquet.name_en}
            </h1>
            {bouquet.shop && (
              <p className="text-sm text-muted-foreground mt-1">
                {isRu ? bouquet.shop.name_ru : bouquet.shop.name_en}
              </p>
            )}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-bold text-primary">
                ฿{currentPrice.toLocaleString()}
              </span>
              {currentVariant?.flower_count && (
                <span className="text-sm text-muted-foreground">
                  ~{currentVariant.flower_count} {isRu ? 'цветов' : 'flowers'}
                </span>
              )}
            </div>

            {/* Emotional microcopy */}
            {emotionalCopy && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                ✨ {isRu ? emotionalCopy.ru : emotionalCopy.en}
              </p>
            )}
          </div>

          {/* Size Selector with M anchor */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm">
              {isRu ? 'Выберите размер' : 'Select Size'}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {sizeVariants.map((variant) => {
                const isM = variant.size === 'M';
                return (
                  <button
                    key={variant.size}
                    onClick={() => setSelectedSize(variant.size as SizeKey)}
                    className={cn(
                      "relative p-3 rounded-none border-2 transition-all duration-200",
                      "flex flex-col items-center gap-1",
                      selectedSize === variant.size
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/50 bg-background",
                      isM && selectedSize !== variant.size && "border-primary/30 bg-primary/5"
                    )}
                  >
                    {/* "Most popular" label for M */}
                    {isM && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">
                          {isRu ? 'Самый популярный' : 'Most popular'}
                        </Badge>
                      </div>
                    )}
                    <span className="text-lg font-bold mt-1">{variant.size}</span>
                    <span className="text-xs text-muted-foreground">
                      {isRu ? variant.label_ru : variant.label_en}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      ฿{variant.price.toLocaleString()}
                    </span>
                    {variant.flower_count && (
                      <span className="text-xs text-muted-foreground">
                        ~{variant.flower_count} {isRu ? 'шт' : 'pcs'}
                      </span>
                    )}
                    {selectedSize === variant.size && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Upsell nudge when S selected */}
            {showUpgradeNudge && (
              <button
                onClick={() => setSelectedSize('M')}
                className="w-full p-2.5 rounded-none bg-primary/5 border border-primary/20 text-left hover:bg-primary/10 transition-colors"
              >
                <p className="text-xs text-primary font-medium">
                  💡 {isRu
                    ? `+${upgradeFlowerDiff} цветов всего за +฿${upgradeDiff.toLocaleString()} → размер M`
                    : `+${upgradeFlowerDiff} flowers for just +฿${upgradeDiff.toLocaleString()} → size M`
                  }
                </p>
              </button>
            )}

            <p className="text-xs text-muted-foreground">
              {isRu ? SIZE_NOTE_RU : SIZE_NOTE_EN}
            </p>
          </div>

          {/* Trust & delivery badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-none bg-secondary/50">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{isRu ? 'Гарантия' : 'Guarantee'}</p>
                <p className="font-medium text-sm">{isRu ? 'Свежесть 5 дней' : '5-day freshness'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-none bg-secondary/50">
              <Truck className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{isRu ? 'Доставка' : 'Delivery'}</p>
                <p className="font-medium text-sm">{isRu ? '1-3 часа' : '1-3 hours'}</p>
              </div>
            </div>
            {isBefore2PM && (
              <div className="col-span-2 flex items-center gap-2 p-3 rounded-none bg-primary/5 border border-primary/20">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm font-medium text-primary">
                  {isRu ? 'Закажите до 14:00 — доставим сегодня!' : 'Order by 2 PM — same-day delivery!'}
                </p>
              </div>
            )}
            {urgencyBadge && !isBefore2PM && (
              <div className="col-span-2 flex items-center gap-2 p-3 rounded-none bg-muted/50 border">
                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{urgencyBadge}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {(bouquet.description_en || bouquet.description_ru) && (
            <div>
              <h2 className="font-semibold mb-2">{isRu ? 'Описание' : 'Description'}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isRu ? bouquet.description_ru : bouquet.description_en}
              </p>
            </div>
          )}

          {/* Composition */}
          {(bouquet.composition_en || bouquet.composition_ru) && (
            <div>
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Flower2 className="w-4 h-4 text-primary" />
                {isRu ? 'Состав' : 'Composition'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isRu ? bouquet.composition_ru : bouquet.composition_en}
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {bouquet.style && <Badge variant="secondary">{bouquet.style}</Badge>}
            {bouquet.occasion_tags?.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>

          {/* Addons upsell */}
          {addons.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                {isRu ? 'Добавить к букету' : 'Add to your bouquet'}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {addons.map((addon: any) => (
                  <button
                    key={addon.id}
                    onClick={() => {
                      addItem({
                        id: `addon-${addon.id}`,
                        type: 'flowers' as const,
                        name: addon.name_en,
                        nameRu: addon.name_ru,
                        price: addon.price_thb,
                        currency: '฿',
                        providerId: 'flowers-addon',
                        providerName: 'Flowers Add-on',
                        providerNameRu: 'Дополнение к букету',
                      });
                      toast.success(isRu ? 'Добавлено!' : 'Added!');
                    }}
                    className="flex items-center gap-2 p-3 rounded-none border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                  >
                    <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{isRu ? addon.name_ru : addon.name_en}</p>
                      <p className="text-xs text-muted-foreground">฿{addon.price_thb}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 border-t border-border z-50">
          <div className="flex items-center gap-3 max-w-[1536px] mx-auto">
            {quantity === 0 ? (
              <>
                <Button
                  onClick={(e) => {
                    const modifiedBouquet = { ...bouquet, price: currentPrice };
                    buyNow(modifiedBouquet, 1, { size: selectedSize, sizeVariant: currentVariant });
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent text-white"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isRu ? 'Купить сейчас' : 'Buy Now'}
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    addToCart();
                  }}
                  className="h-12 px-4"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-secondary rounded-none p-1">
                  <Button size="icon" variant="ghost" onClick={(e) => { removeFromCart(); }} className="h-10 w-10">
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                  <Button size="icon" variant="ghost" onClick={(e) => { addToCart(); }} className="h-10 w-10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={(e) => {
                    const modifiedBouquet = { ...bouquet, price: currentPrice };
                    buyNow(modifiedBouquet, quantity, { size: selectedSize, sizeVariant: currentVariant });
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent text-white"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isRu ? 'Купить' : 'Buy'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/cart')} className="h-12">
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
