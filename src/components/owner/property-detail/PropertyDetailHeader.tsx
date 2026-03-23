import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Clock, CheckCircle2, XCircle, Bed, Bath, SquareStack, DollarSign } from 'lucide-react';

interface PropertyDetailHeaderProps {
  property: {
    cover_image?: string | null;
    images?: string[] | null;
    title: string;
    title_ru?: string | null;
    district?: string | null;
    address?: string | null;
    status: string;
    approval_status?: string | null;
    property_type?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area_sqm?: number | null;
    price_per_night?: number | null;
  };
  isRu: boolean;
}

const propertyTypeLabels: Record<string, { en: string; ru: string }> = {
  villa: { en: 'Villa', ru: 'Вилла' },
  apartment: { en: 'Apartment', ru: 'Квартира' },
  condo: { en: 'Condo', ru: 'Кондо' },
  house: { en: 'House', ru: 'Дом' },
  townhouse: { en: 'Townhouse', ru: 'Таунхаус' },
  penthouse: { en: 'Penthouse', ru: 'Пентхаус' },
};

export function PropertyDetailHeader({ property, isRu }: PropertyDetailHeaderProps) {
  const getStatusBadge = (status: string, approvalStatus?: string | null) => {
    if (approvalStatus === 'pending') {
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30 backdrop-blur-sm gap-1.5 px-3 py-1">
          <Clock className="h-3 w-3" />
          {isRu ? 'На проверке' : 'Under Review'}
        </Badge>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 backdrop-blur-sm gap-1.5 px-3 py-1">
          <XCircle className="h-3 w-3" />
          {isRu ? 'Доработка' : 'Revision'}
        </Badge>
      );
    }
    if (approvalStatus === 'approved' || status === 'active') {
      return (
        <Badge className="bg-success/20 text-success border-success/30 backdrop-blur-sm gap-1.5 px-3 py-1">
          <CheckCircle2 className="h-3 w-3" />
          {isRu ? 'Активен' : 'Active'}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="backdrop-blur-sm bg-background/50 gap-1.5 px-3 py-1">
        {isRu ? 'Черновик' : 'Draft'}
      </Badge>
    );
  };

  const images = property.images?.length
    ? property.images
    : property.cover_image
      ? [property.cover_image]
      : [];

  const typeLabel = property.property_type
    ? (isRu ? propertyTypeLabels[property.property_type]?.ru : propertyTypeLabels[property.property_type]?.en) || property.property_type
    : null;

  const specs = [
    property.bedrooms && { icon: Bed, value: property.bedrooms },
    property.bathrooms && { icon: Bath, value: property.bathrooms },
    property.area_sqm && { icon: SquareStack, value: `${property.area_sqm}${isRu ? 'м²' : 'sqm'}` },
  ].filter(Boolean) as { icon: any; value: string | number }[];

  return (
    <div className="mb-6 -mx-4 sm:-mx-6">
      {/* Hero image */}
      <div className="relative w-full aspect-[21/9] min-h-[200px] max-h-[320px] overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Home className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-4 right-4">
          {getStatusBadge(property.status, property.approval_status)}
        </div>

        {/* Title + location */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight drop-shadow-lg">
            {isRu && property.title_ru ? property.title_ru : property.title}
          </h1>
          {(property.district || property.address) && (
            <p className="text-white/70 text-sm mt-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {property.district || property.address}
            </p>
          )}
        </div>
      </div>

      {/* Specs ribbon */}
      {(typeLabel || specs.length > 0 || property.price_per_night) && (
        <div className="px-4 sm:px-6 py-3 bg-card border-b border-border flex items-center gap-4 overflow-x-auto text-sm">
          {typeLabel && (
            <Badge variant="outline" className="font-medium flex-shrink-0">
              {typeLabel}
            </Badge>
          )}
          {specs.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
              <s.icon className="h-4 w-4" />
              <span className="font-medium text-foreground">{s.value}</span>
            </span>
          ))}
          {property.price_per_night && (
            <span className="flex items-center gap-1 font-semibold text-success ml-auto flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5" />
              ฿{Number(property.price_per_night).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/{isRu ? 'ночь' : 'night'}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}