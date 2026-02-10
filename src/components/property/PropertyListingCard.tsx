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
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600';

const formatPriceLabel = (period: string, lang: string) => {
  const labels: Record<string, { en: string; ru: string }> = {
    night: { en: '/night', ru: '/ночь' },
    week: { en: '/week', ru: '/нед' },
    month: { en: '/mo', ru: '/мес' },
    year: { en: '/year', ru: '/год' },
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
}: PropertyListingCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const title = isRu ? property.title_ru : property.title_en;
  const images = property.images?.length ? property.images : [property.cover_image || FALLBACK_IMAGE];

  return (
    <div
      className={cn("group cursor-pointer", className)}
      onClick={() => navigate(`/property/${property.id}`)}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image Carousel */}
      <div className="relative mb-3">
        <PropertyImageCarousel
          images={images}
          alt={title}
          isHovered={isHovered}
        />

        {/* Favorite */}
        <div className="absolute top-3 right-3 z-10">
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
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {property.is_featured && (
            <Badge className="bg-background text-foreground border-0 shadow-sm text-xs">
              {isRu ? 'Популярное' : 'Guest favorite'}
            </Badge>
          )}
          {property.instant_booking && (
            <Badge className="bg-amber-500 text-white border-0 text-xs gap-1">
              <Zap className="w-3 h-3" />
              {isRu ? 'Мгновенное' : 'Instant'}
            </Badge>
          )}
        </div>
      </div>

      {/* Content — Airbnb minimal: location, title, price */}
      <div className="space-y-0.5">
        {/* District + Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-1">
            {property.district || 'Phuket'}
          </h3>
          {property.rating != null && property.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-sm">{property.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-sm text-muted-foreground line-clamp-1">{title}</p>

        {/* Price */}
        <p className="text-sm font-semibold pt-1">
          {mode === 'buy' ? (
            formatPrice((property as any).sale_price || property.price || 0)
          ) : (
            <>
              {formatPrice(property.price || 0)}
              <span className="font-normal text-muted-foreground">
                {formatPriceLabel(property.price_period || 'night', language)}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default PropertyListingCard;
