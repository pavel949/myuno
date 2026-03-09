import React from 'react';
import { Star, MapPin, Clock, Users, Shield, BadgeCheck, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { triggerRipple } from '@/hooks/useRipple';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { iconSizes } from '@/lib/iconMap';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

export interface ItemCardMeta {
  icon: LucideIcon;
  value?: string | number;
  label?: string;
}

export interface ItemCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  onClick?: () => void;
  price?: number;
  originalPrice?: number;
  priceLabel?: string;
  pricePrefix?: string;
  priceUnit?: string;
  /** @deprecated Use useCurrency context instead. This prop is ignored. */
  currency?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  meta?: ItemCardMeta[];
  tags?: string[];
  isVerified?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;
  badge?: { text: string; className?: string };
  variant?: 'horizontal' | 'vertical';
  className?: string;
  /** Optional CTA button label. When provided, renders a small action button. */
  ctaLabel?: string;
  /** Optional CTA click handler. Defaults to onClick if not provided. */
  onCtaClick?: () => void;
}

export const ItemCard = React.forwardRef<HTMLDivElement, ItemCardProps>(
  (
    {
      title,
      subtitle,
      image,
      onClick,
      price,
      originalPrice,
      priceLabel,
      pricePrefix,
      priceUnit,
      currency: _currency, // Deprecated, ignored
      rating,
      reviewCount,
      location,
      meta = [],
      tags = [],
      isVerified,
      isNew,
      isFeatured,
      isAvailable = true,
      badge,
      variant = 'horizontal',
      className,
      ctaLabel,
      onCtaClick,
    },
    ref
  ) => {
  const { language, t } = useLanguage();
  const { formatPrice, currencyInfo } = useCurrency();
  const symbol = currencyInfo.symbol;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAvailable) return;
    triggerRipple(e);
    onClick?.();
  };

  const discount = originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 0;

  if (variant === 'vertical') {
    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden rounded-xl bg-card border border-border/60 transition-all [box-shadow:var(--shadow-elevation-2)]",
          isAvailable && "cursor-pointer hover:border-primary/30 hover:[box-shadow:var(--shadow-elevation-3)] hover:-translate-y-0.5 active:scale-[0.98]",
          !isAvailable && "opacity-60",
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <OptimizedImage
            src={image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400'}
            alt={title}
            aspectRatio="1:1"
            width={200}
            quality={75}
            sizes="(max-width: 640px) 50vw, 200px"
            className={cn("w-full h-full", !isAvailable && "grayscale")}
          />
          
          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-destructive text-destructive-foreground">
                -{discount}%
              </span>
            )}
            {isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary text-primary-foreground">
                NEW
              </span>
            )}
            {isFeatured && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary text-primary-foreground flex items-center gap-0.5">
                <Star className={cn(iconSizes.xs, "fill-current")} />
              </span>
            )}
            {badge && (
              <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", badge.className || "bg-primary text-primary-foreground")}>
                {badge.text}
              </span>
            )}
          </div>
          
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-medium px-3 py-1 rounded bg-black/50">
                {t('booking.unavailable')}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] text-foreground">{title}</h3>
          
          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <Star className={cn(iconSizes.xs, "fill-primary text-primary")} />
              <span className="text-xs font-medium">{rating}</span>
              {reviewCount !== undefined && (
                <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
              )}
            </div>
          )}
          
          {/* Price */}
          {price !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-base font-bold text-foreground">
                {formatPrice(price)}
              </span>
              {originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={cn(
        "bg-card rounded-xl overflow-hidden border border-border/60 [box-shadow:var(--shadow-elevation-2)]",
        isAvailable && "cursor-pointer hover:[box-shadow:var(--shadow-elevation-3)] hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.98]",
        !isAvailable && "opacity-60",
        "transition-all",
        className
      )}
    >
      <div className="flex">
        {/* Image - larger on mobile for better tap targets */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 relative overflow-hidden rounded-2xl">
          <OptimizedImage
            src={image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400'}
            alt={title}
            aspectRatio="1:1"
            width={128}
            quality={75}
            sizes="128px"
            className={cn("w-full h-full", !isAvailable && "grayscale")}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
             {isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary text-primary-foreground">
                NEW
              </span>
            )}
            {isFeatured && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary text-primary-foreground flex items-center gap-0.5">
                <Star className={cn(iconSizes.xs, "fill-current")} />
              </span>
            )}
            {badge && (
              <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", badge.className || "bg-primary text-primary-foreground")}>
                {badge.text}
              </span>
            )}
          </div>
          
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-medium px-3 py-1 rounded bg-black/50 text-xs">
                {language === 'ru' ? 'Занято' : 'Unavailable'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
          <div>
            {/* Title */}
            <h3 className="font-bold text-sm sm:text-base line-clamp-2 flex items-center gap-1 text-foreground">
              {title}
              {isVerified && (
                <BadgeCheck className={cn(iconSizes.md, "text-primary flex-shrink-0")} />
              )}
            </h3>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className={iconSizes.xs} />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}

            {/* Meta + Rating */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              {meta.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                  <item.icon className={iconSizes.sm} />
                  {item.value || item.label}
                </span>
              ))}
              {rating !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className={cn(iconSizes.sm, "fill-primary text-primary")} />
                  {rating}
                  {reviewCount !== undefined && (
                    <span className="text-muted-foreground">({reviewCount})</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Bottom row: Tags + Price */}
          <div className="flex items-center justify-between mt-2">
            {/* Tags */}
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 2).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px] px-1.5">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="flex items-center gap-2">
              {price !== undefined && (
                <div className="text-right">
                  {pricePrefix && <span className="text-xs text-muted-foreground mr-1">{pricePrefix}</span>}
                  <span className="text-base font-bold text-foreground">
                    {formatPrice(price)}
                  </span>
                  {priceUnit && <span className="text-xs text-muted-foreground">{priceUnit}</span>}
                  {priceLabel && (
                    <span className="text-xs text-muted-foreground">
                      {priceLabel}
                    </span>
                  )}
                </div>
              )}
              {ctaLabel && (
                <button
                  onClick={(e) => { e.stopPropagation(); (onCtaClick || onClick)?.(); }}
                  className="text-[11px] font-semibold text-primary-foreground bg-primary px-2.5 py-1 rounded-md whitespace-nowrap flex-shrink-0"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
ItemCard.displayName = "ItemCard";
