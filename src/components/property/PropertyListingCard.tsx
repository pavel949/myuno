/**
 * PropertyListingCard - Airbnb-style public marketplace card
 * Used in: PropertyIndex grid, search results
 * NOT for admin/owner dashboards (use PropertyCard instead)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { PropertyImageCarousel } from './PropertyImageCarousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getDistrictLabel, getPropertyTypeLabel } from '@/lib/taxonomies';
import { cn } from '@/lib/utils';
import type { Property } from '@/hooks/useProperties';

interface PropertyListingCardProps {
  property: Property;
  mode?: 'rent' | 'buy';
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  companyName?: string;
  companySlug?: string;
  className?: string;
  /** Number of nights selected (to show total price) */
  nights?: number;
}

import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const FALLBACK_IMAGE = PLACEHOLDER_IMAGES.property;

const formatPriceLabel = (period: string, lang: string) => {
  const labels: Record<string, { en: string; ru: string }> = {
    night: { en: ' night', ru: ' ночь' },
    week: { en: ' week', ru: ' нед.' },
    month: { en: ' month', ru: ' мес.' },
    year: { en: ' year', ru: ' год' },
    total: { en: '', ru: '' },
  };
  return labels[period]?.[lang as 'en' | 'ru'] || '';
};

export function PropertyListingCard({
  property,
  mode = 'rent',
  isHovered = false,
  onHover,
  companyName,
  companySlug,
  className,
  nights,
}: PropertyListingCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const title = isRu ? property.title_ru : property.title_en;
  const images = property.images?.length ? property.images : [property.cover_image || FALLBACK_IMAGE];

  // Format district using taxonomy for proper capitalization & localization
  const districtDisplay = property.district
    ? getDistrictLabel(property.district, isRu ? 'ru' : 'en')
    : 'Phuket';

  // Use price_per_night as primary, fallback to price
  const unitPrice = property.price_per_night || property.price || 0;
  const totalPrice = nights && nights > 0 && (property.price_period === 'night' || !property.price_period)
    ? unitPrice * nights
    : null;

  return (
    <div
      className={cn("group cursor-pointer", className)}
      onClick={() => navigate(`/property/${property.id}`)}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image Carousel — Airbnb style */}
      <div className="relative">
        <PropertyImageCarousel
          images={images}
          alt={title}
          isHovered={isHovered}
        />

        {/* Favorite — Airbnb heart */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            itemType="property"
            itemId={property.id}
            itemData={{
              title_en: property.title_en,
              title_ru: property.title_ru,
              cover_image: property.cover_image || images[0],
              price: property.price,
              district: property.district,
            }}
            size="sm"
            variant="ghost"
            className="bg-transparent hover:bg-transparent p-0 h-auto [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6 [&_svg]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Badges — top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {property.is_featured && (
            <Badge className="bg-background text-foreground border-0 shadow-sm text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {isRu ? 'Популярное' : 'Guest favorite'}
            </Badge>
          )}
          {property.instant_booking && (
            <Badge className="bg-accent-amber text-white border-0 text-[11px] gap-1 rounded-full px-2 py-0.5">
              <Zap className="w-3 h-3" />
              {isRu ? 'Мгновенное' : 'Instant'}
            </Badge>
          )}
        </div>
      </div>

      {/* Content — Airbnb compact style */}
      <div className="mt-1.5 sm:mt-2.5 space-y-0">
        {/* Row 1: District + Rating */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-xs sm:text-[15px] leading-tight line-clamp-1 text-foreground">
            {districtDisplay}
          </h3>
          {property.rating != null && property.rating > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-foreground text-foreground" />
              <span className="text-[11px] sm:text-sm text-foreground">
                {property.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Property type · bedrooms */}
        <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-1">
          {property.property_type
            ? getPropertyTypeLabel(property.property_type, isRu ? 'ru' : 'en')
            : title}
          {property.bedrooms != null && property.bedrooms > 0 && (
            <> · {property.bedrooms} {isRu ? (property.bedrooms === 1 ? 'сп.' : 'сп.') : (property.bedrooms === 1 ? 'bed' : 'beds')}</>
          )}
          {property.bathrooms != null && property.bathrooms > 0 && (
            <span className="hidden sm:inline"> · {property.bathrooms} {isRu ? (property.bathrooms === 1 ? 'ванная' : 'ванных') : (property.bathrooms === 1 ? 'bath' : 'baths')}</span>
          )}
          {property.max_guests != null && property.max_guests > 0 && (
            <span className="hidden sm:inline"> · {isRu ? `до ${property.max_guests} гостей` : `up to ${property.max_guests} guests`}</span>
          )}
        </p>

        {/* Row 3: Price */}
        <div className="pt-0.5 sm:pt-1">
          <p className="text-xs sm:text-[15px] text-foreground">
            {mode === 'buy' ? (
              <span className="font-semibold">
                {formatPrice((property as any).sale_price || property.price || 0)}
              </span>
            ) : (
              <>
                <span className="font-semibold">{formatPrice(unitPrice)}</span>
                <span className="font-normal text-muted-foreground">
                  {formatPriceLabel(property.price_period || 'night', language)}
                </span>
              </>
            )}
          </p>
          {totalPrice && nights && mode !== 'buy' && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 underline decoration-muted-foreground/50">
              {formatPrice(totalPrice)} {isRu ? 'итого' : 'total'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyListingCard;
