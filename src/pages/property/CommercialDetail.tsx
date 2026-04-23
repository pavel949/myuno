/**
 * Commercial property detail (Phase 1, read-only).
 * Hero + key metrics + specs + CTA. Lead routing to capital@myuno.app
 * until Phase 3 wires the CRM `commercial_inquiry` source.
 */
import { useParams } from 'react-router-dom';
import { Building2, Zap, Car, ShieldCheck, Calendar, Mail, BadgeCheck, Hotel, Star, TrendingUp, Lock } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCommercialProperty } from '@/hooks/useCommercialProperties';
import {
  getCommercialTypeLabel,
  getTitleDeedLabel,
  getHotelLicenseLabel,
  getHotelManagementStatusLabel,
  isHotelType,
} from '@/lib/real-estate/commercialTaxonomy';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

export default function CommercialDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { data: property, isLoading, error } = useCommercialProperty(id);
  const isHotel = isHotelType(property?.property_type);

  if (isLoading) {
    return (
      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3"><BackButton /></div>
        <Skeleton className="aspect-[16/9] mx-4 rounded-none mt-3" />
        <div className="px-4 py-4 space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3"><BackButton /></div>
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Объект не найден' : 'Listing not found'}
          </p>
        </div>
      </div>
    );
  }

  const isRent = property.listing_type === 'rent';
  const title = (isRu ? property.title_ru : property.title_en) || property.title_en;
  const description = (isRu ? property.description_ru : property.description_en) || '';
  const typeLabel = getCommercialTypeLabel(property.property_type, isRu);
  const titleDeed = getTitleDeedLabel(property.title_deed_type ?? null, isRu);
  const cover = property.cover_image || property.images?.[0] || null;

  const priceMain =
    isRent && property.monthly_rent_thb
      ? `${formatPrice(property.monthly_rent_thb)} / ${isRu ? 'мес' : 'mo'}`
      : property.sale_price
      ? formatPrice(property.sale_price)
      : property.price
      ? formatPrice(property.price)
      : null;

  return (
    <>
      <SEOHead title={`${title} — myUNO`} description={description.slice(0, 160)} />

      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3"><BackButton /></div>

        {/* Hero */}
        <div className="relative aspect-[16/9] mx-4 mt-3 rounded-none overflow-hidden bg-muted">
          {cover && (
            <img src={cover} alt={title} className="w-full h-full object-cover" />
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className="bg-background/95 text-foreground">{typeLabel}</Badge>
            <Badge className={isRent ? 'bg-primary/95 text-white' : 'bg-accent/95 text-white'}>
              {isRent ? (isRu ? 'Аренда' : 'Rent') : isRu ? 'Продажа' : 'Sale'}
            </Badge>
          </div>
          {property.is_verified && (
            <Badge className="absolute top-3 right-3 bg-success/95 text-white gap-1">
              <BadgeCheck className="w-3 h-3" />
              {isRu ? 'Проверено' : 'Verified'}
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-5 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {property.district && (
              <p className="text-sm text-muted-foreground mt-1">{property.district}</p>
            )}
          </div>

          {/* Key metrics strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {priceMain && (
              <Metric label={isRent ? (isRu ? 'Аренда' : 'Rent') : isRu ? 'Цена' : 'Price'} value={priceMain} />
            )}
            {property.cap_rate_pct != null && (
              <Metric label="Cap rate" value={`${property.cap_rate_pct.toFixed(1)}%`} />
            )}
            {property.noi_annual_thb != null && (
              <Metric label="NOI / yr" value={formatPrice(property.noi_annual_thb)} />
            )}
            {property.floor_area_sqm != null && (
              <Metric label={isRu ? 'Площадь' : 'Area'} value={`${property.floor_area_sqm} m²`} />
            )}
          </div>

          {/* Hotel-specific KPI section */}
          {isHotel && (
            <section className="rounded-none border border-accent/40/30 bg-gradient-to-br from-accent/5 to-transparent p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4 text-accent" />
                <h2 className="text-base font-semibold">{isRu ? 'Параметры отеля' : 'Hotel performance'}</h2>
                {property.hotel_star_rating != null && (
                  <div className="flex items-center gap-0.5 ml-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(property.hotel_star_rating!)
                            ? 'fill-accent text-accent'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {property.hotel_keys != null && (
                  <Metric label={isRu ? 'Номеров' : 'Keys'} value={String(property.hotel_keys)} />
                )}
                {property.hotel_brand && (
                  <Metric label={isRu ? 'Бренд' : 'Brand'} value={property.hotel_brand} />
                )}
                {property.hotel_occupancy_pct != null && (
                  <Metric label={isRu ? 'Загрузка' : 'Occupancy'} value={`${property.hotel_occupancy_pct.toFixed(0)}%`} />
                )}
                {property.hotel_year_renovated != null && (
                  <Metric label={isRu ? 'Реновация' : 'Renovated'} value={String(property.hotel_year_renovated)} />
                )}
              </div>

              {(property.hotel_adr_thb != null || property.hotel_revpar_thb != null || property.hotel_gop_margin_pct != null) && (
                <div className="pt-3 border-t border-accent/40/20">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    {isRu ? 'Финансовые метрики' : 'Financial metrics'}
                    {!user && <Lock className="w-3 h-3 ml-1" />}
                  </p>
                  {user ? (
                    <div className="grid grid-cols-3 gap-3">
                      {property.hotel_adr_thb != null && (
                        <Metric label="ADR" value={formatPrice(property.hotel_adr_thb)} />
                      )}
                      {property.hotel_revpar_thb != null && (
                        <Metric label="RevPAR" value={formatPrice(property.hotel_revpar_thb)} />
                      )}
                      {property.hotel_gop_margin_pct != null && (
                        <Metric label="GOP" value={`${property.hotel_gop_margin_pct.toFixed(1)}%`} />
                      )}
                    </div>
                  ) : (
                    <div className="rounded-none border border-dashed border-accent/40/40 bg-background/50 p-3 text-xs text-muted-foreground text-center">
                      {isRu ? 'Войдите, чтобы увидеть ADR, RevPAR и GOP%' : 'Sign in to view ADR, RevPAR and GOP%'}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {property.hotel_management_status && (
                  <Badge variant="secondary" className="bg-accent/15 text-accent dark:text-accent border-accent/40/30">
                    {getHotelManagementStatusLabel(property.hotel_management_status, isRu)}
                    {property.hotel_operator_name && ` · ${property.hotel_operator_name}`}
                  </Badge>
                )}
                {property.hotel_license_type && (
                  <Badge
                    variant="secondary"
                    className={
                      property.hotel_license_type === 'full_hotel_license'
                        ? 'bg-success/15 text-success dark:text-success border-success/40/30'
                        : 'bg-accent/15 text-accent dark:text-accent border-accent/40/30'
                    }
                  >
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {getHotelLicenseLabel(property.hotel_license_type, isRu)}
                  </Badge>
                )}
              </div>
            </section>
          )}

          {description && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{description}</p>
            </div>
          )}

          {/* Specs */}
          <section>
            <h2 className="text-base font-semibold mb-2">
              {isRu ? 'Характеристики' : 'Specs'}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {property.electricity_load_kw != null && (
                <SpecRow icon={<Zap className="w-3.5 h-3.5" />} label={isRu ? 'Электричество' : 'Electricity'} value={`${property.electricity_load_kw} kW`} />
              )}
              {property.parking_type && (
                <SpecRow icon={<Car className="w-3.5 h-3.5" />} label={isRu ? 'Парковка' : 'Parking'} value={property.parking_type} />
              )}
              {property.lease_remaining_months != null && (
                <SpecRow icon={<Calendar className="w-3.5 h-3.5" />} label={isRu ? 'Аренда осталось' : 'Lease remaining'} value={`${Math.round(property.lease_remaining_months / 12)} ${isRu ? 'лет' : 'yrs'}`} />
              )}
              {property.floor != null && (
                <SpecRow icon={<Building2 className="w-3.5 h-3.5" />} label={isRu ? 'Этаж' : 'Floor'} value={String(property.floor)} />
              )}
              {titleDeed && (
                <SpecRow icon={<ShieldCheck className="w-3.5 h-3.5" />} label={isRu ? 'Документ' : 'Title deed'} value={titleDeed} />
              )}
              {property.zoning && (
                <SpecRow icon={<ShieldCheck className="w-3.5 h-3.5" />} label={isRu ? 'Зонирование' : 'Zoning'} value={property.zoning} />
              )}
            </div>
          </section>

          {/* Permitted uses */}
          {property.permitted_uses && property.permitted_uses.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-2">
                {isRu ? 'Разрешённое использование' : 'Permitted uses'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {property.permitted_uses.map((use) => (
                  <Badge key={use} variant="secondary">{use}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* CTAs */}
          <div className="flex gap-2 sticky bottom-4 bg-background/95 p-3 -mx-4 border-t border-border sm:static sm:bg-transparent sm:p-0 sm:border-0">
            <Button className="flex-1" asChild>
              <a href={`mailto:capital@myuno.app?subject=${encodeURIComponent(`Inquiry: ${title}`)}`}>
                <Mail className="w-4 h-4 mr-1.5" />
                {isRu ? 'Запросить просмотр' : 'Request viewing'}
              </a>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a href={`mailto:capital@myuno.app?subject=${encodeURIComponent(`Financials: ${title}`)}`}>
                {isRu ? 'Финансовые данные' : 'Request financials'}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-none border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
