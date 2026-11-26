/**
 * ResaleDetail — detail page for a secondary market property
 */
import React, { useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, BedDouble, Bath, Maximize2, ArrowRightLeft,
  Shield, ChevronLeft, ChevronRight, Phone, ImageOff
} from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { SEOHead, createRealEstateListingSchema } from '@/components/seo';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

import { resaleOfferCurrency, useResaleProperty } from '@/hooks/useResaleProperties';
import { ResaleEnquiryForm } from '@/components/property/ResaleEnquiryForm';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';
import { publicJourneyReturn } from '@/lib/real-estate/publicJourney';
import { formatRecordedPrice } from '@/lib/format/price';

export default function ResaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);

  const { data: property, isLoading, isError, refetch } = useResaleProperty(id);
  const returnToResults = () => {
    const target = publicJourneyReturn(location, APP_ROUTES.RESALE);
    if ('delta' in target) navigate(target.delta);
    else navigate(target.href, { replace: target.replace, state: target.state });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-64 rounded-none" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-32 rounded-none" />
      </div>
    );
  }

  if (isError) {
    return <div className="space-y-4 p-6" role="alert">
      <BackButton fallbackPath={APP_ROUTES.RESALE} onClick={returnToResults} />
      <p>{isRu ? 'Не удалось загрузить объект. Попробуйте ещё раз.' : language === 'th' ? 'ไม่สามารถโหลดอสังหาริมทรัพย์ได้ โปรดลองอีกครั้ง' : 'The property could not be loaded. Try again.'}</p>
      <Button variant="outline" onClick={() => refetch()}>{isRu ? 'Повторить' : language === 'th' ? 'ลองอีกครั้ง' : 'Try again'}</Button>
    </div>;
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4"><BackButton fallbackPath={APP_ROUTES.RESALE} onClick={returnToResults} /><p className="text-muted-foreground">{isRu ? 'Объект не найден' : language === 'th' ? 'ไม่พบอสังหาริมทรัพย์' : 'Property not found'}</p></div>
      </div>
    );
  }

  const requestViewing = pickLang(language, { ru: 'Запросить показ', en: 'Request Viewing', th: 'ขอนัดชมอสังหาริมทรัพย์' });
  const title = (isRu && property.title_ru) ? property.title_ru : property.title;
  const priceOnRequest = isRu ? 'Цена по запросу' : language === 'th' ? 'สอบถามราคา' : 'Price on request';
  const recordedPrice = (amount: number | null | undefined) => formatRecordedPrice(amount, property.currency, { unknownLabel: priceOnRequest, formatTHB: formatPrice });
  const askingPriceLabel = recordedPrice(property.asking_price);
  const offerCurrency = resaleOfferCurrency(property);
  const description = (isRu && property.description_ru) ? property.description_ru : property.description;
  const images = property.media?.length
    ? property.media.map((m: any) => m.url || m)
    : property.cover_image
      ? [property.cover_image]
      : ['/placeholder.svg'];
  const imageIndex = Math.min(currentImageIdx, images.length - 1);
  const currentImage = typeof images[imageIndex] === 'string' ? images[imageIndex] as string : '/placeholder.svg';

  const premiumPercent = askingPriceLabel !== priceOnRequest && property.original_purchase_price && property.original_purchase_price > 0
    ? Math.round(((property.asking_price - property.original_purchase_price) / property.original_purchase_price) * 100)
    : null;

  const TITLE_TYPE_LABELS: Record<string, string> = {
    freehold: 'Freehold',
    leasehold: `Leasehold${property.lease_years_remaining ? ` (${property.lease_years_remaining} ${isRu ? 'лет' : 'yrs'})` : ''}`,
    company_structure: isRu ? 'Через компанию' : 'Company structure',
  };

  const seoTitle = `${title}${property.zone ? ` · ${property.zone}` : ''}${property.is_assignment ? ` · ${isRu ? 'Переуступка' : 'Assignment'}` : ''}`;
  const seoDescription = isRu
    ? `${title} в ${property.zone || 'Пхукет'}. ${askingPriceLabel}. ${property.is_assignment ? 'Переуступка прав.' : 'Вторичный рынок.'}`
    : `${title} in ${property.zone || 'Phuket'}. ${askingPriceLabel}. ${property.is_assignment ? 'Assignment.' : 'Secondary market.'}`;
  const seoImage = (typeof images[0] === 'string' && images[0]) || 'https://www.myuno.app/og-image.png';
  const canonicalUrl = `https://www.myuno.app${APP_ROUTES.RESALE_DETAIL(property.id)}`;
  const jsonLd = createRealEstateListingSchema({
    name: title,
    description: seoDescription,
    price: askingPriceLabel !== priceOnRequest ? property.asking_price : undefined,
    currency: askingPriceLabel !== priceOnRequest ? property.currency.trim().toUpperCase() : undefined,
    image: seoImage as string,
    url: canonicalUrl,
    bedrooms: property.bedrooms ?? undefined,
    bathrooms: property.bathrooms ?? undefined,
    area: property.area_sqm ?? undefined,
    address: property.zone ?? undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        image={seoImage as string}
        url={canonicalUrl}
        type="product"
        jsonLd={jsonLd}
      />
      <div className="ds-frame ds-frame-detail ds-page ds-page-with-navigation purchase-detail-grid">
        <div className="purchase-detail-intro min-w-0 space-y-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--bible-radius-media)] bg-muted">
            {failedImage === currentImage ? <div role="img" aria-label={isRu ? 'Фото недоступно' : language === 'th' ? 'ไม่มีรูปภาพ' : 'Photo unavailable'} className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageOff className="size-10" aria-hidden="true" /></div> : <img
              src={currentImage}
              alt={title}
              className="w-full h-full object-cover"
              onErrorCapture={() => setFailedImage(currentImage)}
            />}
            <div className="absolute top-3 left-3">
              <BackButton fallbackPath={APP_ROUTES.RESALE} onClick={returnToResults} />
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" aria-label={t('Предыдущее фото', 'Previous photo', 'ภาพก่อนหน้า')} disabled={imageIndex === 0} onClick={() => setCurrentImageIdx(imageIndex - 1)}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <span className="rounded-[var(--bible-radius-control)] bg-background px-2 py-1 text-body-sm tabular-nums" aria-live="polite">
                  {imageIndex + 1}/{images.length}
                </span>
                <Button type="button" variant="outline" size="icon" aria-label={t('Следующее фото', 'Next photo', 'ภาพถัดไป')} disabled={imageIndex >= images.length - 1} onClick={() => setCurrentImageIdx(imageIndex + 1)}>
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
            {property.is_assignment && (
              <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                <ArrowRightLeft className="w-3 h-3 mr-1" />
                {isRu ? 'Переуступка' : 'Assignment'}
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-h2 font-display text-foreground">{title}</h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{property.zone}{property.address ? `, ${property.address}` : ''}</span>
            </div>
          </div>
        </div>

        <aside className="purchase-detail-actions" aria-labelledby="resale-asking-price">
          <Card>
            <CardHeader>
              <h2 id="resale-asking-price" className="text-body-sm text-muted-foreground">{t('Цена продавца', 'Asking price', 'ราคาที่ผู้ขายตั้งไว้')}</h2>
              <p className="text-h3 font-display tabular-nums">{askingPriceLabel}</p>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button type="button" onClick={() => setShowLeadForm(true)}>
                <Phone className="size-4" aria-hidden="true" />
                {requestViewing}
              </Button>
              {offerCurrency && (
                <Button variant="outline" asChild>
                  <Link to={{ pathname: APP_ROUTES.RESALE_OFFER(property.id), search: location.search, hash: location.hash }} state={location.state}>
                    {t('Предложить цену', 'Make an offer', 'ยื่นข้อเสนอ')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="purchase-detail-facts min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {property.area_sqm && (
              <MetricCard
                label={isRu ? 'Площадь' : 'Area'}
                value={`${property.area_sqm} м²`}
              />
            )}
            {property.title_type && (
              <MetricCard
                label={t('Форма владения', 'Ownership type', 'รูปแบบการถือครอง')}
                value={TITLE_TYPE_LABELS[property.title_type] || property.title_type}
                icon={<Shield className="size-4 text-primary" aria-hidden="true" />}
              />
            )}
          </div>

          {/* Assignment Details */}
          {property.is_assignment && property.original_purchase_price && (
            <div className="bg-accent/10 border border-accent/30 rounded-none p-4 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4" />
                {isRu ? 'Условия переуступки' : 'Assignment Details'}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{isRu ? 'Покупка' : 'Original'}:</span>
                  <span className="ml-1 font-medium">{recordedPrice(property.original_purchase_price)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{isRu ? 'Сейчас' : 'Asking'}:</span>
                  <span className="ml-1 font-medium">{askingPriceLabel}</span>
                </div>
                {premiumPercent !== null && (
                  <div>
                    <span className="text-muted-foreground">{isRu ? 'Наценка' : 'Premium'}:</span>
                    <span className={cn("ml-1 font-medium", premiumPercent > 0 ? 'text-destructive' : 'text-primary')}>
                      {premiumPercent > 0 ? '+' : ''}{premiumPercent}%
                    </span>
                  </div>
                )}
                {property.transfer_fee_paid_by && (
                  <div>
                    <span className="text-muted-foreground">{isRu ? 'Комиссия' : 'Transfer fee'}:</span>
                    <span className="ml-1 font-medium capitalize">{property.transfer_fee_paid_by}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3">
            {property.bedrooms != null && (
              <SpecItem icon={<BedDouble className="w-4 h-4" />} label={isRu ? 'Спальни' : 'Bedrooms'} value={String(property.bedrooms)} />
            )}
            {property.bathrooms != null && (
              <SpecItem icon={<Bath className="w-4 h-4" />} label={isRu ? 'Ванные' : 'Bathrooms'} value={String(property.bathrooms)} />
            )}
            {property.floor && (
              <SpecItem icon={<Maximize2 className="w-4 h-4" />} label={isRu ? 'Этаж' : 'Floor'} value={String(property.floor)} />
            )}
          </div>

          {/* Description */}
          {description && (
            <div>
              <h3 className="font-semibold text-sm mb-2">{isRu ? 'Описание' : 'Description'}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lead Form — Sheet on mobile, Dialog on desktop */}
      <ResponsiveModal
        open={showLeadForm}
        onOpenChange={setShowLeadForm}
        title={requestViewing}
        description={title}
        size="md"
      >
        <ResaleEnquiryForm
          key={property.id}
          listingId={property.id}
          onClose={() => setShowLeadForm(false)}
        />
      </ResponsiveModal>
    </div>
  );
}

function MetricCard({ label, value, icon }: {
  label: string; value: string; icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--bible-radius-card)] border border-border bg-card p-3 text-center">
      {icon && <div className="flex justify-center mb-1">{icon}</div>}
      <p className="text-body-sm font-semibold">{value}</p>
      <p className="text-body-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--bible-radius-card)] bg-muted/50 p-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium">{value}</p>
        <p className="text-body-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
