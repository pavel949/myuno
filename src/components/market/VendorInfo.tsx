import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, ChevronRight, Package, Store } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketplaceVendor } from '@/types/marketplace';
import { useVendorProductCount } from '@/hooks/useMarketplaceVendors';
import { cn } from '@/lib/utils';

interface VendorInfoProps {
  vendor: MarketplaceVendor | null | undefined;
  isLoading?: boolean;
  className?: string;
}

export const VendorInfo: React.FC<VendorInfoProps> = ({ 
  vendor, 
  isLoading = false,
  className 
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { count: productCount, isLoading: isCountLoading } = useVendorProductCount(vendor?.id);

  if (isLoading) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-none" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vendor) return null;

  const name = language === 'ru' ? vendor.name_ru : vendor.name_en;

  const handleClick = () => {
    navigate(`/market/vendor/${vendor.slug}`);
  };

  return (
    <Card 
      className={cn(
        "border-border/50 hover:border-primary/30 transition-colors cursor-pointer group",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Vendor Logo */}
          <div className="w-14 h-14 rounded-none bg-muted/80 flex items-center justify-center overflow-hidden shrink-0">
            {vendor.logo_url ? (
              <img 
                src={vendor.logo_url} 
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="w-7 h-7 text-muted-foreground" />
            )}
          </div>

          {/* Vendor Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate">{name}</h4>
              {vendor.verified && (
                <CheckCircle className="w-4 h-4 text-primary shrink-0" fill="currentColor" />
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {/* Rating */}
              {vendor.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-medium text-foreground">{vendor.rating}</span>
                  <span className="text-xs">
                    ({vendor.review_count} {language === 'ru' ? 'отзывов' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Product count */}
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Package className="w-3.5 h-3.5" />
              {isCountLoading ? (
                <span>...</span>
              ) : (
                <span>
                  {productCount} {language === 'ru' ? 'товаров' : 'products'}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0">
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
