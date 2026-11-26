import { ArrowLeft, FileQuestion, TriangleAlert } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ResaleEnquiryForm } from '@/components/property/ResaleEnquiryForm';
import { PageState } from '@/components/page/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { resaleOfferCurrency, useResaleProperty } from '@/hooks/useResaleProperties';
import { APP_ROUTES } from '@/lib/config/routes';
import { formatRecordedPrice } from '@/lib/format/price';
import { pickLang } from '@/lib/i18n/pickLang';

export default function ResaleOffer() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { data: property, isLoading, isError, refetch } = useResaleProperty(id);
  const listing = property?.status === 'active' ? {
    pathname: APP_ROUTES.RESALE_DETAIL(property.id), search: location.search, hash: location.hash,
  } : APP_ROUTES.RESALE;
  const back = (
    <Button variant="outline" className="self-start" asChild>
      <Link to={listing} state={location.state}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        {property?.status === 'active'
          ? t('К объявлению', 'Back to listing', 'กลับไปยังประกาศ')
          : t('К предложениям о продаже', 'Browse resale homes', 'ดูบ้านมือสอง')}
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="ds-frame ds-frame-form ds-page" role="status">
        <span className="sr-only">{t('Загружаем объявление', 'Loading listing', 'กำลังโหลดประกาศ')}</span>
        <div aria-hidden="true"><ContentSkeleton variant="card" count={2} /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <PageState
        heading="h1"
        icon={TriangleAlert}
        tone="warning"
        announcement="alert"
        title={t('Не удалось загрузить объявление', 'Listing could not be loaded', 'ไม่สามารถโหลดประกาศได้')}
        description={t('Попробуйте обновить объявление.', 'Try loading the listing again.', 'ลองโหลดประกาศอีกครั้ง')}
      >
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void refetch()}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button>
          {back}
        </div>
      </PageState>
    );
  }

  const offerCurrency = property ? resaleOfferCurrency(property) : null;
  if (!property || !offerCurrency) {
    return (
      <PageState
        heading="h1"
        icon={FileQuestion}
        title={t('Предложение недоступно', 'Offer requests are unavailable', 'ไม่สามารถส่งข้อเสนอได้')}
      >
        {back}
      </PageState>
    );
  }

  const title = (language === 'ru' && property.title_ru) || property.title;
  const unknownLabel = t('По запросу', 'On request', 'สอบถาม');
  const ask = formatRecordedPrice(property.asking_price, offerCurrency, { unknownLabel, formatTHB: formatPrice });
  const perMetre = formatRecordedPrice(property.price_per_sqm, offerCurrency, { unknownLabel, formatTHB: formatPrice });

  return (
    <div className="ds-frame ds-frame-detail ds-page ds-page-with-navigation space-y-6">
      <header className="space-y-3">
        {back}
        <h1 className="text-h2 font-display">{t('Предложить цену', 'Make an offer', 'ยื่นข้อเสนอ')}</h1>
        <p className="text-body text-muted-foreground">{title}</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Предложение продавцу', 'Your proposal to the seller', 'ข้อเสนอถึงผู้ขาย')}</CardTitle>
            <p className="text-body-sm text-muted-foreground">
              {t('Команда обсудит с продавцом вашу цену и условия.', 'The team will review your proposed price and terms with the seller.', 'ทีมงานจะตรวจสอบราคาและเงื่อนไขที่คุณเสนอร่วมกับผู้ขาย')}
            </p>
          </CardHeader>
          <CardContent>
            <ResaleEnquiryForm key={property.id} listingId={property.id} offerCurrency={offerCurrency} onClose={() => navigate(listing, { replace: true, state: location.state })} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('Данные объявления', 'Listing price', 'ราคาประกาศ')}</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-body-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt>{t('Цена продавца', 'Asking price', 'ราคาที่ผู้ขายตั้งไว้')}</dt>
                <dd className="font-semibold tabular-nums">{ask}</dd>
              </div>
              {perMetre !== unknownLabel && (
                <div className="flex flex-wrap justify-between gap-2">
                  <dt>{t('Цена за м²', 'Price per m²', 'ราคาต่อตารางเมตร')}</dt>
                  <dd className="tabular-nums">{perMetre}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
