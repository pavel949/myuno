import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Users, Star, Sparkles, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getPropertyTypeLabel, 
  getDistrictLabel,
  getHighlightLabel,
  PROPERTY_HIGHLIGHTS 
} from '@/lib/taxonomies';

interface PropertyPreviewCardProps {
  data: {
    title?: string;
    titleRu?: string;
    coverImage?: string;
    propertyType?: string;
    district?: string;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    pricePerNight?: number;
    currency?: string;
    instantBooking?: boolean;
    highlights?: string[];
    rating?: number;
    reviewCount?: number;
  };
  className?: string;
  variant?: 'search' | 'detail';
}

export function PropertyPreviewCard({ data, className, variant = 'search' }: PropertyPreviewCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = isRu ? (data.titleRu || data.title) : data.title;
  const typeLabel = data.propertyType 
    ? getPropertyTypeLabel(data.propertyType, isRu ? 'ru' : 'en')
    : '';

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  if (variant === 'search') {
    return (
      <Card className={cn("overflow-hidden group hover:shadow-lg transition-shadow", className)}>
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted">
          {data.coverImage ? (
            <img 
              src={data.coverImage} 
              alt={title || 'Property'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <MapPin className="h-8 w-8" />
            </div>
          )}
          
          {/* Instant Booking Badge */}
          {data.instantBooking && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground gap-1">
              <Sparkles className="h-3 w-3" />
              {isRu ? 'Мгновенно' : 'Instant'}
            </Badge>
          )}

          {/* Highlights */}
          {data.highlights && data.highlights.length > 0 && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
              {data.highlights.slice(0, 3).map(h => {
                const highlight = PROPERTY_HIGHLIGHTS.find(hl => hl.id === h);
                if (!highlight) return null;
                return (
                  <Badge key={h} variant="secondary" className="text-[10px] py-0.5 px-1.5 bg-background/80 backdrop-blur-sm">
                    {highlight.icon} {isRu ? highlight.labelRu : highlight.labelEn}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          {/* Type & Location */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {typeLabel && <span>{typeLabel}</span>}
            {data.district && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {data.district}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {title || (isRu ? 'Без названия' : 'Untitled Property')}
          </h3>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {data.bedrooms !== undefined && (
              <span className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {data.bedrooms}
              </span>
            )}
            {data.bathrooms !== undefined && (
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {data.bathrooms}
              </span>
            )}
            {data.maxGuests !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {data.maxGuests}
              </span>
            )}
          </div>

          {/* Price & Rating */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              {data.pricePerNight ? (
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-base">
                    {formatPrice(data.pricePerNight)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {data.currency || 'THB'}/{isRu ? 'ночь' : 'night'}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {isRu ? 'Цена не указана' : 'Price not set'}
                </span>
              )}
            </div>
            
            {data.rating !== undefined && data.rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{data.rating.toFixed(1)}</span>
                {data.reviewCount !== undefined && (
                  <span className="text-muted-foreground text-xs">
                    ({data.reviewCount})
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detail variant - larger preview
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Hero Image */}
      <div className="relative aspect-video bg-muted">
        {data.coverImage ? (
          <img 
            src={data.coverImage} 
            alt={title || 'Property'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        
        {data.instantBooking && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground gap-1.5 py-1">
            <Sparkles className="h-4 w-4" />
            {isRu ? 'Мгновенное бронирование' : 'Instant Booking'}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Type & Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {typeLabel && <Badge variant="secondary">{typeLabel}</Badge>}
          {data.district && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {data.district}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-semibold text-lg">
          {title || (isRu ? 'Без названия' : 'Untitled Property')}
        </h2>

        {/* Specs Row */}
        <div className="flex items-center gap-4 text-sm">
          {data.bedrooms !== undefined && (
            <span className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-muted-foreground" />
              {data.bedrooms} {isRu ? 'спален' : 'bed'}
            </span>
          )}
          {data.bathrooms !== undefined && (
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-muted-foreground" />
              {data.bathrooms} {isRu ? 'ванных' : 'bath'}
            </span>
          )}
          {data.maxGuests !== undefined && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              {data.maxGuests} {isRu ? 'гостей' : 'guests'}
            </span>
          )}
        </div>

        {/* Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {data.highlights.map(h => {
              const highlight = PROPERTY_HIGHLIGHTS.find(hl => hl.id === h);
              if (!highlight) return null;
              return (
                <Badge key={h} variant="outline" className="text-xs">
                  {highlight.icon} {isRu ? highlight.labelRu : highlight.labelEn}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            {data.pricePerNight ? (
              <div className="flex items-baseline gap-1.5">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-bold text-xl">
                  {formatPrice(data.pricePerNight)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {data.currency || 'THB'} / {isRu ? 'ночь' : 'night'}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {isRu ? 'Цена не указана' : 'Price not set'}
              </span>
            )}
          </div>
          
          {data.rating !== undefined && data.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="h-5 w-5 fill-warning text-warning" />
              <span className="font-semibold text-lg">{data.rating.toFixed(1)}</span>
              {data.reviewCount !== undefined && (
                <span className="text-muted-foreground text-sm">
                  ({data.reviewCount} {isRu ? 'отзывов' : 'reviews'})
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
