import React, { memo, useCallback } from 'react';
import { Star, MapPin, Clock, BadgeCheck, Palmtree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerRipple } from '@/hooks/useRipple';
import { getCurrencySymbol } from '@/lib/config/currencies';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

type CardVariant = 'vertical' | 'horizontal' | 'compact' | 'featured';

interface UnifiedCardProps {
  id: string;
  image?: string;
  title: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  currency?: string;
  priceLabel?: string;
  location?: string;
  duration?: string;
  tags?: string[];
  isVerified?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: CardVariant;
}

export const UnifiedCard = memo(function UnifiedCard({
  image,
  title,
  subtitle,
  rating,
  reviewCount,
  price,
  currency = 'THB',
  priceLabel,
  location,
  duration,
  tags,
  isVerified,
  isNew,
  isFeatured,
  onClick,
  className,
  variant = 'vertical',
}: UnifiedCardProps) {
  const { t } = useLanguage();
  const currencySymbol = getCurrencySymbol(currency);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    triggerRipple(e);
    onClick?.();
  }, [onClick]);

  // Compact variant - minimal info, small image
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group relative overflow-hidden rounded-xl bg-card border border-border/50",
          "transition-all duration-200 cursor-pointer",
          "hover:border-primary/30 hover:[box-shadow:var(--shadow-elevation-2)]",
          "active:scale-[0.98]",
          "flex flex-col w-36 flex-shrink-0",
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden">
          {image && image.trim() !== '' ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES.cardFallback;
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Palmtree className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
          {isNew && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary text-primary-foreground">
              {t('label.new')}
            </span>
          )}
        </div>
        <div className="p-2 space-y-0.5">
          <h3 className="font-medium text-xs text-foreground line-clamp-2 leading-tight">{title}</h3>
          {price !== undefined && (
            <span className="text-xs font-semibold text-primary">
              {currencySymbol}{price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant - image left, content right
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group relative overflow-hidden rounded-xl bg-card border border-border/50",
          "transition-all duration-200 cursor-pointer",
          "hover:border-primary/30 hover:[box-shadow:var(--shadow-elevation-2)]",
          "active:scale-[0.98]",
          "flex gap-3 p-3",
          className
        )}
      >
        {/* Image */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          {image && image.trim() !== '' ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES.cardFallback;
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Palmtree className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}
          {isNew && (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-primary text-primary-foreground">
              {t('label.new')}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1 flex items-center gap-1">
              {title}
              {isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {rating !== undefined && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{location}</span>
                </div>
              )}
            </div>
            {price !== undefined && (
              <span className="text-sm font-bold text-primary flex-shrink-0">
                {currencySymbol}{price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Featured variant - larger, gradient overlay
  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group relative overflow-hidden rounded-xl",
          "transition-all duration-300 cursor-pointer",
          "hover:[box-shadow:var(--shadow-elevation-4)] hover:scale-[1.01]",
          "active:scale-[0.99]",
          className
        )}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {image && image.trim() !== '' ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=800';
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Palmtree className="w-16 h-16 text-primary/30" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isNew && (
                  <span className="inline-block mb-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                    {t('label.new')}
                  </span>
                )}
                <h3 className="font-bold text-xl text-white line-clamp-2 flex items-center gap-2">
                  {title}
                  {isVerified && <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" />}
                </h3>
                {subtitle && (
                  <p className="text-sm text-white/80 line-clamp-1 mt-1">{subtitle}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-white/70">
                  {rating !== undefined && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="font-medium text-white">{rating.toFixed(1)}</span>
                      {reviewCount && <span>({reviewCount})</span>}
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {price !== undefined && (
                <div className="text-right flex-shrink-0">
                  <div className="px-4 py-2 rounded-xl glass">
                    <span className="text-2xl font-bold text-primary">
                      {currencySymbol}{price.toLocaleString()}
                    </span>
                    {priceLabel && (
                      <span className="block text-xs text-muted-foreground">{priceLabel}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default vertical variant
  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border/50",
        "transition-all duration-300 ease-out cursor-pointer",
        "hover:border-primary/30 hover:shadow-elevated hover:scale-[1.02]",
        "active:scale-[0.98] active:opacity-90",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {image && image.trim() !== '' ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=600';
            }}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Palmtree className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isNew && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
              {t('label.new')}
            </span>
          )}
          {isFeatured && (
            <span className="px-2 py-1 text-xs font-medium rounded-full glass-gold text-primary">
              {t('label.featured')}
            </span>
          )}
        </div>

        {/* Price badge */}
        {price !== undefined && (
          <div className="absolute bottom-3 right-3">
            <div className="px-3 py-1.5 rounded-lg glass">
              <span className="text-lg font-bold text-primary">
                {currencySymbol}{price.toLocaleString()}
              </span>
              {priceLabel && (
                <span className="text-xs text-muted-foreground ml-1">{priceLabel}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug flex items-start gap-1.5">
              <span className="break-words">{title}</span>
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              )}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {location && (
            <div className="flex items-center gap-1 max-w-[140px]">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
