/**
 * ThaiBusinessDetail — B2C business card (Russian-first) with sticky CTA bar
 * (Call · Message · Book). Feature-flag gated.
 */
import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, CalendarPlus, MapPin, Star, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UnifiedCatalogMap } from '@/components/map/UnifiedCatalogMap';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useThaiBusiness } from '@/hooks/thaiServices/useThaiServices';
import { ThaiChatSheet } from '@/components/thaiServices/ThaiChatSheet';
import { ThaiBookingSheet } from '@/components/thaiServices/ThaiBookingSheet';
import {
  thaiCategoryMeta, THAI_OWNERSHIP_LABELS, THAI_PAYMENT_METHODS, type ThaiService,
} from '@/types/thaiBusiness';

export default function ThaiBusinessDetail() {
  const enabled = useFeatureFlag('THAI_BUSINESS_LAYER');
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { data, isLoading } = useThaiBusiness(id);

  const [chatOpen, setChatOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    if (params.get('book') === '1') setBookOpen(true);
  }, [params]);

  if (!enabled) return <Navigate to={APP_ROUTES.DISCOVER} replace />;

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-56" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-32" /></div>;
  }
  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">{t('thai.detail.notFound')}</div>;
  }

  const { business, services } = data;
  const name = business.name_ru || business.name_en || business.name_th;
  const cat = thaiCategoryMeta(business.category);
  const ownership = business.ownership_type ? THAI_OWNERSHIP_LABELS[business.ownership_type] : null;
  const svcName = (s: ThaiService) => (language === 'ru' ? s.name_ru || s.name_th : s.name_th);
  const svcDesc = (s: ThaiService) => (language === 'ru' ? s.description_ru || s.description_th : s.description_th);
  const paymentLabels = business.payment_methods
    .map((m) => THAI_PAYMENT_METHODS.find((p) => p.id === m))
    .filter(Boolean)
    .map((p) => (language === 'ru' ? p!.ru : p!.en));

  return (
    <div className="pb-24">
      {/* Gallery */}
      <div className="relative">
        <button onClick={() => navigate(APP_ROUTES.THAI_SERVICES)} className="absolute top-3 left-3 z-10 bg-background/80 rounded-full p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex overflow-x-auto snap-x">
          {(business.gallery_urls?.length ? business.gallery_urls : [business.logo_url].filter(Boolean)).map((url, i) => (
            <img key={i} src={url as string} alt={name} className="h-56 w-full object-cover snap-center shrink-0" />
          ))}
          {!business.gallery_urls?.length && !business.logo_url && (
            <div className="h-56 w-full bg-muted flex items-center justify-center text-muted-foreground">
              {language === 'ru' ? cat.ru : cat.en}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-semibold text-foreground">{name}</h1>
            {business.rating_avg != null && (
              <span className="inline-flex items-center gap-0.5 text-sm shrink-0">
                <Star className="w-4 h-4 text-accent fill-accent" />{business.rating_avg.toFixed(1)}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{language === 'ru' ? cat.ru : cat.en}</span>
            {business.district && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5" />{business.district}</span>}
          </div>
          {ownership && <Badge variant="secondary" className="mt-2">{language === 'ru' ? ownership.ru : ownership.en}</Badge>}
        </div>

        {(business.description_ru || business.description_th) && (
          <section>
            <h2 className="font-medium text-foreground mb-1">{t('thai.detail.about')}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {language === 'ru' ? business.description_ru || business.description_th : business.description_th}
            </p>
          </section>
        )}

        {services.length > 0 && (
          <section>
            <h2 className="font-medium text-foreground mb-2">{t('thai.detail.services')}</h2>
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="flex justify-between gap-3 border border-border p-3">
                  <div>
                    <p className="text-foreground">{svcName(s)}</p>
                    {svcDesc(s) && <p className="text-xs text-muted-foreground">{svcDesc(s)}</p>}
                  </div>
                  <span className="font-mono text-foreground whitespace-nowrap">{formatPrice(s.price_thb)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {paymentLabels.length > 0 && (
          <section>
            <h2 className="font-medium text-foreground mb-1">{t('thai.detail.conditions')}</h2>
            <div className="flex flex-wrap gap-1.5">
              {paymentLabels.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
            </div>
          </section>
        )}

        {business.lat != null && business.lng != null && (
          <section>
            <h2 className="font-medium text-foreground mb-2">{t('thai.detail.location')}</h2>
            <div className="h-48 overflow-hidden border border-border">
              <UnifiedCatalogMap
                markers={[{ id: business.id, lat: Number(business.lat), lng: Number(business.lng), title: name }]}
                iconChar="🏪"
              />
            </div>
            {business.address && (
              <a
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary"
                href={`https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`}
                target="_blank" rel="noreferrer"
              >
                <MapPin className="w-3.5 h-3.5" />{t('thai.cta.openMap')}
              </a>
            )}
          </section>
        )}
      </div>

      {/* Sticky CTA bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border p-3 grid grid-cols-3 gap-2 max-w-screen-sm mx-auto">
        {business.phone ? (
          <Button variant="outline" asChild>
            <a href={`tel:${business.phone}`}><Phone className="w-4 h-4 mr-1" />{t('thai.cta.call')}</a>
          </Button>
        ) : (
          <Button variant="outline" disabled><Phone className="w-4 h-4 mr-1" />{t('thai.cta.call')}</Button>
        )}
        <Button variant="outline" onClick={() => setChatOpen(true)}>
          <MessageCircle className="w-4 h-4 mr-1" />{t('thai.cta.message')}
        </Button>
        <Button onClick={() => setBookOpen(true)}>
          <CalendarPlus className="w-4 h-4 mr-1" />{t('thai.cta.book')}
        </Button>
      </div>

      <ThaiChatSheet businessId={business.id} businessName={name} open={chatOpen} onOpenChange={setChatOpen} />
      <ThaiBookingSheet
        business={business}
        services={services}
        open={bookOpen}
        onOpenChange={setBookOpen}
        presetServiceId={services[0]?.id}
        onOpenChat={() => setChatOpen(true)}
      />
    </div>
  );
}
