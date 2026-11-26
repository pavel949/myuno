/**
 * ResalePropertyCard — canonical card for secondary-market listings.
 *
 * Kept separate from PropertyListingCard on purpose: it renders a different entity
 * (`ResaleProperty`) with resale-specific semantics — asking vs original purchase
 * price, assignment premium, estimated ROI, title type. Merging it into the rental
 * marketplace card would require union-typing two unrelated shapes, so this stays a
 * domain card alongside commercial/hotel/land variants.
 */
import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightLeft, MapPin, Maximize2, BedDouble, TrendingUp, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { ResaleProperty } from '@/hooks/useResaleProperties';
import { surfaceFromResale } from '@/lib/real-estate/listingViewModel';
import { cn } from '@/lib/utils';
import { publicJourneyState } from '@/lib/real-estate/publicJourney';
import { formatRecordedPrice } from '@/lib/format/price';

interface ResalePropertyCardProps {
  property: ResaleProperty;
  onClick?: () => void;
  className?: string;
}

const CONDITION_LABELS: Record<string, { en: string; ru: string }> = {
  new: { en: 'New', ru: 'Новое' },
  excellent: { en: 'Excellent', ru: 'Отличное' },
  good: { en: 'Good', ru: 'Хорошее' },
  needs_renovation: { en: 'Needs Reno', ru: 'Под ремонт' },
};

const TITLE_TYPE_LABELS: Record<string, { en: string; ru: string }> = {
  freehold: { en: 'Freehold', ru: 'Freehold' },
  leasehold: { en: 'Leasehold', ru: 'Leasehold' },
  company_structure: { en: 'Company', ru: 'Компания' },
};

export function ResalePropertyCard({ property, onClick, className }: ResalePropertyCardProps) {
  const location = useLocation();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const surface = useMemo(() => surfaceFromResale(property), [property]);
  const title = isRu ? surface.titleRu : surface.titleEn;
  const priceOnRequest = isRu ? 'Цена по запросу' : language === 'th' ? 'สอบถามราคา' : 'Price on request';
  const recordedPrice = (amount: number | null | undefined) => formatRecordedPrice(amount, property.currency, { unknownLabel: priceOnRequest, formatTHB: formatPrice });
  const premiumPercent = property.original_purchase_price && property.original_purchase_price > 0
    ? Math.round(((property.asking_price - property.original_purchase_price) / property.original_purchase_price) * 100)
    : null;

  const coverUrl = surface.coverImageUrl || '/placeholder.svg';
  const [failedImage, setFailedImage] = useState<string | null>(null);

  return (
    <Link
      to={surface.href}
      state={publicJourneyState(location)}
      aria-label={title}
      data-catalog-kind={surface.kind}
      data-listing-id={surface.id}
      onClick={onClick ? event => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      className={cn(
        "block bg-card rounded-md border border-border/50 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-muted">
        {failedImage === coverUrl ? <div role="img" aria-label={isRu ? 'Фото недоступно' : language === 'th' ? 'ไม่มีรูปภาพ' : 'Photo unavailable'} className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageOff className="size-10" aria-hidden="true" /></div> : <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onErrorCapture={() => setFailedImage(coverUrl)}
        />}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {property.is_assignment && (
            <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5">
              <ArrowRightLeft className="w-3 h-3 mr-1" />
              {isRu ? 'Переуступка' : 'Assignment'}
            </Badge>
          )}
          {property.featured && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
              ⭐ {isRu ? 'Рекомендуем' : 'Featured'}
            </Badge>
          )}
        </div>

        {/* Title type badge */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="text-[10px] bg-background/80">
            {TITLE_TYPE_LABELS[property.title_type]?.[isRu ? 'ru' : 'en'] || property.title_type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{property.zone}</span>
          {property.area_sqm && (
            <>
              <span className="mx-1">·</span>
              <Maximize2 className="w-3 h-3" />
              <span>{property.area_sqm} м²</span>
            </>
          )}
          {property.bedrooms != null && property.bedrooms > 0 && (
            <>
              <span className="mx-1">·</span>
              <BedDouble className="w-3 h-3" />
              <span>{property.bedrooms} {isRu ? 'сп.' : 'bd'}</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">
            {recordedPrice(property.asking_price)}
          </span>
          {property.is_assignment && property.original_purchase_price && premiumPercent !== null && (
            <span className="text-xs text-muted-foreground line-through">
              {recordedPrice(property.original_purchase_price)}
            </span>
          )}
          {premiumPercent !== null && premiumPercent > 0 && (
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
              +{premiumPercent}%
            </Badge>
          )}
        </div>

        {/* ROI & rental income */}
        {(property.current_rental_income || property.estimated_roi) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {property.current_rental_income && (
              <span>
                {isRu ? 'Доход:' : 'Income:'} {recordedPrice(property.current_rental_income)}/{isRu ? 'мес' : 'mo'}
              </span>
            )}
            {property.estimated_roi && (
              <span className="flex items-center gap-0.5 text-primary">
                <TrendingUp className="w-3 h-3" />
                ROI: {property.estimated_roi}%
              </span>
            )}
          </div>
        )}

        {/* Condition */}
        <div className="flex gap-1 text-[10px]">
          {property.condition && (
            <Badge variant="outline" className="text-[10px]">
              {CONDITION_LABELS[property.condition]?.[isRu ? 'ru' : 'en'] || property.condition}
            </Badge>
          )}
          {property.furnished && property.furnished !== 'unfurnished' && (
            <Badge variant="outline" className="text-[10px]">
              {property.furnished === 'fully'
                ? (isRu ? 'С мебелью' : 'Furnished')
                : (isRu ? 'Частично' : 'Partial')}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
