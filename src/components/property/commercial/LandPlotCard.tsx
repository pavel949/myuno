/**
 * Card surface for land-plot listings — focuses on rai/ngan/wah, zoning,
 * title deed, road frontage, beachfront proximity.
 */
import { Link } from 'react-router-dom';
import { Trees, ShieldCheck, Route, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  getLandTypeLabel,
  getTitleDeedLabel,
  formatLandSize,
} from '@/lib/real-estate/commercialTaxonomy';
import type { CommercialProperty } from '@/hooks/useCommercialProperties';

interface Props {
  property: CommercialProperty;
  className?: string;
}

export function LandPlotCard({ property, className }: Props) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const isRent = property.listing_type === 'rent';
  const title = (isRu ? property.title_ru : property.title_en) || property.title_en;
  const typeLabel = getLandTypeLabel(property.property_type, isRu);
  const cover = property.cover_image || property.images?.[0] || null;
  const titleDeed = getTitleDeedLabel(property.title_deed_type ?? null, isRu);

  const priceMain = property.sale_price
    ? formatPrice(property.sale_price)
    : property.price
    ? formatPrice(property.price)
    : null;

  const sqm = property.land_size_sqm ?? (property.land_size_rai ? property.land_size_rai * 1600 : null);
  const sizeLabel = sqm ? formatLandSize(sqm, isRu) : null;

  return (
    <Link
      to={APP_ROUTES.LAND_DETAIL(property.id)}
      className={cn(
        'group block rounded-none border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow',
        className,
      )}
    >
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Trees className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-background/95 text-foreground hover:bg-background">
            {typeLabel}
          </Badge>
          <Badge
            className={cn(
              '',
              isRent
                ? 'bg-primary/95 text-white hover:bg-primary'
                : 'bg-accent/95 text-white hover:bg-accent',
            )}
          >
            {isRent ? (isRu ? 'Аренда' : 'Rent') : isRu ? 'Продажа' : 'Sale'}
          </Badge>
        </div>
        {property.is_verified && (
          <Badge className="absolute top-3 right-3 bg-success/95 text-white hover:bg-success gap-1">
            <BadgeCheck className="w-3 h-3" />
            {isRu ? 'Проверено' : 'Verified'}
          </Badge>
        )}
      </div>

      <div className="p-3.5 space-y-2">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
          {property.district && (
            <p className="text-xs text-muted-foreground line-clamp-1">{property.district}</p>
          )}
        </div>

        {priceMain && (
          <p className="text-base font-bold text-foreground">{priceMain}</p>
        )}

        {sizeLabel && (
          <p className="text-sm font-medium text-foreground">{sizeLabel}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1.5 border-t border-border/60">
          {titleDeed && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {titleDeed}
            </span>
          )}
          {property.frontage_m != null && (
            <span className="inline-flex items-center gap-1">
              <Route className="w-3 h-3" />
              {property.frontage_m}m {isRu ? 'фасад' : 'frontage'}
            </span>
          )}
          {property.zoning && (
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px]">
              {property.zoning}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
