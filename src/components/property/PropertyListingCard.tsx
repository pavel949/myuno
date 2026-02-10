/**
 * PropertyListingCard - Airbnb-style public marketplace card
 * Used in: PropertyIndex grid, search results
 * NOT for admin/owner dashboards (use PropertyCard instead)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Zap, BedDouble, Bath, Users, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import type { Property } from '@/hooks/useProperties';

interface PropertyListingCardProps {
  property: Property;
  mode?: 'rent' | 'buy';
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
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
  className,
}: PropertyListingCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const title = isRu ? property.title_ru : property.title_en;
  const image = property.cover_image || property.images?.[0] || FALLBACK_IMAGE;

  return (
    <div
      className={cn("group cursor-pointer", className)}
      onClick={() => navigate(`/property/${property.id}`)}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
        <img
          src={image}
          alt={title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isHovered && "scale-[1.03]"
          )}
          loading="lazy"
        />

        {/* Favorite */}
        <button
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="w-5 h-5" />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
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

      {/* Content */}
      <div className="space-y-1">
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

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" />
            {property.bedrooms || 0}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {property.bathrooms || 0}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {property.max_guests || 2}
          </span>
        </div>

        {/* Price + Book Button */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm font-semibold">
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
          <Button
            size="sm"
            className="h-8 text-xs px-3 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/property/${property.id}`);
            }}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {isRu ? 'Забронировать' : 'Book'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PropertyListingCard;
