import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { MarketProduct } from '@/data/marketplaceProducts';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { useCartToast } from '@/hooks/useCartToast';

interface ProductSectionProps {
  title: string;
  titleRu: string;
  products: MarketProduct[];
  seeAllPath?: string;
  maxItems?: number;
  variant?: 'scroll' | 'grid';
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  titleRu,
  products,
  seeAllPath,
  maxItems = 6,
  variant = 'scroll',
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();

  const displayProducts = products.slice(0, maxItems);
  const cartItems = getItemsByType('product');

  const getQuantity = (productId: string) => {
    return cartItems.find(i => i.id === productId)?.quantity || 0;
  };

  const handleAdd = (product: MarketProduct) => {
    const item = {
      id: product.id,
      type: 'product' as const,
      name: product.nameEn,
      nameRu: product.nameRu,
      price: product.price,
      currency: '฿',
      image: product.image,
      providerId: product.vendorId || 'marketplace',
      providerName: product.vendorName || 'myUNO Market',
      providerNameRu: product.vendorNameRu || 'myUNO Маркет',
    };
    addItem(item);
    showAddedToast({ item, cartPath: '/market/checkout' });
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  if (products.length === 0) return null;

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
