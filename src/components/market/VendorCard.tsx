import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Store, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketplaceVendor } from '@/types/marketplace';
import { cn } from '@/lib/utils';

interface VendorCardProps {
  vendor: MarketplaceVendor;
  productCount?: number;
  className?: string;
  compact?: boolean;
}

export const VendorCard: React.FC<VendorCardProps> = ({ 
  vendor, 
  productCount = 0,
  className,
  compact = false
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const name = language === 'ru' ? vendor.name_ru : vendor.name_en;
  const description = language === 'ru' 
    ? (vendor.description_ru || vendor.description_en) 
    : (vendor.description_en || vendor.description_ru);

  const handleClick = () => {
    navigate(`/market/vendor/${vendor.slug}`);
  };

  if (compact) {
    return (
      <Card 
        className={cn(
          "border-border/50 hover:border-primary/30 transition-all cursor-pointer group hover:shadow-md",
          className
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-muted/80 flex items-center justify-center overflow-hidden shrink-0">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{name}</span>
                {vendor.verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" />
                )}
              </div>
              {vendor.rating && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{vendor.rating}</span>
                </div>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden border-border/50 hover:border-primary/30 transition-all cursor-pointer group hover:shadow-lg",
        className
      )}
      onClick={handleClick}
    >
      {/* Cover Image */}
      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5">
        {vendor.cover_image && (
          <img 
            src={vendor.cover_image} 
            alt={name}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Logo overlay */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-14 h-14 rounded-xl bg-background border-2 border-background shadow-lg flex items-center justify-center overflow-hidden">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Verified badge */}
        {vendor.verified && (
          <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs gap-1">
            <CheckCircle className="w-3 h-3" />
            {language === 'ru' ? 'Проверен' : 'Verified'}
          </Badge>
        )}
      </div>

      <CardContent className="pt-8 pb-4 px-4">
        {/* Vendor name and rating */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{name}</h3>
          {vendor.rating && (
            <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {vendor.rating}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{productCount} {language === 'ru' ? 'товаров' : 'products'}</span>
          <span>{vendor.review_count} {language === 'ru' ? 'отзывов' : 'reviews'}</span>
        </div>
      </CardContent>
    </Card>
  );
};
