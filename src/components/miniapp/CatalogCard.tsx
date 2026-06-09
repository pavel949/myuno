/**
 * CatalogCard — Unified vertical grid card for ALL catalog/listing pages.
 * 
 * Replaces inline card implementations in Yachts, Experiences, Flowers,
 * Pets, Restaurants. Provides a consistent Airbnb-style card with:
 * - Configurable aspect ratio (4:3, 3:4, 1:1)
 * - Standardized badge stacks (top-left, top-right)
 * - Social proof overlay (bottom of image)
 * - Meta row (rating, duration, capacity)
 * - Location line
 * - Price with formatPrice()
 */

import React, { memo } from 'react';
import { Star, MapPin, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { AutoTranslatedBadge } from '@/components/i18n/AutoTranslatedBadge';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CatalogBadge {
  text: string;
  icon?: LucideIcon;
  className?: string;
}

export interface CatalogMeta {
  icon: LucideIcon;
  label: string;
}

export interface CatalogCardProps {
  image?: string;
  title: string;
  onClick?: () => void;
  aspectRatio?: '4:3' | '3:4' | '1:1';
  badges?: CatalogBadge[];
  statusBadge?: CatalogBadge;
  socialProof?: string;
  rating?: number;
  reviewCount?: number;
  meta?: CatalogMeta[];
  location?: string;
  price?: number;
  pricePrefix?: string;
  priceSuffix?: string;
  subtitle?: string;
  className?: string;
  /** Source language if the title was auto-translated; renders a small badge under the title. */
  autoTranslatedFrom?: 'ru' | 'en' | 'th';
}

const ASPECT_MAP = {
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '1:1': 'aspect-square',
} as const;

const ASPECT_DIMENSIONS = {
  '4:3': { width: 400, height: 300 },
  '3:4': { width: 400, height: 533 },
  '1:1': { width: 400, height: 400 },
} as const;

export const CatalogCard = memo(function CatalogCard({
  image,
  title,
  onClick,
  aspectRatio = '4:3',
  badges,
  statusBadge,
  socialProof,
  rating,
  reviewCount,
  meta,
  location,
  price,
  pricePrefix,
  priceSuffix,
  subtitle,
  className,
  autoTranslatedFrom,
}: CatalogCardProps) {
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const dims = ASPECT_DIMENSIONS[aspectRatio];

  return (
    <div
      className={cn("cursor-pointer group", className)}
      onClick={onClick}
    >
      {/* Image */}
      <div className={cn("relative rounded-none overflow-hidden mb-2", ASPECT_MAP[aspectRatio])}>
        <OptimizedImage
          src={image || PLACEHOLDER_IMAGES.service}
          alt={title}
          width={dims.width}
          height={dims.height}
          className="w-full h-full transition-transform duration-300"
          quality={80}
        />

        {/* Top-left badges (max 2 to avoid overflow) */}
        {badges && badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {badges.slice(0, 2).map((badge, i) => {
              const Icon = badge.icon;
              return (
                <Badge
                  key={i}
                  className={cn(
                    "text-[10px]",
                    badge.className || "bg-primary text-primary-foreground"
                  )}
                >
                  {Icon && <Icon className="w-2.5 h-2.5 mr-0.5" />}
                  {badge.text}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Top-right status badge */}
        {statusBadge && (
          <span className={cn(
            "absolute top-2 right-2 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
            statusBadge.className || "bg-muted/90 text-foreground"
          )}>
            {statusBadge.icon && <statusBadge.icon className="w-2.5 h-2.5 shrink-0" />}
            {statusBadge.text}
          </span>
        )}

        {/* Social proof bottom overlay */}
        {socialProof && (
          <div className="absolute bottom-2 left-2 right-2">
            <Badge className="bg-background/90 text-foreground text-[9px] border-0 w-full justify-center">
              <Star className="w-2.5 h-2.5 mr-0.5 text-warning" />
              {socialProof}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-0.5">
        {/* Meta row: rating + meta items */}
        {(rating !== undefined || (meta && meta.length > 0)) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {rating !== undefined && rating > 0 && (
              <>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                  {reviewCount !== undefined && <span>({reviewCount})</span>}
                </span>
                {meta && meta.length > 0 && <span>·</span>}
              </>
            )}
            {meta?.slice(0, 2).map((m, i) => (
              <span key={i} className="flex items-center gap-0.5">
                <m.icon className="w-3 h-3" />
                {m.label}
                {i < Math.min((meta?.length || 0), 2) - 1 && <span className="ml-1">·</span>}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{title}</h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{subtitle}</p>
        )}

        {/* Location */}
        {location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}

        {/* Price */}
        {price !== undefined && (
          <p className="text-sm font-semibold text-foreground">
            {pricePrefix && <span className="text-xs font-normal text-muted-foreground mr-0.5">{pricePrefix}</span>}
            {formatPrice(price)}
            {priceSuffix && <span className="text-xs font-normal text-muted-foreground ml-0.5">{priceSuffix}</span>}
          </p>
        )}
      </div>
    </div>
  );
});
