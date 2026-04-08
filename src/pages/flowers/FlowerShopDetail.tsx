import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Phone, Globe, Heart, Share2, Plus, Minus, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { useCartToast } from '@/hooks/useCartToast';
import { useSupabaseSingle, useSupabaseQuery, QueryFilter } from '@/hooks/useSupabaseQuery';
import { useMemo, useCallback } from 'react';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

interface FlowerShop {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[] | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  working_hours: any;
  rating: number | null;
  review_count: number | null;
  delivery_available: boolean | null;
}

interface Bouquet {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  image: string | null;
  price: number;
  shop_id: string;
}

const FlowerShopDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem, removeItem, updateQuantity, items, getItemsByProvider } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const { showAddedToast } = useCartToast();

  const transform = useCallback((data: unknown) => data as FlowerShop, []);
  const { data: shop, isLoading: shopLoading } = useSupabaseSingle<FlowerShop>({
    table: 'flower_shops',
    id: id || '',
    transform,
  });

  const bouquetFilters = useMemo((): QueryFilter[] => [
    { column: 'shop_id', value: id || '' },
    { column: 'is_active', value: true },
  ], [id]);

  const { data: bouquets, isLoading: bouquetsLoading } = useSupabaseQuery<Bouquet>({
    table: 'bouquets',
    filters: bouquetFilters,
    enabled: !!id,
  });

  const providerId = id || '';
  const cartItems = getItemsByProvider(providerId);

  const addToCart = (product: Bouquet) => {
    const item = {
      id: `flowers-${providerId}-${product.id}`,
      type: 'flowers' as const,
      name: product.name_en,
      nameRu: product.name_ru,
      price: product.price,
      currency: '฿',
      image: product.image || undefined,
      providerId,
      providerName: shop?.name_en || '',
      providerNameRu: shop?.name_ru || '',
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

  if (shopLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!shop) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">{language === 'ru' ? 'Магазин не найден' : 'Shop not found'}</p>
          <Button onClick={() => navigate('/flowers')}>{language === 'ru' ? 'К магазинам' : 'Back to shops'}</Button>
        </div>
      </AppLayout>
    );
  }

  const shopName = language === 'ru' ? shop.name_ru : shop.name_en;

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background pb-24">
        <div className="relative h-64">
          <img src={shop.cover_image || PLACEHOLDER_IMAGES.flower} alt={shopName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/flowers')} className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)} className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40">
                <Heart className={cn("w-5 h-5", isFavorite && "fill-destructive text-destructive")} />
              </Button>
              <Button variant="ghost" size="icon" className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"><Share2 className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-display font-bold">{shopName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-medium">{shop.rating ?? 0}</span>
              <span className="text-muted-foreground">({shop.review_count ?? 0} {language === 'ru' ? 'отзывов' : 'reviews'})</span>
            </div>
          </div>
          <p className="text-muted-foreground">{language === 'ru' ? shop.description_ru : shop.description_en}</p>
          <div className="flex flex-col gap-2 text-sm">
            {shop.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>{shop.address}</span></div>}
            {shop.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /><span>{shop.phone}</span></div>}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">{language === 'ru' ? 'Букеты' : 'Bouquets'}</h2>
          {bouquetsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {(bouquets || []).map((product) => {
                const quantity = getQuantity(product.id);
                return (
                  <div key={product.id} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                    <div className="relative aspect-square">
                      <img src={product.image || PLACEHOLDER_IMAGES.flowerProduct} alt={language === 'ru' ? product.name_ru : product.name_en} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{language === 'ru' ? product.name_ru : product.name_en}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{language === 'ru' ? product.description_ru : product.description_en}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-primary">{formatPrice(product.price)}</span>
                        {quantity === 0 ? (
                          <Button size="sm" variant="outline" onClick={(e) => { triggerRipple(e); addToCart(product); }} className="relative overflow-hidden h-8 px-3 active:scale-95">
                            <Plus className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" onClick={(e) => { triggerRipple(e); removeFromCart(product.id); }} className="relative overflow-hidden h-7 w-7 active:scale-95"><Minus className="w-3 h-3" /></Button>
                            <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                            <Button size="icon" variant="outline" onClick={(e) => { triggerRipple(e); addToCart(product); }} className="relative overflow-hidden h-7 w-7 active:scale-95"><Plus className="w-3 h-3" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <StickyCartBar providerId={providerId} buttonLabel={language === 'ru' ? 'Оформить заказ' : 'Checkout'} className="bottom-0" />
      </div>
    </AppLayout>
  );
};

export default FlowerShopDetail;
