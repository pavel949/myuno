/**
 * CanonicalCard — P1.1 Unified Card System
 * 
 * ONE card component for ALL public-facing entity listings.
 * Replaces: UnifiedCard, ItemCard, ServiceProviderCard (in listing contexts),
 *           PropertyListingCard, ExperienceCard, LifeFlowEntityCard.
 * 
 * Answers per P1.1 spec:
 * 1. What problem does this solve? → subtitle / description
 * 2. For whom? → tags (persona relevance)
 * 3. Which life situation? → situationLabel
 * 4. What is included? → meta items
 * 5. What is excluded? → (not shown on card level — detail page concern)
 * 6. What happens after action? → ctaLabel
 */
import React, { memo, useCallback, forwardRef } from 'react';
import {
  Star, MapPin, Clock, BadgeCheck, Package,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { getEntityType } from '@/lib/config/entityTypes';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Badge } from '@/components/ui/badge';
import { triggerRipple } from '@/hooks/useRipple';

// ────────────────────────────────────
// TYPES
// ────────────────────────────────────

export type CanonicalCardVariant = 'vertical' | 'horizontal' | 'compact' | 'featured';

export interface CanonicalCardMeta {
  icon: LucideIcon;
  value?: string | number;
  label?: string;
}

export interface CanonicalCardProps {
  /** Entity type for icon/label resolution */
  entityType?: string;
  /** Display data */
  title: string;
  subtitle?: string;
  image?: string;
  /** Pricing */
  price?: number;
  originalPrice?: number;
  priceLabel?: string;
  pricePrefix?: string;
  /** Quality signals */
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  /** Context */
  location?: string;
  duration?: string;
  meta?: CanonicalCardMeta[];
  tags?: string[];
  /** Life Situation relevance (shown as subtle badge) */
  situationLabel?: string;
  situationColor?: string;
  /** Badges */
  isNew?: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;
  badge?: { text: string; className?: string };
  /** CTA */
  ctaLabel?: string;
  onCtaClick?: () => void;
  /** Actions */
  onClick?: () => void;
  /** Layout */
  variant?: CanonicalCardVariant;
  className?: string;
}

// ────────────────────────────────────
// FALLBACK IMAGE
// ────────────────────────────────────
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=400';

// ────────────────────────────────────
// COMPONENT
// ────────────────────────────────────

