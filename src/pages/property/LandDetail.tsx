/**
 * Land plot detail page (Phase 1, read-only).
 */
import { useParams } from 'react-router-dom';
import { Trees, ShieldCheck, Route, Mail, BadgeCheck } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCommercialProperty } from '@/hooks/useCommercialProperties';
import {
  getLandTypeLabel,
  getTitleDeedLabel,
  formatLandSize,
} from '@/lib/real-estate/commercialTaxonomy';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

export default function LandDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const { data: property, isLoading, error } = useCommercialProperty(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className={ECOSYSTEM_PAGE_CONTAINER}>
          <div className="px-4 pt-3"><BackButton /></div>
          <Skeleton className="aspect-[16/9] mx-4 rounded-2xl mt-3" />
        </div>
      </AppLayout>
    );
  }

  if (error || !property) {
    return (
      <AppLayout>
        <div className={ECOSYSTEM_PAGE_CONTAINER}>
          <div className="px-4 pt-3"><BackButton /></div>
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Участок не найден' : 'Plot not found'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isRent = property.listing_type === 'rent';
  const title = (isRu ? property.title_ru : property.title_en) || property.title_en;
  const description = (isRu ? property.description_ru : property.description_en) || '';
  const typeLabel = getLandTypeLabel(property.property_type, isRu);
  const titleDeed = getTitleDeedLabel(property.title_deed_type ?? null, isRu);
  const cover = property.cover_image || property.images?.[0] || null;
  const sqm = property.land_size_sqm ?? (property.land_size_rai ? property.land_size_rai * 1600 : null);
  const sizeLabel = sqm ? formatLandSize(sqm, isRu) : null;

  const priceMain = property.sale_price
    ? formatPrice(property.sale_price, 'THB')
    : property.price
    ? formatPrice(property.price, 'THB')
    : null;

  return (
    <AppLayout>
      <SEOHead title={`${title} — myUNO`} description={description.slice(0, 160)} />
      <div className={ECOSYSTEM_PAGE_CONTAINER}>
        <div className="px-4 pt-3"><BackButton /></div>

        <div className="relative aspect-[16/9] mx-4 mt-3 rounded-2xl overflow-hidden bg-muted">
          {cover ? (
            <img src={cover} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trees className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className="bg-background/95 text-foreground backdrop-blur-sm">{typeLabel}</Badge>
            <Badge className={isRent ? 'bg-blue-500/95 text-white' : 'bg-amber-500/95 text-white'}>
              {isRent ? (isRu ? 'Аренда' : 'Rent') : isRu ? 'Продажа' : 'Sale'}
            </Badge>
          </div>
          {property.is_verified && (
            <Badge className="absolute top-3 right-3 bg-emerald-500/95 text-white gap-1">
              <BadgeCheck className="w-3 h-3" />
              {isRu ? 'Проверено' : 'Verified'}
            </Badge>
          )}
        </div>

        <div className="px-4 py-5 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {property.district && (
              <p className="text-sm text-muted-foreground mt-1">{property.district}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {priceMain && <Metric label={isRu ? 'Цена' : 'Price'} value={priceMain} />}
            {sizeLabel && <Metric label={isRu ? 'Размер' : 'Size'} value={sizeLabel} />}
            {property.frontage_m != null && (
              <Metric label={isRu ? 'Фасад' : 'Frontage'} value={`${property.frontage_m} m`} />
            )}
          </div>

          {description && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {titleDeed && (
              <SpecRow icon={<ShieldCheck className="w-3.5 h-3.5" />} label={isRu ? 'Документ' : 'Title deed'} value={titleDeed} />
            )}
            {property.zoning && (
              <SpecRow icon={<ShieldCheck className="w-3.5 h-3.5" />} label={isRu ? 'Зонирование' : 'Zoning'} value={property.zoning} />
            )}
            {property.road_access && (
              <SpecRow icon={<Route className="w-3.5 h-3.5" />} label={isRu ? 'Подъезд' : 'Road access'} value={property.road_access} />
            )}
          </div>

          <div className="flex gap-2 sticky bottom-4 bg-background/95 backdrop-blur-sm p-3 -mx-4 border-t border-border sm:static sm:bg-transparent sm:p-0 sm:border-0">
            <Button className="flex-1" asChild>
              <a href={`mailto:capital@myuno.app?subject=${encodeURIComponent(`Inquiry: ${title}`)}`}>
                <Mail className="w-4 h-4 mr-1.5" />
                {isRu ? 'Запросить просмотр' : 'Request viewing'}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
