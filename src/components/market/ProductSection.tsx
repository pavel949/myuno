import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCartToast } from '@/hooks/useCartToast';
import { MarketplaceProduct } from '@/types/marketplace';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';

interface ProductSectionProps {
  title: string;
  titleRu: string;
  products: MarketplaceProduct[];
  seeAllPath?: string;
  maxItems?: number;
  variant?: 'scroll' | 'grid';
  isLoading?: boolean;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  titleRu,
  products,
  seeAllPath,
  maxItems = 6,
  variant = 'scroll',
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();

  const displayProducts = products.slice(0, maxItems);
  const cartItems = getItemsByType('product');

  const getQuantity = (productId: string) => {
    return cartItems.find(i => i.id === productId)?.quantity || 0;
  };

  const handleAdd = (product: MarketplaceProduct) => {
    const item = {
      id: product.id,
      type: 'product' as const,
      name: product.name_en,
      nameRu: product.name_ru,
      price: product.price,
      currency: '฿',
      image: product.cover_image || undefined,
      providerId: 'marketplace',
      providerName: product.vendor_name || 'myUNO Market',
      providerNameRu: product.vendor_name_ru || 'myUNO Маркет',
    };
    addItem(item);
    showAddedToast({ item, cartPath: '/market/checkout' });
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-[160px] shrink-0">
              <div className="aspect-square bg-muted rounded-xl mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 mb-1 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {language === 'ru' ? titleRu : title}
        </h2>
        {seeAllPath && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary -mr-2"
            onClick={() => navigate(seeAllPath)}
          >
            {language === 'ru' ? 'Все' : 'See all'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Products */}
      {variant === 'scroll' ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {displayProducts.map(product => (
            <div key={product.id} className="w-[160px] shrink-0">
              <ProductCard
                product={product}
                quantity={getQuantity(product.id)}
                onAdd={() => handleAdd(product)}
                onRemove={() => handleRemove(product.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {displayProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={getQuantity(product.id)}
              onAdd={() => handleAdd(product)}
              onRemove={() => handleRemove(product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
