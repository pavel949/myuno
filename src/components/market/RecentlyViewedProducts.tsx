import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { UnifiedSectionHeader, UnifiedScrollSection } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecentProduct {
  id: string;
  name_en: string;
  name_ru: string;
  price: number;
  cover_image: string | null;
  vendor_name: string | null;
}

interface RecentlyViewedProductsProps {
  className?: string;
}

export const RecentlyViewedProducts: React.FC<RecentlyViewedProductsProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items: recentProducts, clearAll, hasHistory } = useRecentlyViewed<RecentProduct>('myuno_recently_viewed_products');
  const isRu = language === 'ru';

  if (!hasHistory) return null;

  return (
    <section className={cn("py-3", className)}>
      <div className="px-4 max-w-[1536px] mx-auto flex items-center justify-between mb-2">
        <UnifiedSectionHeader
          icon={Eye}
          iconColor="text-muted-foreground"
          title={isRu ? 'Недавно смотрели' : 'Recently Viewed'}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="w-3 h-3 mr-1" />
          {isRu ? 'Очистить' : 'Clear'}
        </Button>
      </div>

      <UnifiedScrollSection>
        {recentProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => navigate(`/market/product/${product.id}`)}
            className={cn(
              "w-[120px] shrink-0 text-left",
              "bg-card rounded-xl border border-border overflow-hidden",
              "shadow-sm hover:shadow-md hover:-translate-y-0.5",
              "transition-all duration-200 group touch-manipulation"
            )}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={product.cover_image || '/placeholder.svg'}
                alt=""
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            <div className="p-2">
              <h4 className="text-xs font-medium line-clamp-2 text-foreground leading-tight min-h-[2rem]">
                {isRu ? product.name_ru : product.name_en}
              </h4>
              <p className="text-sm font-bold text-primary mt-1">
                {formatPrice(product.price)}
              </p>
            </div>
          </button>
        ))}
      </UnifiedScrollSection>
    </section>
  );
};