export const CanonicalCard = memo(forwardRef<HTMLDivElement, CanonicalCardProps>(
  function CanonicalCard(props, ref) {
    const {
      entityType,
      title,
      subtitle,
      image,
      price,
      originalPrice,
      priceLabel,
      pricePrefix,
      rating,
      reviewCount,
      isVerified,
      location,
      duration,
      meta = [],
      tags = [],
      situationLabel,
      situationColor,
      isNew,
      isFeatured,
      isAvailable = true,
      badge,
      ctaLabel,
      onCtaClick,
      onClick,
      variant = 'horizontal',
      className,
    } = props;

    const { language, t } = useLanguage();
    const { formatPrice } = useCurrency();
    const { activeCode } = useLifeSituationContext();

    const entityDef = entityType ? getEntityType(entityType) : null;
    const EntityIcon = entityDef?.icon || Package;

    const discount = originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 0;

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAvailable) return;
      triggerRipple(e);
      onClick?.();
    }, [isAvailable, onClick]);

    // ── Situation relevance badge ──
    const SituationBadge = situationLabel ? (
      <span
        className="px-1.5 py-0.5 text-[9px] font-medium rounded-full border"
        style={{
          backgroundColor: situationColor ? `${situationColor}15` : undefined,
          borderColor: situationColor ? `${situationColor}40` : undefined,
          color: situationColor || undefined,
        }}
      >
        {situationLabel}
      </span>
    ) : null;

    // ── Badges row ──
    const BadgesOverlay = (
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        {discount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-destructive text-destructive-foreground">
            -{discount}%
          </span>
        )}
        {isNew && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-success text-white">
            NEW
          </span>
        )}
        {isFeatured && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gold text-black">
            ★
          </span>
        )}
        {badge && (
          <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", badge.className || "bg-primary text-primary-foreground")}>
            {badge.text}
          </span>
        )}
      </div>
    );

    // ── Rating display ──
    const RatingDisplay = rating !== undefined ? (
      <div className="flex items-center gap-1 shrink-0">
        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
        <span className="text-xs font-medium">{rating.toFixed(1)}</span>
        {reviewCount !== undefined && (
          <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
        )}
      </div>
    ) : null;

    // ── Price display ──
    const PriceDisplay = price !== undefined ? (
      <div className="flex items-center gap-1.5">
        {pricePrefix && <span className="text-xs text-muted-foreground">{pricePrefix}</span>}
        <span className="text-base font-bold text-primary">{formatPrice(price)}</span>
        {originalPrice && (
          <span className="text-xs text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
        )}
        {priceLabel && <span className="text-xs text-muted-foreground">{priceLabel}</span>}
      </div>
    ) : null;

    // ── CTA button ──
    const CtaButton = ctaLabel ? (
      <button
        onClick={(e) => { e.stopPropagation(); (onCtaClick || onClick)?.(); }}
        className="text-[11px] font-semibold text-primary-foreground bg-primary px-2.5 py-1 rounded-md whitespace-nowrap shrink-0"
      >
        {ctaLabel}
      </button>
    ) : null;

    // ── Entity type label ──
    const EntityLabel = entityDef ? (
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {language === 'ru' ? entityDef.labelRu : entityDef.labelEn}
      </span>
    ) : null;

    // ════════════════════════════════
    // COMPACT VARIANT
    // ════════════════════════════════
    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          onClick={handleClick}
          className={cn(
            "relative overflow-hidden rounded-2xl bg-card border border-border/50",
            "transition-all duration-200",
            isAvailable && "cursor-pointer hover:border-primary/30 hover:shadow-md active:scale-[0.98]",
            !isAvailable && "opacity-60",
            "flex flex-col w-36 shrink-0",
            className
          )}
        >
          <div className="relative aspect-square overflow-hidden">
            <OptimizedImage
              src={image || FALLBACK_IMAGE}
              alt={title}
              aspectRatio="1:1"
              width={144}
              quality={75}
              className={cn("w-full h-full", !isAvailable && "grayscale")}
            />
            {BadgesOverlay}
          </div>
          <div className="p-2 space-y-0.5">
            <h3 className="font-medium text-xs line-clamp-2 leading-tight">{title}</h3>
            {PriceDisplay}
          </div>
        </div>
      );
    }

    // ════════════════════════════════
    // FEATURED VARIANT
    // ════════════════════════════════
    if (variant === 'featured') {
      return (
        <div
          ref={ref}
          onClick={handleClick}
          className={cn(
            "group relative overflow-hidden rounded-2xl",
            "transition-all duration-300",
            isAvailable && "cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
            className
          )}
        >
          <div className="relative aspect-[16/9] overflow-hidden">
            <OptimizedImage
              src={image || FALLBACK_IMAGE}
              alt={title}
              aspectRatio="16:9"
              width={600}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            {BadgesOverlay}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {SituationBadge && <div className="mb-2">{SituationBadge}</div>}
                  <h3 className="font-bold text-xl text-white line-clamp-2 flex items-center gap-2">
                    {title}
                    {isVerified && <BadgeCheck className="w-5 h-5 text-primary shrink-0" />}
                  </h3>
                  {subtitle && <p className="text-sm text-white/80 line-clamp-1 mt-1">{subtitle}</p>}
                  <div className="flex items-center gap-3 mt-2 text-sm text-white/70">
                    {RatingDisplay}
                    {location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                      </div>
                    )}
                  </div>
                </div>
                {price !== undefined && (
                  <div className="px-4 py-2 rounded-xl glass shrink-0">
                    <span className="text-2xl font-bold text-primary">{formatPrice(price)}</span>
                    {priceLabel && <span className="block text-xs text-muted-foreground">{priceLabel}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ════════════════════════════════
    // VERTICAL VARIANT
    // ════════════════════════════════
    if (variant === 'vertical') {
      return (
        <div
          ref={ref}
          onClick={handleClick}
          className={cn(
            "relative overflow-hidden rounded-2xl bg-card border border-border/50 transition-all",
            isAvailable && "cursor-pointer hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
            !isAvailable && "opacity-60",
            className
          )}
        >
          <div className="relative aspect-square overflow-hidden">
            <OptimizedImage
              src={image || FALLBACK_IMAGE}
              alt={title}
              aspectRatio="1:1"
              width={200}
              quality={75}
              className={cn("w-full h-full", !isAvailable && "grayscale")}
            />
            {BadgesOverlay}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-medium px-3 py-1 rounded bg-black/50">
                  {t('booking.unavailable')}
                </span>
              </div>
            )}
          </div>
          <div className="p-2.5 space-y-1.5">
            {EntityLabel}
            <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{title}</h3>
            {RatingDisplay}
            {PriceDisplay}
            {SituationBadge && <div className="pt-0.5">{SituationBadge}</div>}
          </div>
        </div>
      );
    }

    // ════════════════════════════════
    // HORIZONTAL VARIANT (default)
    // ════════════════════════════════
    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "bg-card rounded-2xl overflow-hidden shadow-sm border transition-all",
          isAvailable && "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.98]",
          !isAvailable && "opacity-60",
          className
        )}
      >
        <div className="flex">
          {/* Image */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 relative overflow-hidden rounded-2xl">
            <OptimizedImage
              src={image || FALLBACK_IMAGE}
              alt={title}
              aspectRatio="1:1"
              width={128}
              quality={75}
              className={cn("w-full h-full", !isAvailable && "grayscale")}
            />
            {BadgesOverlay}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-medium px-3 py-1 rounded bg-black/50 text-xs">
                  {language === 'ru' ? 'Недоступно' : 'Unavailable'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
            <div>
              {/* Entity type + situation */}
              <div className="flex items-center gap-2 mb-0.5">
                {EntityLabel}
                {SituationBadge}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2 flex items-center gap-1">
                {title}
                {isVerified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
              </h3>

              {/* Location */}
              {location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{location}</span>
                </div>
              )}

              {/* Meta + Rating */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1.5">
                {meta.map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.value || item.label}
                  </span>
                ))}
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {duration}
                  </span>
                )}
                {RatingDisplay}
              </div>
            </div>

            {/* Bottom: Tags + Price + CTA */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1 flex-wrap">
                {tags.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1.5">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {PriceDisplay}
                {CtaButton}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
));

CanonicalCard.displayName = 'CanonicalCard';
export default CanonicalCard;
