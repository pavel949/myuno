/**
 * Card surface for commercial RE listings — purpose-built for offices, warehouses,
 * retail/F&B, hotels. Differs from residential card by surfacing yield, NOI,
 * cap rate, electricity load, lease term remaining, title deed.
 */
import { Link } from 'react-router-dom';
import { Building2, Zap, Car, BadgeCheck, ShieldCheck, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  getCommercialTypeLabel,
  getTitleDeedLabel,
} from '@/lib/real-estate/commercialTaxonomy';
import type { CommercialProperty } from '@/hooks/useCommercialProperties';

interface Props {
  property: CommercialProperty;
  className?: string;
}

export function CommercialPropertyCard({ property, className }: Props) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const isRent = property.listing_type === 'rent';
  const title = (isRu ? property.title_ru : property.title_en) || property.title_en;
  const typeLabel = getCommercialTypeLabel(property.property_type, isRu);
  const cover = property.cover_image || property.images?.[0] || null;
  const titleDeed = getTitleDeedLabel(property.title_deed_type ?? null, isRu);

  const priceMain =
    isRent && property.monthly_rent_thb
      ? `${formatPrice(property.monthly_rent_thb)} / ${isRu ? 'мес' : 'mo'}`
      : property.sale_price
      ? formatPrice(property.sale_price)
      : property.price
      ? formatPrice(property.price)
      : null;

  return (
    <Link
      to={APP_ROUTES.COMMERCIAL_DETAIL(property.id)}
      className={cn(
        'group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow',
        className,
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Building2 className="w-10 h-10" />
          </div>
        )}
        {/* Top-left: type + intent */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-background/95 text-foreground hover:bg-background backdrop-blur-sm">
            {typeLabel}
          </Badge>
          <Badge
            className={cn(
              'backdrop-blur-sm',
              isRent
                ? 'bg-blue-500/95 text-white hover:bg-blue-500'
                : 'bg-amber-500/95 text-white hover:bg-amber-500',
            )}
          >
            {isRent ? (isRu ? 'Аренда' : 'Rent') : isRu ? 'Продажа' : 'Sale'}
          </Badge>
        </div>
        {/* Top-right: verified */}
        {property.is_verified && (
          <Badge className="absolute top-3 right-3 bg-emerald-500/95 text-white hover:bg-emerald-500 backdrop-blur-sm gap-1">
            <BadgeCheck className="w-3 h-3" />
            {isRu ? 'Проверено' : 'Verified'}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
          {property.district && (
            <p className="text-xs text-muted-foreground line-clamp-1">{property.district}</p>
          )}
        </div>

        {/* Price + yield strip */}
        {priceMain && (
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="text-base font-bold text-foreground">{priceMain}</p>
            {property.cap_rate_pct != null && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {isRu ? 'Cap rate' : 'Cap rate'} {property.cap_rate_pct.toFixed(1)}%
              </p>
            )}
          </div>
        )}

        {property.noi_annual_thb != null && (
          <p className="text-xs text-muted-foreground">
            NOI {formatPrice(property.noi_annual_thb)} / {isRu ? 'год' : 'yr'}
          </p>
        )}

        {/* Specs row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1.5 border-t border-border/60">
          {property.floor_area_sqm != null && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {property.floor_area_sqm} m²
            </span>
          )}
          {property.electricity_load_kw != null && (
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {property.electricity_load_kw} kW
            </span>
          )}
          {property.parking_type && property.parking_type !== 'none' && (
            <span className="inline-flex items-center gap-1">
              <Car className="w-3 h-3" />
              {isRu ? 'Парковка' : 'Parking'}
            </span>
          )}
          {property.lease_remaining_months != null && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {Math.round(property.lease_remaining_months / 12)} {isRu ? 'лет ост.' : 'yrs left'}
            </span>
          )}
        </div>

        {/* Title + permitted uses */}
        {(titleDeed || (property.permitted_uses && property.permitted_uses.length > 0)) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {titleDeed && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {titleDeed}
              </span>
            )}
            {property.permitted_uses?.slice(0, 2).map((use) => (
              <span
                key={use}
                className="px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px]"
              >
                {use}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
