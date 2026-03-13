import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { useUserCollections } from '@/hooks/useUserCollections';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { useCart } from '@/contexts/CartContext';
import { ProductCard } from '@/components/market/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketComingSoonOverlay } from '@/components/market/MarketComingSoonOverlay';

export default function WishlistPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { wishlist, isLoading: wishlistLoading } = useUserCollections({ itemType: 'product' });
  const { products, isLoading: productsLoading } = useMarketplaceProducts();
  const { addItem, updateQuantity, items } = useCart();

  const wishlistProducts = products.filter(p => 
    wishlist.some(w => w.item_id === p.id)
  );

  const isLoading = wishlistLoading || productsLoading;

  const getItemQuantity = (productId: string): number => {
    const item = items.find(i => i.id === productId);
    return item?.quantity || 0;
  };

  const handleRemove = (productId: string) => {
    const currentQty = getItemQuantity(productId);
    if (currentQty > 1) {
      updateQuantity(productId, currentQty - 1);
    } else {
      updateQuantity(productId, 0);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">
              {language === 'ru' ? 'Избранное' : 'Wishlist'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {wishlistProducts.length} {language === 'ru' ? 'товаров' : 'items'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">
              {language === 'ru' ? 'Список пуст' : 'Wishlist is empty'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              {language === 'ru' 
                ? 'Добавляйте товары в избранное, чтобы не потерять их' 
                : 'Save items you like to find them easily later'}
            </p>
            <Button onClick={() => navigate('/market')}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'За покупками' : 'Start Shopping'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getItemQuantity(product.id)}
                onAdd={() => addItem({
                  id: product.id,
                  type: 'product',
                  name: language === 'ru' ? product.name_ru : product.name_en,
                  price: product.price,
                  currency: product.currency,
                  image: product.cover_image || undefined
                })}
                onRemove={() => handleRemove(product.id)}
                onClick={() => navigate(`/market/product/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <MarketComingSoonOverlay />
    </div>
  );
}
