/**
 * HotelPropertyCard — purpose-built card for operational hotel listings.
 *
 * Differs from CommercialPropertyCard by surfacing hospitality KPIs:
 * keys, star rating (pip-stars), ADR, RevPAR, occupancy %, management status,
 * and license type. Auth-gated metrics (ADR/RevPAR/GOP) shown as "Sign in" hint
 * for anonymous users.
 */
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  Star,
  Lock,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  getCommercialTypeLabel,
  getHotelLicenseLabel,
  getHotelManagementStatusLabel,
} from '@/lib/real-estate/commercialTaxonomy';
import type { CommercialProperty } from '@/hooks/useCommercialProperties';

interface Props {
  property: CommercialProperty;
  className?: string;
}

function StarPips({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={cn(
              'h-3 w-3',
              filled ? 'fill-accent text-accent' : 'text-muted-foreground/40',
            )}
          />
        );
      })}
    </span>
  );
}

export function HotelPropertyCard({ property, className }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const isAuthed = !!user;

  const isRent = property.listing_type === 'rent';
  const isSeekingOperator = property.hotel_management_status === 'seeking_operator';
  const title = (isRu ? property.title_ru : property.title_en) || property.title_en;
  const typeLabel = getCommercialTypeLabel(property.property_type, isRu);
  const cover = property.cover_image || property.images?.[0] || null;
  const license = getHotelLicenseLabel(property.hotel_license_type, isRu);
  const mgmtStatus = getHotelManagementStatusLabel(property.hotel_management_status, isRu);

  const intentLabel = isSeekingOperator
    ? isRu ? 'Ищет оператора' : 'Operator wanted'
    : isRent
    ? isRu ? 'Аренда здания' : 'Building lease'
    : isRu ? 'Продажа' : 'For sale';

  const intentColor = isSeekingOperator
    ? 'bg-primary/95 text-white hover:bg-primary'
    : isRent
    ? 'bg-primary/95 text-white hover:bg-primary'
    : 'bg-accent/95 text-white hover:bg-accent';

  const priceMain = isSeekingOperator
    ? null
    : isRent && property.monthly_rent_thb
    ? `${formatPrice(property.monthly_rent_thb)} / ${isRu ? 'мес' : 'mo'}`
    : property.sale_price
    ? formatPrice(property.sale_price)
    : property.price
    ? formatPrice(property.price)
    : null;

  return (
    <Link
      to={APP_ROUTES.HOTEL_DETAIL(property.id)}
      className={cn(
        'group block rounded-none border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow',
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
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <Badge className="bg-background/95 text-foreground hover:bg-background">
            {typeLabel}
          </Badge>
          <Badge className={cn('', intentColor)}>{intentLabel}</Badge>
        </div>
        {/* Top-right: stars + verified */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {property.is_verified && (
            <Badge className="bg-success/95 text-white hover:bg-success gap-1">
              <BadgeCheck className="w-3 h-3" />
              {isRu ? 'Проверено' : 'Verified'}
            </Badge>
          )}
          {property.hotel_star_rating != null && (
            <div className="rounded-full bg-background/95 px-2 py-1">
              <StarPips value={property.hotel_star_rating} />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2.5">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
          {property.district && (
            <p className="text-xs text-muted-foreground line-clamp-1">{property.district}</p>
          )}
        </div>

        {/* KPI strip — 4 metrics */}
        <div className="grid grid-cols-4 gap-2 py-2 border-y border-border/60">
          <div className="text-center">
            <div className="text-sm font-bold text-foreground tabular-nums">
              {property.hotel_keys ?? '—'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {isRu ? 'Ключи' : 'Keys'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-foreground tabular-nums flex items-center justify-center gap-0.5">
              {isAuthed ? (
                property.hotel_adr_thb ? `฿${Math.round(property.hotel_adr_thb / 1000)}k` : '—'
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">ADR</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-foreground tabular-nums flex items-center justify-center gap-0.5">
              {isAuthed ? (
                property.hotel_revpar_thb ? `฿${Math.round(property.hotel_revpar_thb / 1000)}k` : '—'
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">RevPAR</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-foreground tabular-nums">
              {property.hotel_occupancy_pct != null ? `${Math.round(property.hotel_occupancy_pct)}%` : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {isRu ? 'Загр.' : 'Occ.'}
            </div>
          </div>
        </div>

        {/* Price + cap rate */}
        <div className="flex items-baseline justify-between gap-2 flex-wrap min-h-[20px]">
          {priceMain ? (
            <p className="text-base font-bold text-foreground">{priceMain}</p>
          ) : isSeekingOperator ? (
            <p className="text-xs font-medium text-primary dark:text-primary">
              {isRu ? 'Запрос предложения от оператора' : 'Operator proposal welcome'}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">{isRu ? 'По запросу' : 'On request'}</span>
          )}
          {property.cap_rate_pct != null && (
            <p className="text-xs font-medium text-success dark:text-success">
              Cap {property.cap_rate_pct.toFixed(1)}%
            </p>
          )}
        </div>

        {/* Status & License chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {mgmtStatus && (
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                property.hotel_management_status === 'under_hma'
                  ? 'bg-primary/10 text-primary dark:text-primary'
                  : property.hotel_management_status === 'seeking_operator'
                  ? 'bg-primary/10 text-primary dark:text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {property.hotel_operator_name && property.hotel_management_status === 'under_hma'
                ? `${mgmtStatus} · ${property.hotel_operator_name}`
                : mgmtStatus}
            </span>
          )}
          {license && (
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                property.hotel_license_type === 'full_hotel_license'
                  ? 'bg-success/10 text-success dark:text-success'
                  : property.hotel_license_type === 'pending'
                  ? 'bg-accent/10 text-accent dark:text-accent'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {license}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
