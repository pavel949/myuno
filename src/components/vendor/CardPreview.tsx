import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Clock, 
  Users, 
  MapPin, 
  Bed, 
  Bath, 
  Ruler, 
  CheckCircle2,
  Eye,
  Package,
  Map,
  Building2,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface BasePreviewProps {
  image?: string;
  isRussian?: boolean;
}

interface ProductPreviewProps extends BasePreviewProps {
  type: 'product';
  title: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  price?: number;
  originalPrice?: number;
  unit?: string;
  unitRu?: string;
  isNew?: boolean;
  isPopular?: boolean;
  inStock?: boolean;
}

interface ServicePreviewProps extends BasePreviewProps {
  type: 'service';
  title: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  price?: number;
  durationMinutes?: number;
  maxCapacity?: number;
}

interface TourPreviewProps extends BasePreviewProps {
  type: 'tour';
  title: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  price?: number;
  durationHours?: number;
  maxParticipants?: number;
  category?: string;
  difficulty?: string;
  meetingPoint?: string;
}

interface PropertyPreviewProps extends BasePreviewProps {
  type: 'property';
  title: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  price?: number;
  pricePeriod?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  district?: string;
  amenities?: string[];
  instantBooking?: boolean;
}

type CardPreviewProps = ProductPreviewProps | ServicePreviewProps | TourPreviewProps | PropertyPreviewProps;

