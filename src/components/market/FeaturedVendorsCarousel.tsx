import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, Package, Store } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendors, useVendorProductCount } from '@/hooks/useMarketplaceVendors';
import { UnifiedSectionHeader, UnifiedScrollSection } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MarketplaceVendor } from '@/types/marketplace';

interface VendorCardProps {
  vendor: MarketplaceVendor;
  onClick: () => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor, onClick }) => {
  const { language } = useLanguage();
  const { count: productCount } = useVendorProductCount(vendor.id);
  const isRu = language === 'ru';
  
  const name = isRu ? vendor.name_ru : vendor.name_en;
  const description = isRu ? vendor.description_ru : vendor.description_en;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-[200px] shrink-0 text-left",
        "bg-card rounded-2xl border border-border overflow-hidden",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        "transition-all duration-200 group touch-manipulation"
      )}
    >
      {/* Cover / Logo Area */}
      <div className="relative h-24 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        {vendor.logo_url ? (
          <img
            src={vendor.logo_url}
            alt={name}
            className="w-16 h-16 rounded-xl object-cover shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
            <Store className="w-8 h-8 text-primary" />
          </div>
        )}
        
        {/* Verified Badge */}
        {vendor.verified && (
          <Badge className="absolute top-2 right-2 bg-success text-success-foreground text-[10px] px-2 py-0.5 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {isRu ? 'Проверен' : 'Verified'}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
          {name}
        </h4>
        
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-snug">
            {description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 mt-2">
          {vendor.rating && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3.5 h-3.5 fill-warning text-warning" />
              <span className="font-medium text-foreground">{vendor.rating.toFixed(1)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="w-3.5 h-3.5" />
            <span>{productCount} {isRu ? 'товаров' : 'items'}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

interface FeaturedVendorsCarouselProps {
  className?: string;
}

export const FeaturedVendorsCarousel: React.FC<FeaturedVendorsCarouselProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { vendors, isLoading } = useVendors();
  const isRu = language === 'ru';

  // Only show if we have vendors
  if (!isLoading && vendors.length === 0) return null;

  return (
    <section className={cn("py-4 bg-muted/30", className)}>
      <div className="px-4 max-w-7xl mx-auto">
        <UnifiedSectionHeader
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          title={isRu ? 'Проверенные продавцы' : 'Verified Vendors'}
          viewAllPath="/market/vendors"
          viewAllLabel={isRu ? 'Все' : 'All'}
        />
      </div>

      {isLoading ? (
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[200px] h-[180px] rounded-2xl shrink-0" />
          ))}
        </div>
      ) : (
        <UnifiedScrollSection variant="muted">
          {vendors.slice(0, 10).map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onClick={() => navigate(`/market/vendor/${vendor.slug}`)}
            />
          ))}
        </UnifiedScrollSection>
      )}
    </section>
  );
};
