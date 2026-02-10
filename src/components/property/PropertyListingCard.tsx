/**
 * PropertyListingCard - Airbnb-style public marketplace card
 * Used in: PropertyIndex grid, search results
 * NOT for admin/owner dashboards (use PropertyCard instead)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Zap, BedDouble, Bath, Users, CalendarIcon, Building2, Maximize, Eye, CalendarDays, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

        {/* Title + Property Type */}
        <p className="text-sm text-muted-foreground line-clamp-1">
          {title}
          {property.property_type && (
            <span className="text-muted-foreground/70"> · {property.property_type}</span>
          )}
        </p>

        {/* Management Company Badge */}
        {companyName && (
          <button
            className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              if (companySlug) navigate(`/company/${companySlug}`);
            }}
          >
            <Building2 className="w-3 h-3" />
            {companyName}
          </button>
        )}

        {/* Specs row */}
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
          {property.area_sqm && (
            <span className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              {property.area_sqm} m²
            </span>
          )}
          {property.view_type && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {property.view_type}
            </span>
          )}
        </div>

        {/* Min stay + Discount badges */}
        {(property.min_stay_nights && property.min_stay_nights > 1 || property.weekly_discount || property.monthly_discount) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {property.min_stay_nights && property.min_stay_nights > 1 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                {isRu ? `от ${property.min_stay_nights} ночей` : `${property.min_stay_nights}+ nights`}
              </span>
            )}
            {property.weekly_discount && property.weekly_discount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                <Tag className="w-3 h-3" />
                -{property.weekly_discount}% {isRu ? 'нед' : 'week'}
              </span>
            ) : null}
            {property.monthly_discount && property.monthly_discount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                <Tag className="w-3 h-3" />
                -{property.monthly_discount}% {isRu ? 'мес' : 'mo'}
              </span>
            ) : null}
          </div>
        )}

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
