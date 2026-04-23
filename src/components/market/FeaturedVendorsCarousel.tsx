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
        "w-[160px] shrink-0 text-left snap-start",
        "bg-card rounded-none border border-border overflow-hidden",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        "transition-all duration-200 group touch-manipulation"
      )}
    >
      {/* Cover / Logo Area */}
      <div className="relative h-20 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        {vendor.logo_url ? (
          <img
            src={vendor.logo_url}
            alt={name}
            className="w-12 h-12 rounded-none object-cover shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
        )}
        
        {/* Verified Badge */}
        {vendor.verified && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-success rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5">
        <h4 className="font-semibold text-xs text-foreground line-clamp-1">
          {name}
        </h4>

        {/* Stats Row */}
        <div className="flex items-center gap-2 mt-1.5">
          {vendor.rating && (
            <div className="flex items-center gap-0.5 text-[10px]">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span className="font-medium text-foreground">{vendor.rating.toFixed(1)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Package className="w-3 h-3" />
            <span>{productCount}</span>
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
    <section className={cn("py-3 bg-muted/30", className)}>
      <div className="px-4 max-w-[1536px] mx-auto">
        <UnifiedSectionHeader
          icon={CheckCircle2}
          iconColor="text-success"
          title={isRu ? 'Проверенные продавцы' : 'Verified Vendors'}
          viewAllPath="/market/vendors"
          viewAllLabel={isRu ? 'Все' : 'All'}
        />
      </div>

      {isLoading ? (
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[160px] h-[130px] rounded-none shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-proximity touch-pan-y pb-2">
          {vendors.slice(0, 10).map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onClick={() => navigate(`/market/vendor/${vendor.slug}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
