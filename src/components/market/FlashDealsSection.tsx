import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCartToast } from '@/hooks/useCartToast';
import { UnifiedSectionHeader, UnifiedScrollSection } from '@/components/shared';
import { ProfessionalProductCard } from './ProfessionalProductCard';
import { Progress } from '@/components/ui/progress';
import { MarketplaceProduct } from '@/types/marketplace';
import { cn } from '@/lib/utils';

interface FlashDealsSectionProps {
  products: MarketplaceProduct[];
  className?: string;
}

// Countdown hook
function useCountdown(endTime: Date) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return timeLeft;
}

function getTimeRemaining(endTime: Date) {
  const total = Math.max(0, endTime.getTime() - Date.now());
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { total, hours, minutes, seconds };
}

function formatTime(num: number): string {
  return num.toString().padStart(2, '0');
}

export const FlashDealsSection: React.FC<FlashDealsSectionProps> = ({
  products,
  className,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { showAddedToast } = useCartToast();
  const isRu = language === 'ru';
  const cartItems = getItemsByType('product');

  // Filter flash deal products - prioritize is_flash_deal flag, fallback to discounted items
  const flashDealProducts = React.useMemo(() => {
    // First try products marked as flash deals in DB
    const markedFlashDeals = products.filter(p => 
      (p as any).is_flash_deal === true && 
      p.original_price && 
      p.original_price > p.price
    );
    
    // If no marked flash deals, fallback to discounted products
    if (markedFlashDeals.length > 0) {
      return markedFlashDeals.slice(0, 8);
    }
    
    return products
      .filter(p => p.original_price && p.original_price > p.price)
      .slice(0, 8);
  }, [products]);

  // Get earliest flash deal end time from DB, or default to midnight
  const endTime = React.useMemo(() => {
    const flashDealEndTimes = flashDealProducts
      .map(p => (p as any).flash_deal_ends_at)
      .filter(Boolean)
      .map(d => new Date(d).getTime());
    
    if (flashDealEndTimes.length > 0) {
      return new Date(Math.min(...flashDealEndTimes));
    }
    
    // Default to next midnight
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }, [flashDealProducts]);

  const { hours, minutes, seconds } = useCountdown(endTime);

  if (flashDealProducts.length === 0) return null;

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

  return (
    <section className={cn("py-3 bg-gradient-to-r from-destructive/5 to-warning/5", className)}>
      <div className="px-4 max-w-7xl mx-auto">
        {/* Header with Countdown */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-destructive/10 rounded-lg">
              <Zap className="w-5 h-5 text-destructive fill-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isRu ? 'Успей купить' : 'Flash Deals'}
            </h2>
          </div>
          
          {/* Countdown Timer */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">
              {isRu ? 'До' : 'Ends in'}
            </span>
            <div className="flex items-center gap-0.5">
              <TimeBlock value={hours} />
              <span className="text-destructive font-bold">:</span>
              <TimeBlock value={minutes} />
              <span className="text-destructive font-bold">:</span>
              <TimeBlock value={seconds} />
            </div>
          </div>
        </div>
      </div>

      {/* Products - horizontal scroll */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-y pb-3">
        {flashDealProducts.map((product, index) => {
          // Simulate stock remaining (visual only)
          const stockPercent = Math.max(10, 100 - (index * 12 + 15));
          
          return (
            <div key={product.id} className="w-[150px] shrink-0 snap-start">
              <div className="relative">
                <ProfessionalProductCard
                  product={product}
                  quantity={getQuantity(product.id)}
                  onAdd={() => handleAdd(product)}
                  onRemove={() => handleRemove(product.id)}
                  onClick={() => navigate(`/market/product/${product.id}`)}
                  compact
                />
                
                {/* Stock Progress Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span className="text-destructive font-medium">{isRu ? 'Осталось' : 'Left'} {stockPercent}%</span>
                  </div>
                  <Progress 
                    value={stockPercent} 
                    className="h-1 bg-destructive/20"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Time block component
const TimeBlock: React.FC<{ value: number }> = ({ value }) => (
  <span className="bg-destructive text-white text-xs font-bold px-1.5 py-0.5 rounded">
    {formatTime(value)}
  </span>
);
