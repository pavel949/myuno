import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Search,
  Plus,
  Minus,
  Heart,
  PackageOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStores';
import { useVendorProducts } from '@/hooks/useMarketplaceVendors';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { useCartToast } from '@/hooks/useCartToast';
import { MarketComingSoonOverlay } from '@/components/market/MarketComingSoonOverlay';

interface StoreProduct {
  id: string;
  nameEn: string;
  nameRu: string;
  price: number;
  originalPrice?: number;
  image: string;
  unit: string;
  unitRu: string;
  inStock: boolean;
}

const StoreDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { store, isLoading } = useStore(id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const { showAddedToast } = useCartToast();

  // Real products from DB: stores.provider_id → marketplace_products.vendor_id
  const { products: dbProducts, isLoading: productsLoading } = useVendorProducts(
    store?.provider_id ?? undefined
  );

  const products = useMemo<StoreProduct[]>(
    () =>
      (dbProducts ?? []).map((p: any) => ({
        id: p.id,
        nameEn: p.name_en,
        nameRu: p.name_ru ?? p.name_en,
        price: Number(p.price ?? 0),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        image:
          (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined) ??
          PLACEHOLDER_IMAGES.store,
        unit: p.unit ?? 'piece',
        unitRu: p.unit_ru ?? 'шт',
        inStock: p.in_stock ?? true,
      })),
    [dbProducts]
  );

  const cartItems = getItemsByType('product');

  const getProductQuantity = (productId: string) => {
    const item = cartItems.find((i) => i.id === productId);
    return item?.quantity || 0;
  };

  const handleAddToCart = (product: StoreProduct) => {
    const item = {
      id: product.id,
      type: 'product' as const,
      name: product.nameEn,
      nameRu: product.nameRu,
      price: product.price,
      currency: '฿',
      image: product.image,
      providerId: store?.id,
      providerName: store?.name_en,
      providerNameRu: store?.name_ru,
    };
    addItem(item);
    showAddedToast({ item, cartPath: '/market/checkout' });
  };

  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId);
  };

  const filteredProducts = products.filter(
    (p) =>
      searchQuery === '' ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameRu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p>{language === 'ru' ? 'Загрузка...' : 'Loading...'}</p>
        </div>
      </AppLayout>
    );
  }

  if (!store) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p>{language === 'ru' ? 'Магазин не найден' : 'Store not found'}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-32">
        {/* Hero Image */}
        <div className="relative h-48">
          <img src={store.cover_image || PLACEHOLDER_IMAGES.store} alt={language === 'ru' ? store.name_ru : store.name_en} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90" onClick={() => navigate('/market')} aria-label={language === 'ru' ? 'Назад' : 'Back'}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="icon" className="rounded-full bg-white/90" onClick={() => setIsFavorite(!isFavorite)} aria-label={language === 'ru' ? 'В избранное' : 'Favorite'}>
                <Heart className={cn("h-5 w-5", isFavorite && "fill-destructive text-destructive")} />
              </Button>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl font-bold">{language === 'ru' ? store.name_ru : store.name_en}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span>{store.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{store.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={language === 'ru' ? 'Поиск товаров...' : 'Search products...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Products */}
        <div className="px-4">
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground">
              <PackageOpen className="h-10 w-10 mb-3 opacity-60" />
              <p className="text-sm font-medium">
                {searchQuery
                  ? language === 'ru' ? 'Ничего не найдено' : 'No matches'
                  : language === 'ru' ? 'Магазин ещё не добавил товары' : 'This store has no products yet'}
              </p>
              {!searchQuery && (
                <p className="text-xs mt-1">
                  {language === 'ru' ? 'Загляните позже' : 'Check back later'}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  quantity={getProductQuantity(product.id)}
                  onAdd={() => handleAddToCart(product)}
                  onRemove={() => handleRemoveFromCart(product.id)}
                />
              ))}
            </div>
          )}
        </div>

        <StickyCartBar
          providerId={store?.id}
          checkoutPath="/market/checkout"
          checkoutState={{
            storeId: store?.id,
            storeName: store?.name_en,
            storeNameRu: store?.name_ru,
            deliveryFee: store?.delivery_fee,
            minOrder: store?.min_order_amount,
          }}
        />
        <MarketComingSoonOverlay />
      </div>
    </AppLayout>
  );
};

interface ProductCardProps {
  product: StoreProduct;
  language: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, language, quantity, onAdd, onRemove }) => {
  return (
    <div className="bg-card rounded-none border border-border overflow-hidden">
      <div className="relative aspect-square">
        <img src={product.image} alt={language === 'ru' ? product.nameRu : product.nameEn} className="w-full h-full object-cover" />
        {product.originalPrice && (
          <Badge className="absolute top-2 left-2 bg-destructive text-white text-[10px]">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{language === 'ru' ? product.nameRu : product.nameEn}</h3>
        <p className="text-xs text-muted-foreground mt-1">{language === 'ru' ? product.unitRu : product.unit}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold">฿{product.price}</span>
          {quantity === 0 ? (
            <Button size="icon" className="min-h-[44px] min-w-[44px] h-8 w-8 rounded-full" onClick={onAdd} aria-label={language === 'ru' ? 'Добавить' : 'Add'}><Plus className="h-4 w-4" /></Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="min-h-[44px] min-w-[44px] h-7 w-7 rounded-full" onClick={onRemove} aria-label={language === 'ru' ? 'Убрать один' : 'Decrease quantity'}><Minus className="h-3 w-3" /></Button>
              <span className="text-sm font-medium w-4 text-center">{quantity}</span>
              <Button size="icon" className="min-h-[44px] min-w-[44px] h-7 w-7 rounded-full" onClick={onAdd} aria-label={language === 'ru' ? 'Добавить один' : 'Increase quantity'}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
