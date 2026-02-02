import React, { forwardRef } from 'react';
import { Star, Plus, Minus, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DESIGN_TOKENS, CARD_STYLES, IMAGE_STYLES, BADGE_STYLES } from '@/lib/designTokens';
import { CARD_ANIMATIONS } from '@/lib/motionPresets';

export type ContentCardVariant = 'product' | 'service' | 'experience' | 'property';
export type ContentCardSize = 'compact' | 'default' | 'featured';
export type ContentCardOrientation = 'vertical' | 'horizontal';

interface UnifiedContentCardProps {
  /** Card variant determines layout and styling nuances */
  variant: ContentCardVariant;
  /** Size affects padding, font sizes, and information density */
  size?: ContentCardSize;
  /** Orientation for horizontal vs vertical layouts */
  orientation?: ContentCardOrientation;
  
  // Content
  image?: string;
  title: string;
  subtitle?: string;
  description?: string;
  
  // Metadata
  rating?: number;
  reviewCount?: number;
  price?: number | string;
  originalPrice?: number;
  duration?: string;
  location?: string;
  
  // Badges
  badge?: string;
  badgeVariant?: 'primary' | 'hot' | 'new' | 'discount' | 'muted';
  isNew?: boolean;
  isPopular?: boolean;
  discount?: number;
  
  // Cart (for product variant)
  quantity?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  
  // Interaction
  onClick?: () => void;
  className?: string;
}

const fallbackImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';

export const UnifiedContentCard = forwardRef<HTMLDivElement, UnifiedContentCardProps>(({
  variant,
  size = 'default',
  orientation = 'vertical',
  image,
  title,
  subtitle,
  description,
  rating,
  reviewCount,
  price,
  originalPrice,
  duration,
  location,
  badge,
  badgeVariant = 'muted',
  isNew,
  isPopular,
  discount,
  quantity = 0,
  onAdd,
  onRemove,
  onClick,
  className,
}, ref) => {
  const isCompact = size === 'compact';
  const isFeatured = size === 'featured';
  const isHorizontal = orientation === 'horizontal';
  const showCart = variant === 'product' && onAdd;
  
  // Determine which badge to show (priority order)
  const primaryBadge = badge || (isNew ? 'NEW' : isPopular ? '🔥 HIT' : null);
  const primaryBadgeVariant = badge ? badgeVariant : (isNew ? 'new' : isPopular ? 'hot' : 'muted');

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = fallbackImage;
  };

  // Horizontal layout
  if (isHorizontal) {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'flex gap-3 bg-card border border-border rounded-2xl p-3',
          'hover:shadow-md transition-all duration-200 cursor-pointer group',
          className
        )}
      >
        {/* Image */}
        <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden">
          <img
            src={image || fallbackImage}
            alt=""
            className={cn(IMAGE_STYLES.hover)}
            onError={handleImageError}
          />
          {primaryBadge && (
            <Badge className={cn('absolute top-1.5 left-1.5', BADGE_STYLES[primaryBadgeVariant])}>
              {primaryBadge}
            </Badge>
          )}
          {discount && discount > 0 && (
            <Badge className={cn('absolute top-1.5 right-1.5', BADGE_STYLES.discount)}>
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
            )}
          </div>

          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {rating.toFixed(1)}
                </span>
              </div>
              {reviewCount !== undefined && (
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              )}
            </div>
          )}

          {/* Price & Cart */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base">{price}</span>
              {originalPrice && (
                <span className="text-xs text-muted-foreground line-through">{originalPrice}</span>
              )}
            </div>
            
            {showCart && (
              quantity === 0 ? (
                <Button 
                  size="sm" 
                  className="h-8 px-4 rounded-full shadow-sm"
                  onClick={(e) => { e.stopPropagation(); onAdd?.(); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={onRemove}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
                  <Button size="icon" className="h-7 w-7 rounded-full" onClick={onAdd}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        CARD_STYLES.interactive,
        isCompact && 'rounded-xl',
        isFeatured && 'shadow-lg',
        className
      )}
    >
      {/* Image Container */}
      <div className={cn(
        'relative overflow-hidden cursor-pointer',
        isFeatured ? 'aspect-[4/3]' : 'aspect-square'
      )}>
        <img
          src={image || fallbackImage}
          alt=""
          className={cn(IMAGE_STYLES.hover)}
          onError={handleImageError}
        />
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        
        {/* Left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {primaryBadge && (
            <Badge className={cn(BADGE_STYLES[primaryBadgeVariant])}>
              {primaryBadge}
            </Badge>
          )}
        </div>
        
        {/* Right badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {discount && discount > 0 && (
            <Badge className={cn(BADGE_STYLES.discount)}>
              -{discount}%
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn(isCompact ? 'p-2' : 'p-3')}>
        {/* Subtitle/Vendor (hide in compact) */}
        {subtitle && !isCompact && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1 truncate">
            {subtitle}
          </p>
        )}
        
        {/* Title */}
        <h3 className={cn(
          'font-semibold line-clamp-2 text-foreground leading-tight',
          isCompact ? 'text-xs min-h-[2rem]' : 'text-sm min-h-[2.5rem]'
        )}>
          {title}
        </h3>
        
        {/* Description (hide in compact) */}
        {description && !isCompact && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
            {description}
          </p>
        )}
        
        {/* Location or Duration */}
        {(location || duration) && !isCompact && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {duration}
              </span>
            )}
          </div>
        )}
        
        {/* Rating (hide in compact) */}
        {rating !== undefined && !isCompact && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                {rating.toFixed(1)}
              </span>
            </div>
            {reviewCount !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price & Cart Row */}
        <div className={cn(
          'flex items-end justify-between border-t border-border/50',
          isCompact ? 'mt-2 pt-1.5' : 'mt-3 pt-2'
        )}>
          <div className="flex flex-col">
            <span className={cn(
              'font-bold leading-none text-foreground',
              isCompact ? 'text-sm' : 'text-lg'
            )}>
              {price}
            </span>
            {originalPrice && !isCompact && (
              <span className="text-xs text-muted-foreground line-through mt-0.5">
                {originalPrice}
              </span>
            )}
          </div>
          
          {/* Cart Controls (product variant only) */}
          {showCart && (
            quantity === 0 ? (
              <Button 
                size="icon" 
                className={cn('rounded-full shrink-0', isCompact ? 'h-7 w-7' : 'h-8 w-8')}
                onClick={(e) => { e.stopPropagation(); onAdd?.(); }}
              >
                <Plus className={cn(isCompact ? 'h-3 w-3' : 'h-4 w-4')} />
              </Button>
            ) : (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={onRemove}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
                <Button size="icon" className="h-7 w-7 rounded-full" onClick={onAdd}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )
          )}
          
          {/* Rating badge for compact cards without cart */}
          {!showCart && rating !== undefined && isCompact && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

UnifiedContentCard.displayName = 'UnifiedContentCard';
