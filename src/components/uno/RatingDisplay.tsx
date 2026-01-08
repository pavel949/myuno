import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  reviewCount?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: { star: 'w-3 h-3', text: 'text-xs', gap: 'gap-0.5' },
  md: { star: 'w-4 h-4', text: 'text-sm', gap: 'gap-1' },
  lg: { star: 'w-5 h-5', text: 'text-base', gap: 'gap-1' },
};

export function RatingDisplay({
  rating,
  maxRating = 5,
  reviewCount,
  showValue = true,
  size = 'md',
  className,
}: RatingDisplayProps) {
  const { t } = useLanguage();
  const sizes = sizeClasses[size];
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      {/* Stars */}
      <div className={cn("flex items-center", sizes.gap)}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={cn(sizes.star, "fill-primary text-primary")} />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(sizes.star, "text-muted")} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(sizes.star, "fill-primary text-primary")} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={cn(sizes.star, "text-muted")} />
        ))}
      </div>

      {/* Rating value and count */}
      {(showValue || reviewCount !== undefined) && (
        <div className={cn("flex items-center", sizes.gap, sizes.text)}>
          {showValue && (
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
          )}
          {reviewCount !== undefined && (
            <span className="text-muted-foreground">
              ({reviewCount} {t('label.reviews')})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
