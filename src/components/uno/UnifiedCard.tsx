import React from 'react';
import { Star, MapPin, Clock, BadgeCheck, Palmtree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerRipple } from '@/hooks/useRipple';

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
}

export function UnifiedCard({
  image,
  title,
  subtitle,
  rating,
  reviewCount,
  price,
  currency = '฿',
  priceLabel,
  location,
  duration,
  tags,
  isVerified,
  isNew,
  isFeatured,
  onClick,
  className,
}: UnifiedCardProps) {
  const { t } = useLanguage();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    triggerRipple(e);
    onClick?.();
  };

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
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                {currency}{price.toLocaleString()}
              </span>
              {priceLabel && (
                <span className="text-xs text-muted-foreground ml-1">{priceLabel}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate flex items-center gap-1.5">
              {title}
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          
          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              {reviewCount !== undefined && (
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{location}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
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
}