export function CardPreview(props: CardPreviewProps) {
  const { language } = useLanguage();
  const isRussian = props.isRussian ?? language === 'ru';

  const getTitle = () => {
    return isRussian ? (props.titleRu || props.title) : props.title;
  };

  const getDescription = () => {
    if ('descriptionRu' in props) {
      return isRussian ? (props.descriptionRu || props.description) : props.description;
    }
    return props.description;
  };

  const getPlaceholderIcon = () => {
    switch (props.type) {
      case 'product': return ShoppingBag;
      case 'service': return Package;
      case 'tour': return Map;
      case 'property': return Building2;
    }
  };

  const formatPrice = (price: number, period?: string) => {
    const symbol = getCurrencySymbol('THB');
    if (props.type === 'property' && period) {
      const periodLabels: Record<string, string> = {
        day: isRussian ? '/день' : '/day',
        month: isRussian ? '/мес' : '/mo',
        year: isRussian ? '/год' : '/yr',
      };
      return `${symbol}${price.toLocaleString()}${periodLabels[period] || ''}`;
    }
    return `${symbol}${price.toLocaleString()}`;
  };

  const PlaceholderIcon = getPlaceholderIcon();
  const title = getTitle();
  const description = getDescription();
  const hasContent = title || props.image || props.price;

  // Calculate discount for products
  const discount = props.type === 'product' && (props as ProductPreviewProps).originalPrice && props.price
    ? Math.round((1 - props.price / (props as ProductPreviewProps).originalPrice!) * 100)
    : 0;

  if (!hasContent) {
    return (
      <div className="border border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground">
        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          {isRussian ? 'Заполните форму для предпросмотра' : 'Fill the form to see preview'}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      {/* Image */}
      <div className="aspect-[16/10] relative bg-muted">
        {props.image ? (
          <img 
            src={props.image} 
            alt={title || 'Preview'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlaceholderIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {/* Product badges */}
          {props.type === 'product' && (
            <>
              {(props as ProductPreviewProps).isNew && (
                <Badge className="bg-info text-info-foreground text-xs">
                  {isRussian ? 'Новинка' : 'New'}
                </Badge>
              )}
              {(props as ProductPreviewProps).isPopular && (
                <Badge className="bg-warning text-white text-xs">
                  {isRussian ? 'Хит' : 'Hit'}
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground text-xs">
                  -{discount}%
                </Badge>
              )}
            </>
          )}
          
          {/* Property badges */}
          {props.type === 'property' && (props as PropertyPreviewProps).instantBooking && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {isRussian ? 'Мгновенное' : 'Instant'}
            </Badge>
          )}
          
          {/* Tour badges */}
          {props.type === 'tour' && (props as TourPreviewProps).difficulty && (
            <Badge variant="secondary" className="text-xs capitalize">
              {(props as TourPreviewProps).difficulty}
            </Badge>
          )}
        </div>

        {/* Verified badge simulation */}
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>
        
        {/* Stock status for products */}
        {props.type === 'product' && !(props as ProductPreviewProps).inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-muted-foreground font-medium">
              {isRussian ? 'Нет в наличии' : 'Out of stock'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
          {title || (isRussian ? 'Название' : 'Title')}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
          {props.type === 'product' && (
            <>
              {(props as ProductPreviewProps).unit && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {isRussian 
                    ? (props as ProductPreviewProps).unitRu || (props as ProductPreviewProps).unit
                    : (props as ProductPreviewProps).unit}
                </span>
              )}
            </>
          )}
          
          {props.type === 'service' && (
            <>
              {(props as ServicePreviewProps).durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(props as ServicePreviewProps).durationMinutes} {isRussian ? 'мин' : 'min'}
                </span>
              )}
              {(props as ServicePreviewProps).maxCapacity && (props as ServicePreviewProps).maxCapacity! > 1 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {(props as ServicePreviewProps).maxCapacity}
                </span>
              )}
            </>
          )}

          {props.type === 'tour' && (
            <>
              {(props as TourPreviewProps).durationHours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(props as TourPreviewProps).durationHours} {isRussian ? 'ч' : 'h'}
                </span>
              )}
              {(props as TourPreviewProps).maxParticipants && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {isRussian ? 'до' : 'up to'} {(props as TourPreviewProps).maxParticipants}
                </span>
              )}
              {(props as TourPreviewProps).meetingPoint && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {(props as TourPreviewProps).meetingPoint}
                </span>
              )}
            </>
          )}

          {props.type === 'property' && (
            <>
              {(props as PropertyPreviewProps).bedrooms && (
                <span className="flex items-center gap-1">
                  <Bed className="w-3 h-3" />
                  {(props as PropertyPreviewProps).bedrooms}
                </span>
              )}
              {(props as PropertyPreviewProps).bathrooms && (
                <span className="flex items-center gap-1">
                  <Bath className="w-3 h-3" />
                  {(props as PropertyPreviewProps).bathrooms}
                </span>
              )}
              {(props as PropertyPreviewProps).areaSqm && (
                <span className="flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  {(props as PropertyPreviewProps).areaSqm} {isRussian ? 'м²' : 'sqm'}
                </span>
              )}
              {(props as PropertyPreviewProps).district && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {(props as PropertyPreviewProps).district}
                </span>
              )}
            </>
          )}
        </div>

        {/* Rating simulation */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3.5 h-3.5 fill-warning text-warning" />
          <span className="text-sm font-medium">4.9</span>
          <span className="text-xs text-muted-foreground">(0 {isRussian ? 'отзывов' : 'reviews'})</span>
        </div>

        {/* Price */}
        {props.price && props.price > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {props.type === 'property' 
                ? formatPrice(props.price, (props as PropertyPreviewProps).pricePeriod)
                : formatPrice(props.price)
              }
            </span>
            {/* Original price for products */}
            {props.type === 'product' && (props as ProductPreviewProps).originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {getCurrencySymbol('THB')}{(props as ProductPreviewProps).originalPrice!.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component with header
export function CardPreviewSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className={cn(className)}>
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {isRussian ? 'Предпросмотр карточки' : 'Card Preview'}
        </span>
      </div>
      <div className="max-w-[280px]">
        {children}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {isRussian 
          ? 'Так карточка будет выглядеть для пользователей' 
          : 'This is how users will see your card'}
      </p>
    </div>
  );
}
