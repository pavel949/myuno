import React from 'react';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { Star, Clock, Users, MapPin, BadgeCheck, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';

interface ListCardMeta {
  icon: LucideIcon;
  value: string | number;
}

interface ListCardProps {
  image?: string;
  title: string;
  subtitle?: string;
  rating?: number;
  price?: number;
  priceLabel?: string;
  currency?: string;
  meta?: ListCardMeta[];
  isVerified?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListCard({
  image,
  title,
  subtitle,
  rating,
  price,
  priceLabel,
  currency = '฿',
  meta = [],
  isVerified,
  isNew,
  isFeatured,
  onClick,
  className,
}: ListCardProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-pointer bg-card rounded-none overflow-hidden shadow-sm border",
        "hover:shadow-md hover:border-primary/30 transition-all ",
        className
      )}
    >
      <div className="flex">
        {/* Image */}
        <div className="w-32 h-32 flex-shrink-0 relative">
          <img
            src={image || PLACEHOLDER_IMAGES.cardFallback}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Badges */}
          {(isNew || isFeatured) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isNew && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-none bg-primary text-primary-foreground">
                  NEW
                </span>
              )}
              {isFeatured && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-none bg-primary text-primary-foreground flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            {/* Title */}
            <h3 className="font-semibold line-clamp-2 flex items-center gap-1 text-foreground">
              {title}
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </h3>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              {meta.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.value}
                </span>
              ))}
              {rating !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  {rating}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          {price !== undefined && (
            <div className="text-right mt-2">
              <span className="text-lg font-bold text-primary">
                {currency}{price.toLocaleString()}
              </span>
              {priceLabel && (
                <span className="text-xs text-muted-foreground ml-1">
                  {priceLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
