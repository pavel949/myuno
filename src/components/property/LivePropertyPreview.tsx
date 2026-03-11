import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Users, 
  Sparkles, 
  Home,
  Eye,
  Building2,
  TreePine,
  Waves,
  Car,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeFurnishingLevel } from '@/lib/propertyFormNormalizers';

interface LivePropertyPreviewProps {
  data: {
    title?: string;
    titleRu?: string;
    coverImage?: string;
    images?: string[];
    propertyType?: string;
    district?: string;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    areaSqm?: string | number;
    pricePerNight?: string | number;
    instantBooking?: boolean;
    // Standalone properties
    totalFloors?: number;
    plotSizeSqm?: number;
    poolType?: string;
    gardenType?: string;
    parkingType?: string;
    // Multi-unit
    floor?: number;
    unitNumber?: string;
    // Common
    viewTypes?: string[];
    viewType?: string;
    furnishingLevel?: string;
    equipment?: string[];
  };
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

const propertyTypeLabels: Record<string, { en: string; ru: string }> = {
  villa: { en: 'Villa', ru: 'Вилла' },
  apartment: { en: 'Apartment', ru: 'Квартира' },
  condo: { en: 'Condo', ru: 'Кондо' },
  house: { en: 'House', ru: 'Дом' },
  townhouse: { en: 'Townhouse', ru: 'Таунхаус' },
  studio: { en: 'Studio', ru: 'Студия' },
  penthouse: { en: 'Penthouse', ru: 'Пентхаус' },
};

const viewTypeLabels: Record<string, { en: string; ru: string }> = {
  sea: { en: 'Sea View', ru: 'Вид на море' },
  pool: { en: 'Pool View', ru: 'Вид на бассейн' },
  garden: { en: 'Garden View', ru: 'Вид на сад' },
  city: { en: 'City View', ru: 'Вид на город' },
  mountain: { en: 'Mountain View', ru: 'Вид на горы' },
};

const poolTypeLabels: Record<string, { en: string; ru: string }> = {
  private: { en: 'Private Pool', ru: 'Частный бассейн' },
  shared: { en: 'Shared Pool', ru: 'Общий бассейн' },
};

const parkingTypeLabels: Record<string, { en: string; ru: string }> = {
  garage: { en: 'Garage', ru: 'Гараж' },
  carport: { en: 'Carport', ru: 'Навес' },
  open: { en: 'Open Parking', ru: 'Открытая парковка' },
};

const STANDALONE_TYPES = ['villa', 'house', 'townhouse'];

function LivePropertyPreviewInner({ data, className, collapsed, onToggle }: LivePropertyPreviewProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = isRu ? (data.titleRu || data.title) : data.title;
  const typeLabel = data.propertyType 
    ? (isRu ? propertyTypeLabels[data.propertyType]?.ru : propertyTypeLabels[data.propertyType]?.en) 
    : '';

  const isStandalone = STANDALONE_TYPES.includes(data.propertyType || '');
  const coverImage = data.coverImage || (data.images && data.images[0]);
  const normalizedFurnishingLevel = normalizeFurnishingLevel(data.furnishingLevel);
  const viewTypeValues = data.viewTypes && data.viewTypes.length > 0
    ? data.viewTypes
    : data.viewType
      ? [data.viewType]
      : [];

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return null;
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num) || num === 0) return null;
    return num.toLocaleString();
  };

  const priceFormatted = formatPrice(data.pricePerNight);

  // Calculate completeness
  const fields = [
    !!title,
    !!coverImage,
    !!data.propertyType,
    !!data.district || !!data.address,
    data.bedrooms !== undefined && data.bedrooms > 0,
    data.bathrooms !== undefined && data.bathrooms > 0,
    !!priceFormatted,
    data.maxGuests !== undefined && data.maxGuests > 0,
  ];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  if (collapsed) {
    return (
      <Card 
        className={cn("cursor-pointer hover:bg-accent/50 transition-colors", className)}
        onClick={onToggle}
      >
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {isRu ? 'Превью карточки' : 'Card Preview'}
            </span>
          </div>
          <Badge variant={completeness === 100 ? 'default' : 'secondary'} className="text-xs">
            {completeness}%
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="py-2 px-3 flex flex-row items-center justify-between border-b bg-muted/30">
        <div>
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            {isRu ? 'Превью листинга' : 'Listing Preview'}
          </CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isRu 
              ? 'Так будет выглядеть карточка (обновляется автоматически)' 
              : 'How your listing will appear (updates automatically)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={completeness === 100 ? 'default' : 'secondary'} className="text-[10px]">
            {completeness}% {isRu ? 'готово' : 'complete'}
          </Badge>
          {onToggle && (
            <button 
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 pointer-events-none select-none">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted">
          <AnimatePresence mode="wait">
            {coverImage ? (
              <motion.img
                key={coverImage}
                src={coverImage}
                alt={title || 'Property'}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <motion.div 
                key="placeholder"
                className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Home className="h-10 w-10" />
                <span className="text-xs">{isRu ? 'Добавьте фото' : 'Add photos'}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Instant Booking Badge */}
          {data.instantBooking && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground gap-1 text-[10px]">
              <Sparkles className="h-2.5 w-2.5" />
              {isRu ? 'Мгновенно' : 'Instant'}
            </Badge>
          )}

          {/* Property Type Badge */}
          {typeLabel && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm">
              {typeLabel}
            </Badge>
          )}

          {/* Image count */}
          {data.images && data.images.length > 1 && (
            <Badge variant="secondary" className="absolute bottom-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm">
              +{data.images.length - 1} {isRu ? 'фото' : 'photos'}
            </Badge>
          )}
        </div>

        <div className="p-3 space-y-2">
          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {data.district || data.address || (isRu ? 'Укажите локацию' : 'Add location')}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {title || (isRu ? 'Название объекта...' : 'Property title...')}
          </h3>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {data.bedrooms || '-'}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {data.bathrooms || '-'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {data.maxGuests || '-'}
            </span>
            {data.areaSqm && (
              <span className="text-muted-foreground">
                {data.areaSqm} м²
              </span>
            )}
          </div>

          {/* Standalone features */}
          {isStandalone && (
            <div className="flex flex-wrap gap-1">
              {data.totalFloors && (
                <Badge variant="outline" className="text-[10px] py-0 gap-1">
                  <Building2 className="h-2.5 w-2.5" />
                  {data.totalFloors} {isRu ? 'эт.' : 'fl.'}
                </Badge>
              )}
              {data.plotSizeSqm && (
                <Badge variant="outline" className="text-[10px] py-0">
                  {data.plotSizeSqm} м²
                </Badge>
              )}
              {data.poolType && data.poolType !== 'none' && (
                <Badge variant="outline" className="text-[10px] py-0 gap-1">
                  <Waves className="h-2.5 w-2.5" />
                  {isRu ? poolTypeLabels[data.poolType]?.ru : poolTypeLabels[data.poolType]?.en}
                </Badge>
              )}
              {data.parkingType && data.parkingType !== 'none' && (
                <Badge variant="outline" className="text-[10px] py-0 gap-1">
                  <Car className="h-2.5 w-2.5" />
                  {isRu ? parkingTypeLabels[data.parkingType]?.ru : parkingTypeLabels[data.parkingType]?.en}
                </Badge>
              )}
              {data.gardenType && data.gardenType !== 'none' && (
                <Badge variant="outline" className="text-[10px] py-0 gap-1">
                  <TreePine className="h-2.5 w-2.5" />
                </Badge>
              )}
            </div>
          )}

          {/* Multi-unit info */}
          {!isStandalone && (data.floor || data.unitNumber) && (
            <div className="flex flex-wrap gap-1">
              {data.floor && (
                <Badge variant="outline" className="text-[10px] py-0">
                  {isRu ? `${data.floor} этаж` : `Floor ${data.floor}`}
                </Badge>
              )}
              {data.unitNumber && (
                <Badge variant="outline" className="text-[10px] py-0">
                  №{data.unitNumber}
                </Badge>
              )}
            </div>
          )}

          {/* View type */}
          {viewTypeValues
            .filter((viewType) => viewTypeLabels[viewType])
            .map((viewType) => (
              <Badge key={viewType} variant="secondary" className="text-[10px] py-0">
                {isRu ? viewTypeLabels[viewType]?.ru : viewTypeLabels[viewType]?.en}
              </Badge>
            ))}

          {normalizedFurnishingLevel && (
            <Badge variant="outline" className="text-[10px] py-0">
              {normalizedFurnishingLevel.replace(/_/g, ' ')}
            </Badge>
          )}

          {/* Equipment count */}
          {data.equipment && data.equipment.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              ✓ {data.equipment.length} {isRu ? 'удобств' : 'amenities'}
            </div>
          )}

          {/* Price */}
          <div className="pt-2 border-t">
            {priceFormatted ? (
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-base text-primary">
                  ฿{priceFormatted}
                </span>
                <span className="text-xs text-muted-foreground">
                  /{isRu ? 'ночь' : 'night'}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                {isRu ? 'Укажите цену' : 'Set price'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const LivePropertyPreview = memo(LivePropertyPreviewInner);
