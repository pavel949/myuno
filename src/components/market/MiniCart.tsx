import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, ChevronRight, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MiniCartProps {
  className?: string;
}

export const MiniCart = forwardRef<HTMLButtonElement | HTMLDivElement, MiniCartProps>(({ className }, ref) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { getItemsByType, getItemCount, removeItem } = useCart();
  const totalItems = getItemCount();
  
  const cartItems = getItemsByType('product');
  const displayItems = cartItems.slice(0, 3);
  const moreCount = cartItems.length - 3;
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (totalItems === 0) {
    return (
      <button 
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn("relative p-2 rounded-full hover:bg-muted transition-colors", className)}
        onClick={() => navigate('/cart')}
      >
        <ShoppingCart className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          ref={ref as React.Ref<HTMLButtonElement>}
          className={cn("relative p-2 rounded-full hover:bg-muted transition-colors", className)}
        >
          <ShoppingCart className="w-6 h-6" />
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0" 
        align="end" 
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">
            {language === 'ru' ? 'Корзина' : 'Cart'}
          </h3>
          <span className="text-sm text-muted-foreground">
            {totalItems} {language === 'ru' 
              ? (totalItems === 1 ? 'товар' : 'товаров') 
              : (totalItems === 1 ? 'item' : 'items')
            }
          </span>
        </div>

        {/* Items */}
        <div className="max-h-64 overflow-y-auto">
          {displayItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">
                  {language === 'ru' && item.nameRu ? item.nameRu : item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {moreCount > 0 && (
            <div className="px-4 py-2 text-center text-sm text-muted-foreground bg-muted/50">
              +{moreCount} {language === 'ru' ? 'ещё' : 'more'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Итого' : 'Subtotal'}
            </span>
            <span className="font-bold text-lg">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/cart')}
            >
              {language === 'ru' ? 'В корзину' : 'View Cart'}
            </Button>
            <Button 
              size="sm" 
              className="flex-1 gap-1"
              onClick={() => navigate('/market/checkout')}
            >
              {language === 'ru' ? 'Оформить' : 'Checkout'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

MiniCart.displayName = 'MiniCart';
