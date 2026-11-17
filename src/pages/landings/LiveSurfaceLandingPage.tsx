import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Sunset, Home, GraduationCap, Stethoscope, Landmark, Wifi, ShoppingBag, Car, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { Button } from '@/components/ui/button';
import { pickLang } from '@/lib/i18n/pickLang';
import { PUBLIC_CONTENT_LAYOUT } from '@/design-system/ecosystemLayout';
import { SEOHead } from '@/components/seo';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';
import { APP_ROUTES } from '@/lib/config/routes';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const SERVICES = [
  { icon: Home, labelEn: 'Long-stay housing', labelRu: 'Долгосрочная аренда', descEn: 'Explore published long-stay offers', descRu: 'Опубликованные предложения долгосрочной аренды', path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`, color: 'primary', external: false },
  { icon: Landmark, labelEn: 'Thai bank account', labelRu: 'Тайский счёт', descEn: 'Bangkok Bank, Kasikorn, SCB', descRu: 'Bangkok Bank, Kasikorn, SCB', path: APP_ROUTES.BANKING, color: 'cluster-invest', external: false },
  { icon: GraduationCap, labelEn: 'Schools & kindergartens', labelRu: 'Школы и сады', descEn: 'Explore schools and admission information', descRu: 'Школы и информация о поступлении', path: APP_ROUTES.SCHOOL_FINDER, color: 'accent-amber', external: false },
  { icon: Stethoscope, labelEn: 'Medical & insurance', labelRu: 'Медицина и страховка', descEn: 'Explore clinics and care options', descRu: 'Клиники и варианты медицинской помощи', path: APP_ROUTES.MEDICAL, color: 'destructive', external: false },
  { icon: Car, labelEn: 'Transport & licence', labelRu: 'Транспорт и права', descEn: 'Lease, buy, Thai licence', descRu: 'Аренда, покупка, тайские права', path: APP_ROUTES.TRANSPORT, color: 'cluster-arrive', external: false },
  { icon: Wifi, labelEn: 'Home internet', labelRu: 'Домашний интернет', descEn: 'Discuss connection options with a coordinator', descRu: 'Обсудите подключение с координатором', path: APP_ROUTES.DELIVERY, color: 'accent-cyan', external: true },
  { icon: ShoppingBag, labelEn: 'Furniture & delivery', labelRu: 'Мебель и доставка', descEn: 'Ask about selection and delivery', descRu: 'Помощь с подбором и доставкой', path: APP_ROUTES.DELIVERY, color: 'accent-purple', external: false },
];

export default function LiveSurfaceLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = getWhatsAppUrl(t ? 'Здравствуйте! Планирую переезд и жизнь на Пхукете' : 'Hello! I plan to live in Phuket long-term');

  const seo = buildSurfaceSeo('live', t ? 'ru' : 'en');

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} url={seo.url} jsonLd={seo.jsonLd} />
      <LandingLayout
        icon={Sunset}
        title={t ? 'Жизнь на Пхукете' : 'Live in Phuket'}
        subtitle={t ? 'Дом, школа, банк, страховка, права — всё, что нужно для долгой жизни на острове' : 'Home, school, bank, insurance, licence, everything you need for the long haul'}
        heroCta={{ label: t ? 'Спланировать переезд' : 'Plan my move', onClick: () => navigate(APP_ROUTES.RELOCATE) }}
        whatsappUrl={whatsappUrl}
        whatsappLabel={t ? 'Обсудить с координатором' : 'Talk to a coordinator'}
      >
        <div className={`${PUBLIC_CONTENT_LAYOUT.marketing} pt-8`}>
          <Button asChild variant="outline">
            <Link to={APP_ROUTES.LIVE_CLUSTER}>
              {pickLang(language, { ru: 'Услуги для жизни на Пхукете', en: 'Services for everyday life in Phuket', th: 'บริการสำหรับชีวิตประจำวันในภูเก็ต' })}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
          <h2 className="text-xl font-bold font-display text-foreground mb-4 text-center">
            {t ? 'Всё для жизни — в одном месте' : 'Everything for living, in one place'}
          </h2>
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            const onClick = () => {
              // Internet provisioning flow not yet built — route to WhatsApp coordinator.
              if (s.external) window.open(whatsappUrl, '_blank');
              else navigate(s.path);
            };
            return (
              <button key={i} onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)]">
                <div className="w-11 h-11 rounded-none flex items-center justify-center shrink-0" style={{ background: tokenColor(s.color, 0.15) }}>
                  <Icon className="w-5 h-5" style={{ color: tokenColor(s.color) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{t ? s.labelRu : s.labelEn}</h3>
                  <p className="text-xs text-muted-foreground">{t ? s.descRu : s.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">{t ? 'Помощь с переездом' : 'Relocation support'}</p>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums">{t ? 'Индивидуальные условия' : 'Individual terms'}</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
            {t ? 'Расскажите о ваших задачах. Состав услуг, стоимость и сроки согласуются отдельно перед началом работы.' : 'Tell us what you need. Service scope, pricing and timing are agreed separately before work begins.'}
          </p>
        </div>
      </LandingLayout>
    </>
  );
}
